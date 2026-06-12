import { Prisma } from "@prisma/client";
import { format } from "date-fns";

import { prisma } from "@/lib/db/prisma";
import type { DashboardSummary, MetricComparison, TrendPoint } from "@/lib/types";
import { previousDateRange, resolveDateRange } from "@/lib/analytics/date-range";

type AggregateMetric = {
  spend: number;
  sales: number;
  impressions: number;
  clicks: number;
  orders: number;
  revenue: number;
};

function decimalToNumber(value: Prisma.Decimal | number | null | undefined) {
  if (value === null || value === undefined) return 0;
  return typeof value === "number" ? value : value.toNumber();
}

function toComparison(current: number, previous: number): MetricComparison {
  const delta = current - previous;
  const deltaPct = previous === 0 ? (current > 0 ? 100 : 0) : (delta / previous) * 100;
  return {
    current,
    previous,
    delta,
    deltaPct
  };
}

function deriveRatios(metric: AggregateMetric) {
  const ctr = metric.impressions ? metric.clicks / metric.impressions : 0;
  const cpc = metric.clicks ? metric.spend / metric.clicks : 0;
  const cvr = metric.clicks ? metric.orders / metric.clicks : 0;
  const acos = metric.sales ? metric.spend / metric.sales : 0;
  const roas = metric.spend ? metric.sales / metric.spend : 0;
  const tacos = metric.revenue ? metric.spend / metric.revenue : 0;

  return { ctr, cpc, cvr, acos, roas, tacos };
}

async function aggregateMetrics(clientId: string, from: Date, to: Date): Promise<AggregateMetric> {
  const [adAgg, salesAgg] = await Promise.all([
    prisma.adMetric.aggregate({
      where: { clientId, date: { gte: from, lte: to } },
      _sum: {
        spend: true,
        sales: true,
        impressions: true,
        clicks: true,
        orders: true
      }
    }),
    prisma.salesMetric.aggregate({
      where: { clientId, date: { gte: from, lte: to } },
      _sum: {
        revenue: true
      }
    })
  ]);

  return {
    spend: decimalToNumber(adAgg._sum.spend),
    sales: decimalToNumber(adAgg._sum.sales),
    impressions: adAgg._sum.impressions ?? 0,
    clicks: adAgg._sum.clicks ?? 0,
    orders: adAgg._sum.orders ?? 0,
    revenue: decimalToNumber(salesAgg._sum.revenue)
  };
}

export async function getPerformanceSummary(
  clientId: string,
  preset: "last7" | "last30" | "custom" = "last7",
  customFrom?: string,
  customTo?: string
): Promise<DashboardSummary> {
  const currentRange = resolveDateRange(preset, customFrom, customTo);
  const previousRange = previousDateRange(currentRange);

  const [current, previous] = await Promise.all([
    aggregateMetrics(clientId, currentRange.from, currentRange.to),
    aggregateMetrics(clientId, previousRange.from, previousRange.to)
  ]);

  const currentRatios = deriveRatios(current);
  const previousRatios = deriveRatios(previous);

  return {
    spend: toComparison(current.spend, previous.spend),
    sales: toComparison(current.sales, previous.sales),
    tacos: toComparison(currentRatios.tacos, previousRatios.tacos),
    acos: toComparison(currentRatios.acos, previousRatios.acos),
    roas: toComparison(currentRatios.roas, previousRatios.roas),
    impressions: toComparison(current.impressions, previous.impressions),
    clicks: toComparison(current.clicks, previous.clicks),
    ctr: toComparison(currentRatios.ctr, previousRatios.ctr),
    cpc: toComparison(currentRatios.cpc, previousRatios.cpc),
    cvr: toComparison(currentRatios.cvr, previousRatios.cvr),
    orders: toComparison(current.orders, previous.orders),
    revenue: toComparison(current.revenue, previous.revenue)
  };
}

export async function getTrendSeries(
  clientId: string,
  preset: "last7" | "last30" | "custom" = "last7",
  customFrom?: string,
  customTo?: string
): Promise<TrendPoint[]> {
  const range = resolveDateRange(preset, customFrom, customTo);
  const metrics = await prisma.adMetric.findMany({
    where: { clientId, date: { gte: range.from, lte: range.to } },
    orderBy: { date: "asc" },
    select: {
      date: true,
      spend: true,
      sales: true
    }
  });

  const grouped = new Map<string, { spend: number; sales: number }>();
  for (const metric of metrics) {
    const key = format(metric.date, "yyyy-MM-dd");
    const existing = grouped.get(key) ?? { spend: 0, sales: 0 };
    existing.spend += decimalToNumber(metric.spend);
    existing.sales += decimalToNumber(metric.sales);
    grouped.set(key, existing);
  }

  return Array.from(grouped.entries()).map(([date, values]) => {
    const acos = values.sales ? values.spend / values.sales : 0;
    const tacos = values.sales ? values.spend / values.sales : 0;
    return {
      date,
      spend: values.spend,
      sales: values.sales,
      acos,
      tacos
    };
  });
}

export async function getCampaignPerformance(clientId: string, limit = 10) {
  const campaigns = await prisma.campaign.findMany({
    where: { clientId },
    include: {
      adMetrics: {
        orderBy: { date: "desc" },
        take: 30
      }
    },
    take: limit
  });

  return campaigns.map((campaign) => {
    const spend = campaign.adMetrics.reduce((sum, row) => sum + decimalToNumber(row.spend), 0);
    const sales = campaign.adMetrics.reduce((sum, row) => sum + decimalToNumber(row.sales), 0);
    const clicks = campaign.adMetrics.reduce((sum, row) => sum + row.clicks, 0);
    const impressions = campaign.adMetrics.reduce((sum, row) => sum + row.impressions, 0);
    const orders = campaign.adMetrics.reduce((sum, row) => sum + row.orders, 0);

    return {
      id: campaign.id,
      name: campaign.name,
      spend,
      sales,
      acos: sales ? spend / sales : 0,
      roas: spend ? sales / spend : 0,
      impressions,
      clicks,
      ctr: impressions ? clicks / impressions : 0,
      orders
    };
  });
}

export async function getProductPerformance(clientId: string, limit = 10) {
  const products = await prisma.product.findMany({
    where: { clientId },
    include: {
      salesMetrics: {
        orderBy: { date: "desc" },
        take: 30
      }
    },
    take: limit
  });

  return products.map((product) => {
    const revenue = product.salesMetrics.reduce(
      (sum, row) => sum + decimalToNumber(row.revenue),
      0
    );
    const orders = product.salesMetrics.reduce((sum, row) => sum + row.orders, 0);
    const sessions = product.salesMetrics.reduce((sum, row) => sum + row.sessions, 0);
    const conversionRate = sessions ? orders / sessions : 0;

    return {
      id: product.id,
      asin: product.asin,
      title: product.title,
      revenue,
      orders,
      conversionRate
    };
  });
}

export async function getSearchTermPerformance(clientId: string, limit = 25) {
  const rows = await prisma.searchTerm.findMany({
    where: { clientId },
    orderBy: { date: "desc" },
    take: limit
  });

  return rows.map((row) => ({
    id: row.id,
    query: row.query,
    spend: decimalToNumber(row.spend),
    sales: decimalToNumber(row.sales),
    clicks: row.clicks,
    orders: row.orders,
    acos: decimalToNumber(row.acos),
    roas: decimalToNumber(row.roas)
  }));
}
