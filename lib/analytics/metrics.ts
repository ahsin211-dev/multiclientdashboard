import { prisma } from "@/lib/db/prisma";
import type {
  CampaignPerformance,
  DateRange,
  MetricSummary,
  MetricWithComparison,
  ProductPerformance,
  SearchTermPerformance,
  TrendDataPoint,
} from "./types";
import { getComparisonRange } from "./date-ranges";

function aggregateAdMetrics(
  metrics: Array<{
    impressions: number;
    clicks: number;
    spend: number;
    sales: number;
    orders: number;
  }>,
  revenue: number
): MetricSummary {
  const spend = metrics.reduce((s, m) => s + m.spend, 0);
  const sales = metrics.reduce((s, m) => s + m.sales, 0);
  const orders = metrics.reduce((s, m) => s + m.orders, 0);
  const impressions = metrics.reduce((s, m) => s + m.impressions, 0);
  const clicks = metrics.reduce((s, m) => s + m.clicks, 0);

  return {
    spend,
    sales,
    revenue,
    orders,
    impressions,
    clicks,
    acos: sales > 0 ? (spend / sales) * 100 : 0,
    tacos: revenue > 0 ? (spend / revenue) * 100 : 0,
    roas: spend > 0 ? sales / spend : 0,
    ctr: impressions > 0 ? (clicks / impressions) * 100 : 0,
    cpc: clicks > 0 ? spend / clicks : 0,
    cvr: clicks > 0 ? (orders / clicks) * 100 : 0,
  };
}

async function getRevenueForRange(
  clientId: string,
  range: DateRange
): Promise<number> {
  const result = await prisma.salesMetric.aggregate({
    where: {
      clientId,
      date: { gte: range.from, lte: range.to },
    },
    _sum: { revenue: true },
  });
  return result._sum.revenue ?? 0;
}

export async function getMetricSummary(
  clientId: string,
  range: DateRange
): Promise<MetricSummary> {
  const [adMetrics, revenue] = await Promise.all([
    prisma.adMetric.findMany({
      where: {
        clientId,
        date: { gte: range.from, lte: range.to },
      },
      select: {
        impressions: true,
        clicks: true,
        spend: true,
        sales: true,
        orders: true,
      },
    }),
    getRevenueForRange(clientId, range),
  ]);

  return aggregateAdMetrics(adMetrics, revenue);
}

export async function getMetricsWithComparison(
  clientId: string,
  range: DateRange
): Promise<MetricWithComparison> {
  const previousRange = getComparisonRange(range);
  const [current, previous] = await Promise.all([
    getMetricSummary(clientId, range),
    getMetricSummary(clientId, previousRange),
  ]);

  const changes = {
    spend: previous.spend > 0 ? ((current.spend - previous.spend) / previous.spend) * 100 : 0,
    sales: previous.sales > 0 ? ((current.sales - previous.sales) / previous.sales) * 100 : 0,
    revenue: previous.revenue > 0 ? ((current.revenue - previous.revenue) / previous.revenue) * 100 : 0,
    orders: previous.orders > 0 ? ((current.orders - previous.orders) / previous.orders) * 100 : 0,
    impressions: previous.impressions > 0 ? ((current.impressions - previous.impressions) / previous.impressions) * 100 : 0,
    clicks: previous.clicks > 0 ? ((current.clicks - previous.clicks) / previous.clicks) * 100 : 0,
    acos: current.acos - previous.acos,
    tacos: current.tacos - previous.tacos,
    roas: previous.roas > 0 ? ((current.roas - previous.roas) / previous.roas) * 100 : 0,
    ctr: current.ctr - previous.ctr,
    cpc: previous.cpc > 0 ? ((current.cpc - previous.cpc) / previous.cpc) * 100 : 0,
    cvr: current.cvr - previous.cvr,
  };

  return { ...current, previous, changes };
}

export async function getTrendData(
  clientId: string,
  range: DateRange
): Promise<TrendDataPoint[]> {
  const [adMetrics, salesMetrics] = await Promise.all([
    prisma.adMetric.groupBy({
      by: ["date"],
      where: {
        clientId,
        date: { gte: range.from, lte: range.to },
      },
      _sum: {
        spend: true,
        sales: true,
        impressions: true,
        clicks: true,
      },
    }),
    prisma.salesMetric.groupBy({
      by: ["date"],
      where: {
        clientId,
        date: { gte: range.from, lte: range.to },
      },
      _sum: { revenue: true },
    }),
  ]);

  const revenueByDate = new Map(
    salesMetrics.map((s) => [
      s.date.toISOString().split("T")[0],
      s._sum.revenue ?? 0,
    ])
  );

  return adMetrics
    .map((m) => {
      const dateStr = m.date.toISOString().split("T")[0];
      const spend = m._sum.spend ?? 0;
      const sales = m._sum.sales ?? 0;
      const revenue = revenueByDate.get(dateStr) ?? 0;

      return {
        date: dateStr,
        spend,
        sales,
        revenue,
        acos: sales > 0 ? (spend / sales) * 100 : 0,
        tacos: revenue > 0 ? (spend / revenue) * 100 : 0,
        impressions: m._sum.impressions ?? 0,
        clicks: m._sum.clicks ?? 0,
      };
    })
    .sort((a, b) => a.date.localeCompare(b.date));
}

export async function getCampaignPerformance(
  clientId: string,
  range: DateRange
): Promise<CampaignPerformance[]> {
  const campaigns = await prisma.campaign.findMany({
    where: { clientId },
    include: {
      adMetrics: {
        where: { date: { gte: range.from, lte: range.to } },
      },
    },
  });

  return campaigns
    .map((c) => {
      const spend = c.adMetrics.reduce((s, m) => s + m.spend, 0);
      const sales = c.adMetrics.reduce((s, m) => s + m.sales, 0);
      const orders = c.adMetrics.reduce((s, m) => s + m.orders, 0);
      const impressions = c.adMetrics.reduce((s, m) => s + m.impressions, 0);
      const clicks = c.adMetrics.reduce((s, m) => s + m.clicks, 0);

      return {
        id: c.id,
        name: c.name,
        status: c.status,
        spend,
        sales,
        orders,
        impressions,
        clicks,
        acos: sales > 0 ? (spend / sales) * 100 : 0,
        roas: spend > 0 ? sales / spend : 0,
        ctr: impressions > 0 ? (clicks / impressions) * 100 : 0,
        cpc: clicks > 0 ? spend / clicks : 0,
        cvr: clicks > 0 ? (orders / clicks) * 100 : 0,
      };
    })
    .sort((a, b) => b.spend - a.spend);
}

export async function getProductPerformance(
  clientId: string,
  range: DateRange
): Promise<ProductPerformance[]> {
  const products = await prisma.product.findMany({
    where: { clientId },
    include: {
      salesMetrics: {
        where: { date: { gte: range.from, lte: range.to } },
      },
    },
  });

  const totalAdSpend = await prisma.adMetric.aggregate({
    where: {
      clientId,
      date: { gte: range.from, lte: range.to },
    },
    _sum: { spend: true },
  });

  const avgSpendPerProduct =
    products.length > 0 ? (totalAdSpend._sum.spend ?? 0) / products.length : 0;

  return products
    .map((p) => {
      const revenue = p.salesMetrics.reduce((s, m) => s + m.revenue, 0);
      const orders = p.salesMetrics.reduce((s, m) => s + m.orders, 0);
      const units = p.salesMetrics.reduce((s, m) => s + m.units, 0);
      const sessions = p.salesMetrics.reduce((s, m) => s + m.sessions, 0);
      const adSpend = avgSpendPerProduct;

      return {
        id: p.id,
        asin: p.asin,
        title: p.title ?? p.asin,
        revenue,
        orders,
        units,
        sessions,
        conversionRate: sessions > 0 ? (orders / sessions) * 100 : 0,
        adSpend,
        tacos: revenue > 0 ? (adSpend / revenue) * 100 : 0,
      };
    })
    .sort((a, b) => b.revenue - a.revenue);
}

export async function getSearchTermPerformance(
  clientId: string,
  range: DateRange
): Promise<SearchTermPerformance[]> {
  const terms = await prisma.searchTerm.findMany({
    where: {
      clientId,
      date: { gte: range.from, lte: range.to },
    },
  });

  const grouped = new Map<string, SearchTermPerformance>();

  for (const term of terms) {
    const existing = grouped.get(term.query);
    if (existing) {
      existing.impressions += term.impressions;
      existing.clicks += term.clicks;
      existing.spend += term.spend;
      existing.sales += term.sales;
      existing.orders += term.orders;
    } else {
      grouped.set(term.query, {
        id: term.id,
        query: term.query,
        impressions: term.impressions,
        clicks: term.clicks,
        spend: term.spend,
        sales: term.sales,
        orders: term.orders,
        acos: 0,
        roas: 0,
      });
    }
  }

  return Array.from(grouped.values())
    .map((t) => ({
      ...t,
      acos: t.sales > 0 ? (t.spend / t.sales) * 100 : 0,
      roas: t.spend > 0 ? t.sales / t.spend : 0,
    }))
    .sort((a, b) => b.spend - a.spend);
}
