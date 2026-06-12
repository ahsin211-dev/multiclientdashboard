import { subDays, startOfDay } from "date-fns";
import type { CampaignType, MatchType } from "@prisma/client";

/**
 * Deterministic-ish mock data generator. Produces a realistic, normalized
 * dataset for a client that matches the Prisma schema shape. Used by the seed
 * script and by the sync layer when real Amazon credentials are not present.
 *
 * A seeded PRNG keeps output stable across runs for the same seed string.
 */

function makeRng(seedStr: string) {
  let h = 1779033703 ^ seedStr.length;
  for (let i = 0; i < seedStr.length; i++) {
    h = Math.imul(h ^ seedStr.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  return () => {
    h = Math.imul(h ^ (h >>> 16), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    h ^= h >>> 16;
    return (h >>> 0) / 4294967296;
  };
}

const between = (rng: () => number, min: number, max: number) =>
  min + rng() * (max - min);
const intBetween = (rng: () => number, min: number, max: number) =>
  Math.floor(between(rng, min, max + 1));
const pick = <T>(rng: () => number, arr: T[]): T =>
  arr[Math.floor(rng() * arr.length)];

export interface MockCampaign {
  externalId: string;
  name: string;
  type: CampaignType;
  dailyBudget: number;
  targetingType: string;
  efficiency: number; // hidden quality factor (0.5 weak .. 1.5 strong)
}

export interface MockKeyword {
  externalId: string;
  campaignExternalId: string;
  adGroupExternalId: string;
  text: string;
  matchType: MatchType;
  bid: number;
}

export interface MockProduct {
  asin: string;
  sku: string;
  title: string;
  price: number;
  category: string;
}

export interface MockDataset {
  campaigns: MockCampaign[];
  adGroups: { externalId: string; campaignExternalId: string; name: string; defaultBid: number }[];
  keywords: MockKeyword[];
  products: MockProduct[];
  // Time series
  adMetrics: {
    campaignExternalId: string;
    keywordExternalId?: string;
    date: Date;
    impressions: number;
    clicks: number;
    spend: number;
    orders: number;
    sales: number;
  }[];
  searchTerms: {
    campaignExternalId: string;
    adGroupExternalId: string;
    query: string;
    matchType: MatchType;
    date: Date;
    impressions: number;
    clicks: number;
    spend: number;
    orders: number;
    sales: number;
  }[];
  salesMetrics: {
    asin: string;
    date: Date;
    orderedUnits: number;
    orderedRevenue: number;
    sessions: number;
    pageViews: number;
    buyBoxPct: number;
    conversionRate: number;
  }[];
  sqpMetrics: {
    query: string;
    asin: string;
    date: Date;
    impressionShare: number;
    clickShare: number;
    cartAddShare: number;
    purchaseShare: number;
    searchQueryVolume: number;
    totalImpressions: number;
    totalClicks: number;
    totalPurchases: number;
  }[];
}

const CAMPAIGN_TYPES: CampaignType[] = [
  "SPONSORED_PRODUCTS",
  "SPONSORED_PRODUCTS",
  "SPONSORED_BRANDS",
  "SPONSORED_DISPLAY",
];

const MATCH_TYPES: MatchType[] = ["EXACT", "PHRASE", "BROAD"];

/**
 * @param days number of days of history to generate.
 */
export function generateClientDataset(
  seed: string,
  niche: {
    productNouns: string[];
    keywordSeeds: string[];
    categories: string[];
  },
  days = 60
): MockDataset {
  const rng = makeRng(seed);
  const today = startOfDay(new Date());

  // --- Products ---
  const products: MockProduct[] = [];
  const numProducts = intBetween(rng, 4, 7);
  for (let i = 0; i < numProducts; i++) {
    const noun = pick(rng, niche.productNouns);
    products.push({
      asin: `B0${seed.slice(0, 2).toUpperCase()}${intBetween(rng, 100000, 999999)}`,
      sku: `SKU-${seed.slice(0, 3).toUpperCase()}-${i + 1}`,
      title: `${capitalize(pick(rng, ["Premium", "Pro", "Eco", "Ultra", "Daily"]))} ${noun} ${pick(rng, ["XL", "2-Pack", "Bundle", "Kit", "Refill"])}`,
      price: round(between(rng, 14.99, 79.99)),
      category: pick(rng, niche.categories),
    });
  }

  // --- Campaigns + ad groups + keywords ---
  const campaigns: MockCampaign[] = [];
  const adGroups: MockDataset["adGroups"] = [];
  const keywords: MockKeyword[] = [];
  const numCampaigns = intBetween(rng, 5, 8);
  for (let c = 0; c < numCampaigns; c++) {
    const type = pick(rng, CAMPAIGN_TYPES);
    const targetingType = rng() > 0.6 ? "auto" : "manual";
    const campaignExternalId = `cmp-${seed.slice(0, 3)}-${c + 1}`;
    campaigns.push({
      externalId: campaignExternalId,
      name: `${capitalize(pick(rng, niche.productNouns))} | ${type === "SPONSORED_BRANDS" ? "SB" : type === "SPONSORED_DISPLAY" ? "SD" : "SP"} | ${targetingType === "auto" ? "Auto" : "Exact"}`,
      type,
      dailyBudget: round(between(rng, 20, 200)),
      targetingType,
      efficiency: between(rng, 0.55, 1.5),
    });

    const numAdGroups = intBetween(rng, 1, 2);
    for (let g = 0; g < numAdGroups; g++) {
      const adGroupExternalId = `${campaignExternalId}-ag-${g + 1}`;
      adGroups.push({
        externalId: adGroupExternalId,
        campaignExternalId,
        name: `Ad Group ${g + 1}`,
        defaultBid: round(between(rng, 0.4, 2.5)),
      });
      const numKw = intBetween(rng, 4, 8);
      for (let k = 0; k < numKw; k++) {
        const text = `${pick(rng, niche.keywordSeeds)} ${pick(rng, ["", "best", "for women", "for men", "organic", "cheap", "set", "gift"])}`.trim();
        keywords.push({
          externalId: `${adGroupExternalId}-kw-${k + 1}`,
          campaignExternalId,
          adGroupExternalId,
          text,
          matchType: targetingType === "auto" ? "AUTO" : pick(rng, MATCH_TYPES),
          bid: round(between(rng, 0.3, 3.0)),
        });
      }
    }
  }

  // --- Time series ---
  const adMetrics: MockDataset["adMetrics"] = [];
  const searchTerms: MockDataset["searchTerms"] = [];
  const salesMetrics: MockDataset["salesMetrics"] = [];
  const sqpMetrics: MockDataset["sqpMetrics"] = [];

  for (let d = days - 1; d >= 0; d--) {
    const date = subDays(today, d);
    // Weekend / trend factor.
    const dow = date.getDay();
    const weekend = dow === 0 || dow === 6 ? 1.15 : 1;
    const trend = 1 + (days - d) / (days * 6); // mild upward trend

    // Campaign-level ad metrics
    let dayAdSales = 0;
    for (const cmp of campaigns) {
      const baseImpr = intBetween(rng, 400, 4000) * weekend * trend;
      const impressions = Math.round(baseImpr);
      const ctr = between(rng, 0.002, 0.012) * cmp.efficiency;
      const clicks = Math.max(0, Math.round(impressions * ctr));
      const cpc = between(rng, 0.4, 2.2);
      const spend = round(clicks * cpc);
      const cvr = between(rng, 0.04, 0.18) * cmp.efficiency;
      const orders = Math.round(clicks * cvr);
      const aov = between(rng, 20, 70);
      const sales = round(orders * aov);
      dayAdSales += sales;
      adMetrics.push({
        campaignExternalId: cmp.externalId,
        date,
        impressions,
        clicks,
        spend,
        orders,
        sales,
      });
    }

    // Search terms (a few per day, some wasteful)
    const numTerms = intBetween(rng, 3, 6);
    for (let t = 0; t < numTerms; t++) {
      const cmp = pick(rng, campaigns);
      const ag = adGroups.find((a) => a.campaignExternalId === cmp.externalId);
      const wasteful = rng() > 0.7; // ~30% wasteful terms
      const clicks = intBetween(rng, 1, wasteful ? 20 : 12);
      const cpc = between(rng, 0.5, 2.5);
      const spend = round(clicks * cpc);
      const cvr = wasteful ? 0 : between(rng, 0.05, 0.2);
      const orders = Math.round(clicks * cvr);
      const sales = round(orders * between(rng, 20, 60));
      searchTerms.push({
        campaignExternalId: cmp.externalId,
        adGroupExternalId: ag?.externalId ?? `${cmp.externalId}-ag-1`,
        query: `${pick(rng, niche.keywordSeeds)} ${pick(rng, ["", "near me", "review", "amazon", "2024", "bulk", "organic"])}`.trim(),
        matchType: pick(rng, MATCH_TYPES),
        date,
        impressions: intBetween(rng, clicks * 30, clicks * 300),
        clicks,
        spend,
        orders,
        sales,
      });
    }

    // Product sales metrics. Total business revenue is anchored to the day's ad
    // sales so TACOS (= spend / revenue) lands in a believable range: ad sales
    // is treated as ~25–45% of total revenue, the rest being organic.
    const adSalesShare = between(rng, 0.25, 0.45);
    const dayRevenue = dayAdSales / adSalesShare;
    const weights = products.map(() => between(rng, 0.5, 1.5));
    const weightSum = weights.reduce((s, w) => s + w, 0) || 1;
    products.forEach((p, pi) => {
      const productRevenue = dayRevenue * (weights[pi] / weightSum);
      const units = Math.max(0, Math.round(productRevenue / p.price));
      const cvr = between(rng, 0.06, 0.2);
      const sessions = Math.max(units, Math.round(units / cvr));
      salesMetrics.push({
        asin: p.asin,
        date,
        sessions,
        pageViews: Math.round(sessions * between(rng, 1.1, 1.6)),
        orderedUnits: units,
        orderedRevenue: round(units * p.price),
        buyBoxPct: round(between(rng, 0.7, 0.99), 4),
        conversionRate: round(cvr, 4),
      });
    });
  }

  // --- SQP metrics: weekly-ish snapshots for top queries ---
  const sqpQueries = uniq(
    niche.keywordSeeds.map((k) => k).slice(0, 12)
  );
  for (let d = days - 1; d >= 0; d -= 7) {
    const date = subDays(today, d);
    for (const q of sqpQueries) {
      const impressionShare = round(between(rng, 0.05, 0.6), 4);
      const clickShare = round(impressionShare * between(rng, 0.3, 1.1), 4);
      const cartAddShare = round(clickShare * between(rng, 0.4, 0.9), 4);
      const purchaseShare = round(cartAddShare * between(rng, 0.4, 0.95), 4);
      const volume = intBetween(rng, 500, 20000);
      sqpMetrics.push({
        query: q,
        asin: pick(rng, products).asin,
        date,
        impressionShare,
        clickShare,
        cartAddShare,
        purchaseShare,
        searchQueryVolume: volume,
        totalImpressions: Math.round(volume * between(rng, 5, 30)),
        totalClicks: Math.round(volume * between(rng, 0.2, 1.2)),
        totalPurchases: Math.round(volume * between(rng, 0.02, 0.2)),
      });
    }
  }

  return { campaigns, adGroups, keywords, products, adMetrics, searchTerms, salesMetrics, sqpMetrics };
}

function round(n: number, digits = 2): number {
  const f = 10 ** digits;
  return Math.round(n * f) / f;
}
function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
function uniq<T>(arr: T[]): T[] {
  return [...new Set(arr)];
}
