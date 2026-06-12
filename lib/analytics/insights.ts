import { prisma } from "@/lib/db/prisma";
import { ratio } from "@/lib/utils";
import type { DateRange } from "./types";
import { getCampaignPerformance, getProductPerformance } from "./service";
import { analyzeSqp } from "@/lib/sqp/analyzer";

export interface WastedSpendItem {
  query: string;
  campaignId?: string;
  spend: number;
  clicks: number;
  orders: number;
  sales: number;
  acos: number;
  reason: string;
}

export interface ScalingOpportunity {
  label: string;
  type: "campaign" | "keyword" | "sqp";
  id?: string;
  metricValue: number;
  reason: string;
}

const inRange = (range: DateRange) => ({ gte: range.from, lte: range.to });

/**
 * Search terms / keywords burning budget with no (or unprofitable) returns.
 * "Wasted" = spend above a floor with zero orders, or ACOS far above target.
 */
export async function getWastedSpend(
  clientId: string,
  range: DateRange,
  opts: { targetAcos?: number; minSpend?: number } = {}
): Promise<WastedSpendItem[]> {
  const targetAcos = opts.targetAcos ?? 0.3;
  const minSpend = opts.minSpend ?? 5;

  const rows = await prisma.searchTerm.groupBy({
    by: ["query"],
    where: { campaign: { clientId }, date: inRange(range) },
    _sum: { spend: true, clicks: true, orders: true, sales: true },
    having: { spend: { _sum: { gte: minSpend } } },
  });

  const items: WastedSpendItem[] = [];
  for (const r of rows) {
    const spend = r._sum.spend ?? 0;
    const clicks = r._sum.clicks ?? 0;
    const orders = r._sum.orders ?? 0;
    const sales = r._sum.sales ?? 0;
    const acos = ratio(spend, sales);

    if (orders === 0) {
      items.push({
        query: r.query,
        spend: round(spend),
        clicks,
        orders,
        sales: round(sales),
        acos: 0,
        reason: `${clicks} clicks, $${spend.toFixed(2)} spent, 0 orders.`,
      });
    } else if (acos > targetAcos * 2) {
      items.push({
        query: r.query,
        spend: round(spend),
        clicks,
        orders,
        sales: round(sales),
        acos: round(acos),
        reason: `ACOS ${(acos * 100).toFixed(0)}% is more than 2x target.`,
      });
    }
  }

  return items.sort((a, b) => b.spend - a.spend);
}

export async function getScalingOpportunities(
  clientId: string,
  range: DateRange,
  opts: { targetAcos?: number } = {}
): Promise<ScalingOpportunity[]> {
  const targetAcos = opts.targetAcos ?? 0.3;
  const out: ScalingOpportunity[] = [];

  const campaigns = await getCampaignPerformance(clientId, range);
  for (const c of campaigns) {
    if (
      c.state === "ENABLED" &&
      c.spend > 0 &&
      c.acos > 0 &&
      c.acos <= targetAcos * 0.8 &&
      c.orders >= 5
    ) {
      out.push({
        label: c.name,
        type: "campaign",
        id: c.id,
        metricValue: c.roas,
        reason: `ROAS ${c.roas.toFixed(1)}x at ${(c.acos * 100).toFixed(
          0
        )}% ACOS — headroom to raise budget/bids.`,
      });
    }
  }

  const sqp = await analyzeSqp(clientId, range, { targetAcos });
  for (const s of sqp.filter((r) => r.action === "SCALE").slice(0, 8)) {
    out.push({
      label: s.query,
      type: "sqp",
      metricValue: s.purchaseShare,
      reason: s.reason,
    });
  }

  return out.sort((a, b) => b.metricValue - a.metricValue);
}

/** High-ACOS enabled campaigns that need immediate attention. */
export async function getHighAcosCampaigns(
  clientId: string,
  range: DateRange,
  opts: { targetAcos?: number } = {}
) {
  const targetAcos = opts.targetAcos ?? 0.3;
  const campaigns = await getCampaignPerformance(clientId, range);
  return campaigns.filter(
    (c) => c.spend > 0 && c.acos > targetAcos * 1.3 && c.state === "ENABLED"
  );
}

/** Keywords with poor CTR despite meaningful impressions. */
export async function getLowCtrKeywords(clientId: string, range: DateRange) {
  const rows = await prisma.adMetric.groupBy({
    by: ["keywordId"],
    where: {
      campaign: { clientId },
      date: inRange(range),
      keywordId: { not: null },
    },
    _sum: { impressions: true, clicks: true, spend: true, sales: true },
    having: { impressions: { _sum: { gte: 1000 } } },
  });

  const keywordIds = rows.map((r) => r.keywordId!).filter(Boolean);
  const keywords = await prisma.keyword.findMany({
    where: { id: { in: keywordIds } },
    select: { id: true, text: true, matchType: true },
  });
  const kwMap = new Map(keywords.map((k) => [k.id, k]));

  return rows
    .map((r) => {
      const impressions = r._sum.impressions ?? 0;
      const clicks = r._sum.clicks ?? 0;
      const ctr = ratio(clicks, impressions);
      const kw = kwMap.get(r.keywordId!);
      return {
        keywordId: r.keywordId!,
        text: kw?.text ?? "(unknown)",
        matchType: kw?.matchType ?? "",
        impressions,
        clicks,
        ctr: round(ctr, 4),
        spend: round(r._sum.spend ?? 0),
      };
    })
    .filter((k) => k.ctr < 0.0025)
    .sort((a, b) => a.ctr - b.ctr);
}

/** Products with weak conversion despite traffic. */
export async function getProductConversionIssues(
  clientId: string,
  range: DateRange
) {
  const products = await getProductPerformance(clientId, range);
  return products
    .filter((p) => p.sessions >= 200 && p.conversionRate < 0.08)
    .map((p) => ({
      asin: p.asin,
      title: p.title,
      sessions: p.sessions,
      conversionRate: p.conversionRate,
      buyBoxPct: p.buyBoxPct,
    }));
}

function round(n: number, digits = 2): number {
  const f = 10 ** digits;
  return Math.round(n * f) / f;
}
