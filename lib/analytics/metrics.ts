import { prisma } from "@/lib/db/prisma";
import { formatDelta } from "@/lib/utils";
import type {
  CampaignPerformance,
  DashboardMetrics,
  DateRange,
  MetricValue,
  ProductPerformance,
  SearchTermPerformance,
} from "@/lib/types";

function metricValue(current: number, previous: number): MetricValue {
  return {
    value: current,
    previous,
    delta: formatDelta(current, previous),
  };
}

async function aggregateAdMetrics(clientId: string, range: DateRange) {
  const result = await prisma.adMetric.aggregate({
    where: {
      clientId,
      date: { gte: range.from, lte: range.to },
    },
    _sum: {
      impressions: true,
      clicks: true,
      spend: true,
      orders: true,
      sales: true,
    },
  });

  const impressions = result._sum.impressions ?? 0;
  const clicks = result._sum.clicks ?? 0;
  const spend = result._sum.spend ?? 0;
  const orders = result._sum.orders ?? 0;
  const sales = result._sum.sales ?? 0;

  return {
    impressions,
    clicks,
    spend,
    orders,
    sales,
    ctr: impressions > 0 ? (clicks / impressions) * 100 : 0,
    cpc: clicks > 0 ? spend / clicks : 0,
    cvr: clicks > 0 ? (orders / clicks) * 100 : 0,
    acos: sales > 0 ? (spend / sales) * 100 : 0,
    roas: spend > 0 ? sales / spend : 0,
  };
}

async function aggregateSalesMetrics(clientId: string, range: DateRange) {
  const result = await prisma.salesMetric.aggregate({
    where: {
      clientId,
      date: { gte: range.from, lte: range.to },
    },
    _sum: {
      revenue: true,
      orders: true,
    },
  });

  return {
    revenue: result._sum.revenue ?? 0,
    orders: result._sum.orders ?? 0,
  };
}

export async function getDashboardMetrics(
  clientId: string,
  current: DateRange,
  previous: DateRange
): Promise<DashboardMetrics> {
  const [currentAds, previousAds, currentSales, previousSales] = await Promise.all([
    aggregateAdMetrics(clientId, current),
    aggregateAdMetrics(clientId, previous),
    aggregateSalesMetrics(clientId, current),
    aggregateSalesMetrics(clientId, previous),
  ]);

  const tacosCurrent =
    currentSales.revenue > 0 ? (currentAds.spend / currentSales.revenue) * 100 : 0;
  const tacosPrevious =
    previousSales.revenue > 0 ? (previousAds.spend / previousSales.revenue) * 100 : 0;

  return {
    adSpend: metricValue(currentAds.spend, previousAds.spend),
    sales: metricValue(currentAds.sales, previousAds.sales),
    revenue: metricValue(currentSales.revenue, previousSales.revenue),
    tacos: metricValue(tacosCurrent, tacosPrevious),
    acos: metricValue(currentAds.acos, previousAds.acos),
    roas: metricValue(currentAds.roas, previousAds.roas),
    impressions: metricValue(currentAds.impressions, previousAds.impressions),
    clicks: metricValue(currentAds.clicks, previousAds.clicks),
    ctr: metricValue(currentAds.ctr, previousAds.ctr),
    cpc: metricValue(currentAds.cpc, previousAds.cpc),
    cvr: metricValue(currentAds.cvr, previousAds.cvr),
    orders: metricValue(currentAds.orders, previousAds.orders),
  };
}

export async function getTrendData(clientId: string, range: DateRange) {
  const metrics = await prisma.adMetric.groupBy({
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
      orders: true,
    },
    orderBy: { date: "asc" },
  });

  return metrics.map((m) => ({
    date: m.date.toISOString().split("T")[0],
    spend: m._sum.spend ?? 0,
    sales: m._sum.sales ?? 0,
    impressions: m._sum.impressions ?? 0,
    clicks: m._sum.clicks ?? 0,
    orders: m._sum.orders ?? 0,
  }));
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
    .map((campaign) => {
      const totals = campaign.adMetrics.reduce(
        (acc, m) => ({
          spend: acc.spend + m.spend,
          sales: acc.sales + m.sales,
          impressions: acc.impressions + m.impressions,
          clicks: acc.clicks + m.clicks,
          orders: acc.orders + m.orders,
        }),
        { spend: 0, sales: 0, impressions: 0, clicks: 0, orders: 0 }
      );

      return {
        id: campaign.id,
        name: campaign.name,
        spend: totals.spend,
        sales: totals.sales,
        acos: totals.sales > 0 ? (totals.spend / totals.sales) * 100 : 0,
        roas: totals.spend > 0 ? totals.sales / totals.spend : 0,
        impressions: totals.impressions,
        clicks: totals.clicks,
        ctr: totals.impressions > 0 ? (totals.clicks / totals.impressions) * 100 : 0,
        orders: totals.orders,
      };
    })
    .sort((a, b) => b.spend - a.spend);
}

export async function getProductPerformance(
  clientId: string,
  range: DateRange
): Promise<ProductPerformance[]> {
  const [products, salesByAsin, adSpend] = await Promise.all([
    prisma.product.findMany({ where: { clientId } }),
    prisma.salesMetric.groupBy({
      by: ["asin"],
      where: { clientId, date: { gte: range.from, lte: range.to } },
      _sum: { revenue: true, orders: true, sessions: true },
    }),
    prisma.adMetric.aggregate({
      where: { clientId, date: { gte: range.from, lte: range.to } },
      _sum: { spend: true },
    }),
  ]);

  const totalSpend = adSpend._sum.spend ?? 0;
  const totalRevenue = salesByAsin.reduce((s, r) => s + (r._sum.revenue ?? 0), 0);

  return products
    .map((product) => {
      const sales = salesByAsin.find((s) => s.asin === product.asin);
      const revenue = sales?._sum.revenue ?? 0;
      const orders = sales?._sum.orders ?? 0;
      const sessions = sales?._sum.sessions ?? 0;
      const share = totalRevenue > 0 ? revenue / totalRevenue : 0;
      const productAdSpend = totalSpend * share;

      return {
        asin: product.asin,
        title: product.title,
        revenue,
        orders,
        sessions,
        conversion: sessions > 0 ? (orders / sessions) * 100 : 0,
        adSpend: productAdSpend,
        tacos: revenue > 0 ? (productAdSpend / revenue) * 100 : 0,
      };
    })
    .sort((a, b) => b.revenue - a.revenue);
}

export async function getSearchTermPerformance(
  clientId: string,
  range: DateRange
): Promise<SearchTermPerformance[]> {
  const terms = await prisma.searchTerm.groupBy({
    by: ["query"],
    where: { clientId, date: { gte: range.from, lte: range.to } },
    _sum: {
      impressions: true,
      clicks: true,
      spend: true,
      sales: true,
      orders: true,
    },
    orderBy: { _sum: { spend: "desc" } },
    take: 50,
  });

  return terms.map((t) => {
    const spend = t._sum.spend ?? 0;
    const sales = t._sum.sales ?? 0;
    return {
      query: t.query,
      impressions: t._sum.impressions ?? 0,
      clicks: t._sum.clicks ?? 0,
      spend,
      sales,
      orders: t._sum.orders ?? 0,
      acos: sales > 0 ? (spend / sales) * 100 : 0,
      roas: spend > 0 ? sales / spend : 0,
    };
  });
}

export async function getPerformanceSummary(clientId: string, range: DateRange) {
  const days = Math.ceil((range.to.getTime() - range.from.getTime()) / (86400000)) + 1;
  const previousFrom = new Date(range.from);
  previousFrom.setDate(previousFrom.getDate() - days);
  const previousTo = new Date(range.from);
  previousTo.setDate(previousTo.getDate() - 1);

  const metrics = await getDashboardMetrics(clientId, range, {
    from: previousFrom,
    to: previousTo,
  });
  const campaigns = await getCampaignPerformance(clientId, range);

  const topCampaigns = campaigns.slice(0, 5);
  const worstAcos = [...campaigns]
    .filter((c) => c.spend > 100)
    .sort((a, b) => b.acos - a.acos)
    .slice(0, 5);

  return { metrics, topCampaigns, worstAcos };
}
