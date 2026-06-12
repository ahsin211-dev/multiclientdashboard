import { prisma } from "@/lib/db/prisma";
import type {
  DateRange,
  ScalingOpportunity,
  WastedSpendItem,
} from "./types";
import { getCampaignPerformance, getSearchTermPerformance } from "./metrics";

export async function getWastedSpend(
  clientId: string,
  range: DateRange,
  acosThreshold = 50
): Promise<WastedSpendItem[]> {
  const items: WastedSpendItem[] = [];

  const campaigns = await getCampaignPerformance(clientId, range);
  for (const c of campaigns) {
    if (c.spend >= 50 && (c.acos > acosThreshold || c.sales === 0)) {
      items.push({
        entityType: "campaign",
        entityId: c.id,
        name: c.name,
        spend: c.spend,
        sales: c.sales,
        acos: c.acos,
        reason:
          c.sales === 0
            ? `$${c.spend.toFixed(0)} spend with zero attributed sales`
            : `ACOS ${c.acos.toFixed(1)}% exceeds ${acosThreshold}% threshold`,
      });
    }
  }

  const searchTerms = await getSearchTermPerformance(clientId, range);
  for (const t of searchTerms) {
    if (t.spend >= 25 && (t.acos > acosThreshold || t.sales === 0)) {
      items.push({
        entityType: "search_term",
        entityId: t.id,
        name: t.query,
        spend: t.spend,
        sales: t.sales,
        acos: t.acos,
        reason:
          t.sales === 0
            ? `$${t.spend.toFixed(0)} spend with zero sales on search term`
            : `ACOS ${t.acos.toFixed(1)}% on search term exceeds threshold`,
      });
    }
  }

  const keywords = await prisma.keyword.findMany({
    where: { adGroup: { campaign: { clientId } } },
    include: {
      adMetrics: {
        where: { date: { gte: range.from, lte: range.to } },
      },
    },
  });

  for (const kw of keywords) {
    const spend = kw.adMetrics.reduce((s, m) => s + m.spend, 0);
    const sales = kw.adMetrics.reduce((s, m) => s + m.sales, 0);
    const acos = sales > 0 ? (spend / sales) * 100 : 0;

    if (spend >= 20 && (acos > acosThreshold || sales === 0)) {
      items.push({
        entityType: "keyword",
        entityId: kw.id,
        name: kw.keyword,
        spend,
        sales,
        acos,
        reason:
          sales === 0
            ? `$${spend.toFixed(0)} spend with zero sales`
            : `ACOS ${acos.toFixed(1)}% exceeds threshold`,
      });
    }
  }

  return items.sort((a, b) => b.spend - a.spend);
}

export async function getScalingOpportunities(
  clientId: string,
  range: DateRange
): Promise<ScalingOpportunity[]> {
  const opportunities: ScalingOpportunity[] = [];

  const campaigns = await getCampaignPerformance(clientId, range);
  for (const c of campaigns) {
    if (c.roas >= 4 && c.acos < 25 && c.spend < 500) {
      opportunities.push({
        entityType: "campaign",
        entityId: c.id,
        name: c.name,
        currentSpend: c.spend,
        roas: c.roas,
        acos: c.acos,
        reason: `Strong ROAS ${c.roas.toFixed(1)}x at ${c.acos.toFixed(1)}% ACOS with room to scale budget`,
        priority: c.roas >= 6 ? "high" : "medium",
      });
    }
  }

  const sqpMetrics = await prisma.sQPMetric.findMany({
    where: {
      clientId,
      date: { gte: range.from, lte: range.to },
      purchaseShare: { gte: 10 },
      ppcSpend: { lt: 100 },
    },
    orderBy: { purchaseShare: "desc" },
    take: 20,
  });

  for (const m of sqpMetrics) {
    opportunities.push({
      entityType: "sqp_query",
      entityId: m.id,
      name: m.query,
      currentSpend: m.ppcSpend,
      roas: m.ppcSpend > 0 ? m.ppcSales / m.ppcSpend : 0,
      acos: m.ppcAcos ?? 0,
      reason: `High purchase share (${(m.purchaseShare ?? 0).toFixed(1)}%) with only $${m.ppcSpend.toFixed(0)} PPC spend`,
      priority: (m.purchaseShare ?? 0) >= 20 ? "high" : "medium",
    });
  }

  const keywords = await prisma.keyword.findMany({
    where: { adGroup: { campaign: { clientId } } },
    include: {
      adMetrics: {
        where: { date: { gte: range.from, lte: range.to } },
      },
    },
  });

  for (const kw of keywords) {
    const spend = kw.adMetrics.reduce((s, m) => s + m.spend, 0);
    const sales = kw.adMetrics.reduce((s, m) => s + m.sales, 0);
    const roas = spend > 0 ? sales / spend : 0;
    const acos = sales > 0 ? (spend / sales) * 100 : 0;

    if (roas >= 5 && acos < 20 && spend < 100) {
      opportunities.push({
        entityType: "keyword",
        entityId: kw.id,
        name: kw.keyword,
        currentSpend: spend,
        roas,
        acos,
        reason: `Keyword ROAS ${roas.toFixed(1)}x — increase bids/budget`,
        priority: roas >= 8 ? "high" : "medium",
      });
    }
  }

  const priorityOrder = { high: 0, medium: 1, low: 2 };
  return opportunities.sort(
    (a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]
  );
}

export async function getPerformanceSummary(
  clientId: string,
  range: DateRange
) {
  const [wastedSpend, scaling, campaigns, sqpCount] = await Promise.all([
    getWastedSpend(clientId, range),
    getScalingOpportunities(clientId, range),
    getCampaignPerformance(clientId, range),
    prisma.sQPMetric.count({
      where: {
        clientId,
        date: { gte: range.from, lte: range.to },
      },
    }),
  ]);

  const totalWasted = wastedSpend.reduce((s, w) => s + w.spend, 0);
  const highAcosCampaigns = campaigns.filter((c) => c.acos > 40);
  const strongRoasCampaigns = campaigns.filter((c) => c.roas >= 4);

  return {
    wastedSpendTotal: totalWasted,
    wastedSpendItems: wastedSpend.slice(0, 10),
    scalingOpportunities: scaling.slice(0, 10),
    highAcosCampaigns: highAcosCampaigns.slice(0, 5),
    strongRoasCampaigns: strongRoasCampaigns.slice(0, 5),
    sqpDataAvailable: sqpCount > 0,
    sqpQueryCount: sqpCount,
  };
}
