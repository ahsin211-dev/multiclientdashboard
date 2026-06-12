import { prisma } from "@/lib/db/prisma";
import { ratio, pctChange } from "@/lib/utils";
import { format } from "date-fns";
import {
  addTotals,
  deriveMetrics,
  emptyTotals,
  type RawTotals,
} from "./metrics";
import { previousRange } from "./date-ranges";
import type {
  CampaignPerformanceRow,
  DateRange,
  MetricSummary,
  MetricWithComparison,
  ProductPerformanceRow,
  SearchTermRow,
  TrendPoint,
} from "./types";

const rangeFilter = (range: DateRange) => ({
  gte: range.from,
  lte: range.to,
});

/** Aggregated ad + sales totals for a client over a date range. */
export async function getMetricSummary(
  clientId: string,
  range: DateRange
): Promise<MetricSummary> {
  const [ad, sales] = await Promise.all([
    prisma.adMetric.aggregate({
      where: { campaign: { clientId }, date: rangeFilter(range) },
      _sum: { spend: true, sales: true, impressions: true, clicks: true, orders: true },
    }),
    prisma.salesMetric.aggregate({
      where: { clientId, date: rangeFilter(range) },
      _sum: { orderedRevenue: true, orderedUnits: true },
    }),
  ]);

  const totals: RawTotals = {
    spend: ad._sum.spend ?? 0,
    sales: ad._sum.sales ?? 0,
    impressions: ad._sum.impressions ?? 0,
    clicks: ad._sum.clicks ?? 0,
    orders: ad._sum.orders ?? 0,
    revenue: sales._sum.orderedRevenue ?? 0,
    units: sales._sum.orderedUnits ?? 0,
  };

  return deriveMetrics(totals);
}

export async function getMetricsWithComparison(
  clientId: string,
  range: DateRange
): Promise<MetricWithComparison> {
  const prev = previousRange(range);
  const [current, previous] = await Promise.all([
    getMetricSummary(clientId, range),
    getMetricSummary(clientId, prev),
  ]);

  const keys = Object.keys(current) as (keyof MetricSummary)[];
  const delta = {} as Record<keyof MetricSummary, number>;
  for (const k of keys) {
    delta[k] = pctChange(current[k], previous[k]);
  }

  return { current, previous, delta };
}

/** Daily trend series combining ad metrics + total revenue. */
export async function getTrend(
  clientId: string,
  range: DateRange
): Promise<TrendPoint[]> {
  const [adRows, salesRows] = await Promise.all([
    prisma.adMetric.groupBy({
      by: ["date"],
      where: { campaign: { clientId }, date: rangeFilter(range) },
      _sum: { spend: true, sales: true, impressions: true, clicks: true, orders: true },
    }),
    prisma.salesMetric.groupBy({
      by: ["date"],
      where: { clientId, date: rangeFilter(range) },
      _sum: { orderedRevenue: true },
    }),
  ]);

  const byDate = new Map<string, RawTotals>();
  for (const r of adRows) {
    const key = format(r.date, "yyyy-MM-dd");
    byDate.set(
      key,
      addTotals(byDate.get(key) ?? emptyTotals(), {
        spend: r._sum.spend ?? 0,
        sales: r._sum.sales ?? 0,
        impressions: r._sum.impressions ?? 0,
        clicks: r._sum.clicks ?? 0,
        orders: r._sum.orders ?? 0,
      })
    );
  }
  for (const r of salesRows) {
    const key = format(r.date, "yyyy-MM-dd");
    byDate.set(
      key,
      addTotals(byDate.get(key) ?? emptyTotals(), {
        revenue: r._sum.orderedRevenue ?? 0,
      })
    );
  }

  return [...byDate.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, t]) => ({
      date,
      spend: round(t.spend),
      sales: round(t.sales),
      revenue: round(t.revenue),
      impressions: t.impressions,
      clicks: t.clicks,
      orders: t.orders,
      acos: round(ratio(t.spend, t.sales)),
      tacos: round(ratio(t.spend, t.revenue)),
      roas: round(ratio(t.sales, t.spend)),
    }));
}

export async function getCampaignPerformance(
  clientId: string,
  range: DateRange
): Promise<CampaignPerformanceRow[]> {
  const campaigns = await prisma.campaign.findMany({
    where: { clientId },
    select: { id: true, name: true, type: true, state: true, dailyBudget: true },
  });

  const metrics = await prisma.adMetric.groupBy({
    by: ["campaignId"],
    where: { campaign: { clientId }, date: rangeFilter(range) },
    _sum: { spend: true, sales: true, impressions: true, clicks: true, orders: true },
  });
  const metricMap = new Map(metrics.map((m) => [m.campaignId, m._sum]));

  return campaigns
    .map((c) => {
      const m = metricMap.get(c.id);
      const spend = m?.spend ?? 0;
      const sales = m?.sales ?? 0;
      const impressions = m?.impressions ?? 0;
      const clicks = m?.clicks ?? 0;
      const orders = m?.orders ?? 0;
      return {
        id: c.id,
        name: c.name,
        type: c.type,
        state: c.state,
        dailyBudget: c.dailyBudget,
        spend: round(spend),
        sales: round(sales),
        impressions,
        clicks,
        orders,
        acos: round(ratio(spend, sales)),
        roas: round(ratio(sales, spend)),
        ctr: round(ratio(clicks, impressions), 4),
        cpc: round(ratio(spend, clicks)),
        cvr: round(ratio(orders, clicks), 4),
      };
    })
    .sort((a, b) => b.spend - a.spend);
}

export async function getProductPerformance(
  clientId: string,
  range: DateRange
): Promise<ProductPerformanceRow[]> {
  const products = await prisma.product.findMany({
    where: { clientId },
    select: { id: true, asin: true, title: true, imageUrl: true, price: true },
  });

  const metrics = await prisma.salesMetric.groupBy({
    by: ["productId"],
    where: { clientId, date: rangeFilter(range), productId: { not: null } },
    _sum: { orderedRevenue: true, orderedUnits: true, sessions: true },
    _avg: { conversionRate: true, buyBoxPct: true },
  });
  const metricMap = new Map(metrics.map((m) => [m.productId, m]));

  return products
    .map((p) => {
      const m = metricMap.get(p.id);
      return {
        id: p.id,
        asin: p.asin,
        title: p.title,
        imageUrl: p.imageUrl,
        price: p.price,
        revenue: round(m?._sum.orderedRevenue ?? 0),
        units: m?._sum.orderedUnits ?? 0,
        sessions: m?._sum.sessions ?? 0,
        conversionRate: round(m?._avg.conversionRate ?? 0, 4),
        buyBoxPct: round(m?._avg.buyBoxPct ?? 0, 4),
      };
    })
    .sort((a, b) => b.revenue - a.revenue);
}

export async function getSearchTerms(
  clientId: string,
  range: DateRange,
  limit = 100
): Promise<SearchTermRow[]> {
  const rows = await prisma.searchTerm.groupBy({
    by: ["query", "matchType"],
    where: { campaign: { clientId }, date: rangeFilter(range) },
    _sum: { impressions: true, clicks: true, spend: true, orders: true, sales: true },
    orderBy: { _sum: { spend: "desc" } },
    take: limit,
  });

  return rows.map((r) => {
    const impressions = r._sum.impressions ?? 0;
    const clicks = r._sum.clicks ?? 0;
    const spend = r._sum.spend ?? 0;
    const orders = r._sum.orders ?? 0;
    const sales = r._sum.sales ?? 0;
    return {
      query: r.query,
      matchType: r.matchType,
      impressions,
      clicks,
      spend: round(spend),
      orders,
      sales: round(sales),
      acos: round(ratio(spend, sales)),
      ctr: round(ratio(clicks, impressions), 4),
      cvr: round(ratio(orders, clicks), 4),
    };
  });
}

function round(n: number, digits = 2): number {
  const f = 10 ** digits;
  return Math.round(n * f) / f;
}
