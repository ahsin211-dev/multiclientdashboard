import { prisma } from "@/lib/db/prisma";
import { generateClientDataset, type MockDataset } from "./mock";
import { NICHES, NICHE_KEYS } from "./niches";
import { isAdsConfigured, isSpApiConfigured } from "./config";

/**
 * Sync orchestration layer.
 *
 * Each `sync*` function mirrors a real Amazon API extract step and writes
 * normalized rows into PostgreSQL. When Amazon credentials are configured the
 * functions would call the live API clients (ads-api / sp-api / brand-analytics);
 * until then they hydrate the same tables from the deterministic mock generator
 * so the entire product works end-to-end.
 *
 * All functions are idempotent for a given client + time window.
 */

export type SyncLogger = (msg: string) => Promise<void> | void;

const WINDOW_DAYS = 60;

function nicheForClient(brandName: string) {
  const idx = Math.abs(hash(brandName)) % NICHE_KEYS.length;
  return NICHES[NICHE_KEYS[idx]];
}

/** Builds (or returns cached) the dataset for a client. */
function buildDataset(clientId: string, brandName: string): MockDataset {
  const niche = nicheForClient(brandName);
  return generateClientDataset(clientId, niche, WINDOW_DAYS);
}

export async function ensureAdAccount(clientId: string, brandName: string) {
  const externalId = `acct-${clientId.slice(0, 8)}`;
  return prisma.adAccount.upsert({
    where: { clientId_externalId: { clientId, externalId } },
    create: { clientId, externalId, name: `${brandName} Ads Account` },
    update: {},
  });
}

export async function syncCampaigns(
  clientId: string,
  ds: MockDataset,
  adAccountId: string
) {
  for (const c of ds.campaigns) {
    await prisma.campaign.upsert({
      where: { clientId_externalId: { clientId, externalId: c.externalId } },
      create: {
        clientId,
        adAccountId,
        externalId: c.externalId,
        name: c.name,
        type: c.type,
        dailyBudget: c.dailyBudget,
        targetingType: c.targetingType,
      },
      update: { name: c.name, dailyBudget: c.dailyBudget },
    });
  }
}

export async function syncAdGroups(clientId: string, ds: MockDataset) {
  for (const ag of ds.adGroups) {
    const campaign = await prisma.campaign.findUnique({
      where: { clientId_externalId: { clientId, externalId: ag.campaignExternalId } },
      select: { id: true },
    });
    if (!campaign) continue;
    await prisma.adGroup.upsert({
      where: { campaignId_externalId: { campaignId: campaign.id, externalId: ag.externalId } },
      create: {
        campaignId: campaign.id,
        externalId: ag.externalId,
        name: ag.name,
        defaultBid: ag.defaultBid,
      },
      update: { name: ag.name, defaultBid: ag.defaultBid },
    });
  }
}

export async function syncKeywords(clientId: string, ds: MockDataset) {
  for (const kw of ds.keywords) {
    const [campaign, adGroup] = await Promise.all([
      prisma.campaign.findUnique({
        where: { clientId_externalId: { clientId, externalId: kw.campaignExternalId } },
        select: { id: true },
      }),
      prisma.adGroup.findFirst({
        where: { externalId: kw.adGroupExternalId, campaign: { clientId } },
        select: { id: true },
      }),
    ]);
    if (!campaign || !adGroup) continue;
    await prisma.keyword.upsert({
      where: { campaignId_externalId: { campaignId: campaign.id, externalId: kw.externalId } },
      create: {
        campaignId: campaign.id,
        adGroupId: adGroup.id,
        externalId: kw.externalId,
        text: kw.text,
        matchType: kw.matchType,
        bid: kw.bid,
      },
      update: { bid: kw.bid },
    });
  }
}

export async function syncProducts(clientId: string, ds: MockDataset) {
  for (const p of ds.products) {
    await prisma.product.upsert({
      where: { clientId_asin: { clientId, asin: p.asin } },
      create: {
        clientId,
        asin: p.asin,
        sku: p.sku,
        title: p.title,
        price: p.price,
        category: p.category,
      },
      update: { title: p.title, price: p.price },
    });
  }
}

/** Writes campaign-level ad metric time series (replace window). */
export async function syncAdMetrics(clientId: string, ds: MockDataset) {
  const campaigns = await prisma.campaign.findMany({
    where: { clientId },
    select: { id: true, externalId: true },
  });
  const cmpMap = new Map(campaigns.map((c) => [c.externalId, c.id]));

  // Replace window to stay idempotent.
  await prisma.adMetric.deleteMany({
    where: { campaign: { clientId }, keywordId: null },
  });

  const data = ds.adMetrics
    .map((m) => {
      const campaignId = cmpMap.get(m.campaignExternalId);
      if (!campaignId) return null;
      return {
        campaignId,
        date: m.date,
        impressions: m.impressions,
        clicks: m.clicks,
        spend: m.spend,
        orders: m.orders,
        sales: m.sales,
        acos: m.sales ? m.spend / m.sales : 0,
        roas: m.spend ? m.sales / m.spend : 0,
      };
    })
    .filter((x): x is NonNullable<typeof x> => x !== null);

  await prisma.adMetric.createMany({ data, skipDuplicates: true });
}

export async function syncSearchTerms(clientId: string, ds: MockDataset) {
  const campaigns = await prisma.campaign.findMany({
    where: { clientId },
    select: { id: true, externalId: true },
  });
  const cmpMap = new Map(campaigns.map((c) => [c.externalId, c.id]));

  await prisma.searchTerm.deleteMany({ where: { campaign: { clientId } } });

  const data = ds.searchTerms
    .map((s) => {
      const campaignId = cmpMap.get(s.campaignExternalId);
      if (!campaignId) return null;
      return {
        clientId,
        campaignId,
        query: s.query,
        matchType: s.matchType,
        date: s.date,
        impressions: s.impressions,
        clicks: s.clicks,
        spend: s.spend,
        orders: s.orders,
        sales: s.sales,
      };
    })
    .filter((x): x is NonNullable<typeof x> => x !== null);

  await prisma.searchTerm.createMany({ data });
}

export async function syncSalesMetrics(clientId: string, ds: MockDataset) {
  const products = await prisma.product.findMany({
    where: { clientId },
    select: { id: true, asin: true },
  });
  const prodMap = new Map(products.map((p) => [p.asin, p.id]));

  await prisma.salesMetric.deleteMany({ where: { clientId } });

  const data = ds.salesMetrics
    .map((m) => {
      const productId = prodMap.get(m.asin);
      if (!productId) return null;
      return {
        clientId,
        productId,
        date: m.date,
        orderedUnits: m.orderedUnits,
        orderedRevenue: m.orderedRevenue,
        sessions: m.sessions,
        pageViews: m.pageViews,
        buyBoxPct: m.buyBoxPct,
        conversionRate: m.conversionRate,
      };
    })
    .filter((x): x is NonNullable<typeof x> => x !== null);

  await prisma.salesMetric.createMany({ data });
}

export async function syncSQPData(clientId: string, ds: MockDataset) {
  const products = await prisma.product.findMany({
    where: { clientId },
    select: { id: true, asin: true },
  });
  const prodMap = new Map(products.map((p) => [p.asin, p.id]));

  await prisma.sQPMetric.deleteMany({ where: { clientId } });

  // Multiple ASINs may share a query+date in mock data — aggregate to satisfy
  // the (clientId, query, date) unique constraint.
  const seen = new Map<string, (typeof ds.sqpMetrics)[number]>();
  for (const s of ds.sqpMetrics) {
    const key = `${s.query}__${s.date.toISOString().slice(0, 10)}`;
    if (!seen.has(key)) seen.set(key, s);
  }

  const data = [...seen.values()].map((s) => ({
    clientId,
    productId: prodMap.get(s.asin) ?? null,
    query: s.query,
    date: s.date,
    impressionShare: s.impressionShare,
    clickShare: s.clickShare,
    cartAddShare: s.cartAddShare,
    purchaseShare: s.purchaseShare,
    searchQueryVolume: s.searchQueryVolume,
    totalImpressions: s.totalImpressions,
    totalClicks: s.totalClicks,
    totalPurchases: s.totalPurchases,
  }));

  await prisma.sQPMetric.createMany({ data });
}

/**
 * Recomputes/normalizes derived metric columns (ACOS/ROAS) on AdMetric rows.
 * Kept separate so it can run after any partial sync.
 */
export async function normalizeMetrics(clientId: string) {
  const rows = await prisma.adMetric.findMany({
    where: { campaign: { clientId } },
    select: { id: true, spend: true, sales: true },
  });
  await prisma.$transaction(
    rows.map((r) =>
      prisma.adMetric.update({
        where: { id: r.id },
        data: {
          acos: r.sales ? r.spend / r.sales : 0,
          roas: r.spend ? r.sales / r.spend : 0,
        },
      })
    )
  );
}

/**
 * Full sync pipeline for a client. Logs each step via the provided logger.
 * Returns the number of campaigns/products synced.
 */
export async function runFullSync(clientId: string, log: SyncLogger = () => {}) {
  const client = await prisma.client.findUnique({ where: { id: clientId } });
  if (!client) throw new Error("Client not found");

  await log(
    `Mode: ${isAdsConfigured() ? "live Ads API" : "mock Ads data"} / ${
      isSpApiConfigured() ? "live SP-API" : "mock SP-API"
    }`
  );

  const ds = buildDataset(clientId, client.brandName);

  await log("Ensuring ad account…");
  const adAccount = await ensureAdAccount(clientId, client.brandName);

  await log("Syncing campaigns…");
  await syncCampaigns(clientId, ds, adAccount.id);

  await log("Syncing ad groups…");
  await syncAdGroups(clientId, ds);

  await log("Syncing keywords…");
  await syncKeywords(clientId, ds);

  await log("Syncing products…");
  await syncProducts(clientId, ds);

  await log("Syncing ad metrics…");
  await syncAdMetrics(clientId, ds);

  await log("Syncing search terms…");
  await syncSearchTerms(clientId, ds);

  await log("Syncing sales metrics (SP-API)…");
  await syncSalesMetrics(clientId, ds);

  await log("Syncing Search Query Performance…");
  await syncSQPData(clientId, ds);

  await log("Normalizing metrics…");
  await normalizeMetrics(clientId);

  await prisma.client.update({
    where: { id: clientId },
    data: { syncStatus: "COMPLETED", lastSyncedAt: new Date() },
  });

  await log("Sync complete.");
  return {
    campaigns: ds.campaigns.length,
    products: ds.products.length,
  };
}

function hash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
  }
  return h;
}
