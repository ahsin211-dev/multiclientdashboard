import { prisma } from "@/lib/db/prisma";
import { env } from "@/lib/env";
import { buildMockDashboardData, mockClients } from "@/lib/mock-data";
import { getDateRange, getPreviousRange } from "@/lib/analytics/date-ranges";
import { normalizeSqpInsight } from "@/lib/analytics/sqp";
import type {
  CampaignPerformance,
  ClientRecord,
  DashboardData,
  DateRangeKey,
  MetricComparison,
  MetricSummary,
  ProductPerformance,
  SearchTermPerformance,
  SqpInsight,
  TrendPoint,
} from "@/lib/analytics/types";

function toNumber(value: unknown) {
  if (typeof value === "number") return value;
  if (typeof value === "string") return Number(value);
  if (value && typeof value === "object" && "toNumber" in value && typeof value.toNumber === "function") {
    return value.toNumber();
  }
  return 0;
}

function emptySummary(): MetricSummary {
  return {
    spend: 0,
    sales: 0,
    tacos: 0,
    acos: 0,
    roas: 0,
    impressions: 0,
    clicks: 0,
    ctr: 0,
    cpc: 0,
    cvr: 0,
    orders: 0,
    revenue: 0,
  };
}

function compare(summary: MetricSummary, previous: MetricSummary): MetricComparison {
  return {
    ...summary,
    previous,
    delta: Object.fromEntries(
      (Object.keys(summary) as Array<keyof MetricSummary>).map((key) => {
        const previousValue = previous[key];
        const value = summary[key];
        return [key, previousValue === 0 ? 0 : ((value - previousValue) / previousValue) * 100];
      }),
    ),
  };
}

async function getSummary(clientId: string, from: Date, to: Date): Promise<MetricSummary> {
  const [adMetrics, salesMetrics] = await Promise.all([
    prisma.adMetric.findMany({
      where: { clientId, date: { gte: from, lte: to } },
      select: { impressions: true, clicks: true, spend: true, orders: true, sales: true },
    }),
    prisma.salesMetric.findMany({
      where: { clientId, date: { gte: from, lte: to } },
      select: { revenue: true, orders: true },
    }),
  ]);

  const ad = adMetrics.reduce(
    (acc, metric) => ({
      impressions: acc.impressions + metric.impressions,
      clicks: acc.clicks + metric.clicks,
      spend: acc.spend + toNumber(metric.spend),
      orders: acc.orders + metric.orders,
      sales: acc.sales + toNumber(metric.sales),
    }),
    { impressions: 0, clicks: 0, spend: 0, orders: 0, sales: 0 },
  );

  const sales = salesMetrics.reduce(
    (acc, metric) => ({
      revenue: acc.revenue + toNumber(metric.revenue),
      orders: acc.orders + metric.orders,
    }),
    { revenue: 0, orders: 0 },
  );

  const summary = emptySummary();
  summary.spend = ad.spend;
  summary.sales = ad.sales;
  summary.revenue = sales.revenue;
  summary.orders = ad.orders;
  summary.impressions = ad.impressions;
  summary.clicks = ad.clicks;
  summary.ctr = ad.impressions ? (ad.clicks / ad.impressions) * 100 : 0;
  summary.cpc = ad.clicks ? ad.spend / ad.clicks : 0;
  summary.cvr = ad.clicks ? (ad.orders / ad.clicks) * 100 : 0;
  summary.acos = ad.sales ? (ad.spend / ad.sales) * 100 : 0;
  summary.roas = ad.spend ? ad.sales / ad.spend : 0;
  summary.tacos = sales.revenue ? (ad.spend / sales.revenue) * 100 : 0;
  return summary;
}

export async function getClients(): Promise<ClientRecord[]> {
  if (!env.DATABASE_URL) return mockClients;

  try {
    const clients = await prisma.client.findMany({
      orderBy: { brandName: "asc" },
      select: { id: true, brandName: true, marketplace: true, syncStatus: true, lastSyncAt: true },
    });
    return clients.map((client) => ({
      ...client,
      marketplace: client.marketplace,
      syncStatus: client.syncStatus,
      lastSyncAt: client.lastSyncAt?.toISOString() ?? null,
    }));
  } catch {
    return mockClients;
  }
}

export async function getDashboardData(clientId?: string, rangeKey: DateRangeKey = "30d"): Promise<DashboardData> {
  const range = getDateRange(rangeKey);
  if (!env.DATABASE_URL) return buildMockDashboardData(clientId, rangeKey === "7d" ? 7 : 30);

  try {
    const clients = await getClients();
    const selected = clientId ? clients.find((client) => client.id === clientId) : clients[0];
    if (!selected) return buildMockDashboardData(clientId, rangeKey === "7d" ? 7 : 30);

    const previousRange = getPreviousRange(range);
    const [summary, previous, trends, campaigns, products, searchTerms, sqpInsights] = await Promise.all([
      getSummary(selected.id, range.from, range.to),
      getSummary(selected.id, previousRange.from, previousRange.to),
      getTrendPoints(selected.id, range.from, range.to),
      getCampaignPerformance(selected.id, range.from, range.to),
      getProductPerformance(selected.id, range.from, range.to),
      getSearchTermPerformance(selected.id, range.from, range.to),
      getSqpInsights(selected.id, range.from, range.to),
    ]);

    return {
      client: selected,
      clients,
      range,
      summary: compare(summary, previous),
      trends,
      campaigns,
      products,
      searchTerms,
      sqpInsights,
    };
  } catch {
    return buildMockDashboardData(clientId, rangeKey === "7d" ? 7 : 30);
  }
}

async function getTrendPoints(clientId: string, from: Date, to: Date): Promise<TrendPoint[]> {
  const [adMetrics, salesMetrics] = await Promise.all([
    prisma.adMetric.findMany({
      where: { clientId, date: { gte: from, lte: to } },
      select: { date: true, spend: true, sales: true },
      orderBy: { date: "asc" },
    }),
    prisma.salesMetric.findMany({
      where: { clientId, date: { gte: from, lte: to } },
      select: { date: true, revenue: true },
      orderBy: { date: "asc" },
    }),
  ]);

  const byDate = new Map<string, TrendPoint>();
  for (const metric of adMetrics) {
    const key = metric.date.toISOString().slice(0, 10);
    const current = byDate.get(key) ?? { date: key.slice(5), spend: 0, sales: 0, revenue: 0, acos: 0, roas: 0 };
    current.spend += toNumber(metric.spend);
    current.sales += toNumber(metric.sales);
    byDate.set(key, current);
  }
  for (const metric of salesMetrics) {
    const key = metric.date.toISOString().slice(0, 10);
    const current = byDate.get(key) ?? { date: key.slice(5), spend: 0, sales: 0, revenue: 0, acos: 0, roas: 0 };
    current.revenue += toNumber(metric.revenue);
    byDate.set(key, current);
  }

  return Array.from(byDate.values()).map((point) => ({
    ...point,
    acos: point.sales ? (point.spend / point.sales) * 100 : 0,
    roas: point.spend ? point.sales / point.spend : 0,
  }));
}

async function getCampaignPerformance(clientId: string, from: Date, to: Date): Promise<CampaignPerformance[]> {
  const campaigns = await prisma.campaign.findMany({
    where: { clientId },
    include: {
      adMetrics: {
        where: { date: { gte: from, lte: to } },
      },
    },
    take: 20,
  });

  return campaigns.map((campaign) => {
    const totals = campaign.adMetrics.reduce(
      (acc, metric) => ({
        spend: acc.spend + toNumber(metric.spend),
        sales: acc.sales + toNumber(metric.sales),
        clicks: acc.clicks + metric.clicks,
        orders: acc.orders + metric.orders,
      }),
      { spend: 0, sales: 0, clicks: 0, orders: 0 },
    );
    return {
      id: campaign.id,
      name: campaign.name,
      state: campaign.state,
      spend: totals.spend,
      sales: totals.sales,
      acos: totals.sales ? (totals.spend / totals.sales) * 100 : 0,
      roas: totals.spend ? totals.sales / totals.spend : 0,
      clicks: totals.clicks,
      orders: totals.orders,
    };
  });
}

async function getProductPerformance(clientId: string, from: Date, to: Date): Promise<ProductPerformance[]> {
  const products = await prisma.product.findMany({
    where: { clientId },
    include: {
      salesMetrics: { where: { date: { gte: from, lte: to } } },
      adMetrics: { where: { date: { gte: from, lte: to } } },
    },
    take: 20,
  });

  return products.map((product) => {
    const sales = product.salesMetrics.reduce(
      (acc, metric) => ({
        revenue: acc.revenue + toNumber(metric.revenue),
        orders: acc.orders + metric.orders,
        sessions: acc.sessions + metric.sessions,
      }),
      { revenue: 0, orders: 0, sessions: 0 },
    );
    const ads = product.adMetrics.reduce(
      (acc, metric) => ({ spend: acc.spend + toNumber(metric.spend), adSales: acc.adSales + toNumber(metric.sales) }),
      { spend: 0, adSales: 0 },
    );
    return {
      id: product.id,
      asin: product.asin,
      title: product.title,
      revenue: sales.revenue,
      adSales: ads.adSales,
      spend: ads.spend,
      tacos: sales.revenue ? (ads.spend / sales.revenue) * 100 : 0,
      cvr: sales.sessions ? (sales.orders / sales.sessions) * 100 : 0,
      orders: sales.orders,
    };
  });
}

async function getSearchTermPerformance(clientId: string, from: Date, to: Date): Promise<SearchTermPerformance[]> {
  const terms = await prisma.searchTerm.findMany({
    where: { clientId, date: { gte: from, lte: to } },
    take: 50,
  });

  const byQuery = new Map<string, SearchTermPerformance>();
  for (const term of terms) {
    const current = byQuery.get(term.query) ?? { query: term.query, spend: 0, sales: 0, acos: 0, roas: 0, clicks: 0, orders: 0 };
    current.spend += toNumber(term.spend);
    current.sales += toNumber(term.sales);
    current.clicks += term.clicks;
    current.orders += term.orders;
    byQuery.set(term.query, current);
  }

  return Array.from(byQuery.values()).map((term) => ({
    ...term,
    acos: term.sales ? (term.spend / term.sales) * 100 : 0,
    roas: term.spend ? term.sales / term.spend : 0,
  }));
}

async function getSqpInsights(clientId: string, from: Date, to: Date): Promise<SqpInsight[]> {
  const rows = await prisma.sQPMetric.findMany({
    where: { clientId, date: { gte: from, lte: to } },
    orderBy: { purchaseShare: "desc" },
    take: 50,
  });

  return rows.map((row) =>
    normalizeSqpInsight({
      query: row.query,
      impressionShare: toNumber(row.impressionShare) * 100,
      clickShare: toNumber(row.clickShare) * 100,
      cartAddShare: toNumber(row.cartAddShare) * 100,
      purchaseShare: toNumber(row.purchaseShare) * 100,
      ppcSpend: toNumber(row.ppcSpend),
      ppcClicks: row.ppcClicks,
      ppcOrders: row.ppcOrders,
      ppcSales: toNumber(row.ppcSales),
      acos: toNumber(row.acos) * 100,
      roas: toNumber(row.roas),
    }),
  );
}
