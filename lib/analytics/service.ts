import { getClient } from "@/lib/db/repository";
import { type DemoClient, type SQPPoint } from "@/lib/data/demo";
import { calculateDelta, type DateRange, getComparisonRange } from "@/lib/utils";

type MetricKey =
  | "spend"
  | "sales"
  | "tacos"
  | "acos"
  | "roas"
  | "impressions"
  | "clicks"
  | "ctr"
  | "cpc"
  | "cvr"
  | "orders"
  | "revenue";

export type MetricCardValue = {
  key: MetricKey;
  label: string;
  value: number;
  previousValue: number;
  delta: number;
};

export type CampaignTableRow = {
  id: string;
  campaign: string;
  channel: string;
  status: string;
  budget: number;
  spend: number;
  sales: number;
  impressions: number;
  clicks: number;
  orders: number;
  acos: number;
  roas: number;
};

export type ProductTableRow = {
  id: string;
  product: string;
  asin: string;
  category: string;
  revenue: number;
  orders: number;
  sessions: number;
  conversionRate: number;
  tacos: number;
};

export type SQPInsightRow = {
  query: string;
  impressionShare: number;
  clickShare: number;
  purchaseShare: number;
  spend: number;
  sales: number;
  clicks: number;
  orders: number;
  acos: number;
  roas: number;
  recommendedAction: "Scale" | "Cut" | "Test" | "Defend";
  reason: string;
};

export type InsightRow = {
  title: string;
  detail: string;
  metric: string;
};

function inRange(date: string, range: DateRange) {
  const value = new Date(date);
  return value >= range.from && value <= range.to;
}

function aggregateAd(client: DemoClient, range: DateRange) {
  return client.adMetrics.filter((metric) => inRange(metric.date, range)).reduce(
    (accumulator, metric) => {
      accumulator.spend += metric.spend;
      accumulator.sales += metric.sales;
      accumulator.impressions += metric.impressions;
      accumulator.clicks += metric.clicks;
      accumulator.orders += metric.orders;
      return accumulator;
    },
    {
      spend: 0,
      sales: 0,
      impressions: 0,
      clicks: 0,
      orders: 0,
    },
  );
}

function aggregateSales(client: DemoClient, range: DateRange) {
  return client.salesMetrics.filter((metric) => inRange(metric.date, range)).reduce(
    (accumulator, metric) => {
      accumulator.revenue += metric.revenue;
      accumulator.orders += metric.totalOrders;
      accumulator.sessions += metric.sessions;
      accumulator.organicSales += metric.organicSales;
      return accumulator;
    },
    {
      revenue: 0,
      orders: 0,
      sessions: 0,
      organicSales: 0,
    },
  );
}

function buildMetricCards(current: ReturnType<typeof aggregateAd>, currentSales: ReturnType<typeof aggregateSales>, previous: ReturnType<typeof aggregateAd>, previousSales: ReturnType<typeof aggregateSales>) {
  const currentCtr = current.clicks / Math.max(current.impressions, 1);
  const currentCpc = current.spend / Math.max(current.clicks, 1);
  const currentCvr = current.orders / Math.max(current.clicks, 1);
  const currentAcos = current.spend / Math.max(current.sales, 1);
  const currentRoas = current.sales / Math.max(current.spend, 1);
  const currentTacos = current.spend / Math.max(currentSales.revenue, 1);

  const previousCtr = previous.clicks / Math.max(previous.impressions, 1);
  const previousCpc = previous.spend / Math.max(previous.clicks, 1);
  const previousCvr = previous.orders / Math.max(previous.clicks, 1);
  const previousAcos = previous.spend / Math.max(previous.sales, 1);
  const previousRoas = previous.sales / Math.max(previous.spend, 1);
  const previousTacos = previous.spend / Math.max(previousSales.revenue, 1);

  const definitions = [
    ["spend", "Ad spend", current.spend, previous.spend],
    ["sales", "Attributed sales", current.sales, previous.sales],
    ["tacos", "TACOS", currentTacos, previousTacos],
    ["acos", "ACOS", currentAcos, previousAcos],
    ["roas", "ROAS", currentRoas, previousRoas],
    ["impressions", "Impressions", current.impressions, previous.impressions],
    ["clicks", "Clicks", current.clicks, previous.clicks],
    ["ctr", "CTR", currentCtr, previousCtr],
    ["cpc", "CPC", currentCpc, previousCpc],
    ["cvr", "CVR", currentCvr, previousCvr],
    ["orders", "Orders", current.orders, previous.orders],
    ["revenue", "Revenue", currentSales.revenue, previousSales.revenue],
  ] as const;

  return definitions.map(([key, label, value, previousValue]) => ({
    key,
    label,
    value,
    previousValue,
    delta: calculateDelta(value, previousValue),
  })) satisfies MetricCardValue[];
}

export async function getPerformanceSummary(clientId: string, range: DateRange) {
  const client = await getClient(clientId);

  if (!client) {
    return null;
  }

  const comparisonRange = getComparisonRange(range);
  const currentAd = aggregateAd(client, range);
  const currentSales = aggregateSales(client, range);
  const previousAd = aggregateAd(client, comparisonRange);
  const previousSales = aggregateSales(client, comparisonRange);

  return {
    client,
    metrics: buildMetricCards(currentAd, currentSales, previousAd, previousSales),
  };
}

export async function getTrendSeries(clientId: string, range: DateRange) {
  const client = await getClient(clientId);

  if (!client) {
    return [];
  }

  const byDate = new Map<string, { date: string; spend: number; sales: number; revenue: number }>();

  client.adMetrics.filter((metric) => inRange(metric.date, range)).forEach((metric) => {
    const current = byDate.get(metric.date) ?? { date: metric.date, spend: 0, sales: 0, revenue: 0 };
    current.spend += metric.spend;
    current.sales += metric.sales;
    byDate.set(metric.date, current);
  });

  client.salesMetrics.filter((metric) => inRange(metric.date, range)).forEach((metric) => {
    const current = byDate.get(metric.date) ?? { date: metric.date, spend: 0, sales: 0, revenue: 0 };
    current.revenue += metric.revenue;
    byDate.set(metric.date, current);
  });

  return [...byDate.values()].sort((left, right) => left.date.localeCompare(right.date));
}

export async function getCampaignPerformance(clientId: string, range: DateRange) {
  const client = await getClient(clientId);

  if (!client) {
    return [];
  }

  return client.campaigns.map((campaign) => {
    const metrics = client.adMetrics.filter(
      (metric) => metric.campaignId === campaign.id && inRange(metric.date, range),
    );
    const spend = metrics.reduce((sum, metric) => sum + metric.spend, 0);
    const sales = metrics.reduce((sum, metric) => sum + metric.sales, 0);
    const impressions = metrics.reduce((sum, metric) => sum + metric.impressions, 0);
    const clicks = metrics.reduce((sum, metric) => sum + metric.clicks, 0);
    const orders = metrics.reduce((sum, metric) => sum + metric.orders, 0);

    return {
      id: campaign.id,
      campaign: campaign.name,
      channel: campaign.channel,
      status: campaign.status,
      budget: campaign.budget,
      spend,
      sales,
      impressions,
      clicks,
      orders,
      acos: spend / Math.max(sales, 1),
      roas: sales / Math.max(spend, 1),
    };
  }).sort((left, right) => right.sales - left.sales) satisfies CampaignTableRow[];
}

export async function getProductPerformance(clientId: string, range: DateRange) {
  const client = await getClient(clientId);

  if (!client) {
    return [];
  }

  const totalSpend = aggregateAd(client, range).spend;
  const totalRevenue = aggregateSales(client, range).revenue;

  return client.products.map((product) => {
    const metrics = client.salesMetrics.filter(
      (metric) => metric.productId === product.id && inRange(metric.date, range),
    );
    const revenue = metrics.reduce((sum, metric) => sum + metric.revenue, 0);
    const sessions = metrics.reduce((sum, metric) => sum + metric.sessions, 0);
    const orders = metrics.reduce((sum, metric) => sum + metric.totalOrders, 0);
    const allocatedSpend = totalRevenue === 0 ? 0 : totalSpend * (revenue / totalRevenue);

    return {
      id: product.id,
      product: product.title,
      asin: product.asin,
      category: product.category,
      revenue,
      orders,
      sessions,
      conversionRate: orders / Math.max(sessions, 1),
      tacos: allocatedSpend / Math.max(revenue, 1),
    };
  }).sort((left, right) => right.revenue - left.revenue) satisfies ProductTableRow[];
}

export async function getSearchTermPerformance(clientId: string) {
  const client = await getClient(clientId);
  return client?.searchTerms ?? [];
}

function summarizeSQP(point: SQPPoint): SQPInsightRow {
  const acos = point.spend / Math.max(point.sales, 1);
  const roas = point.sales / Math.max(point.spend, 1);

  if (point.purchaseShare >= 0.16 && point.spend < 70 && roas > 3) {
    return {
      ...point,
      acos,
      roas,
      recommendedAction: "Scale",
      reason: "High purchase share with efficient economics and limited paid coverage.",
    };
  }

  if (point.spend > 75 && (point.purchaseShare < 0.11 || acos > 0.4)) {
    return {
      ...point,
      acos,
      roas,
      recommendedAction: "Cut",
      reason: "Spend is elevated while purchase share or ACOS trails target.",
    };
  }

  if (point.impressionShare > 0.2 && point.clickShare < 0.15) {
    return {
      ...point,
      acos,
      roas,
      recommendedAction: "Test",
      reason: "Visibility is strong but click share lags, suggesting a creative or offer issue.",
    };
  }

  return {
    ...point,
    acos,
    roas,
    recommendedAction: "Defend",
    reason: "The query already contributes meaningful share and should be protected from competitors.",
  };
}

export async function getSQPInsights(clientId: string, range: DateRange) {
  const client = await getClient(clientId);

  if (!client) {
    return [];
  }

  const aggregated = new Map<string, SQPPoint>();

  client.sqpMetrics.filter((metric) => inRange(metric.date, range)).forEach((metric) => {
    const current = aggregated.get(metric.query) ?? {
      ...metric,
      impressionShare: 0,
      clickShare: 0,
      cartAddShare: 0,
      purchaseShare: 0,
      spend: 0,
      clicks: 0,
      orders: 0,
      sales: 0,
    };

    current.impressionShare = metric.impressionShare;
    current.clickShare = metric.clickShare;
    current.cartAddShare = metric.cartAddShare;
    current.purchaseShare = metric.purchaseShare;
    current.spend += metric.spend;
    current.clicks += metric.clicks;
    current.orders += metric.orders;
    current.sales += metric.sales;
    aggregated.set(metric.query, current);
  });

  return [...aggregated.values()].map(summarizeSQP).sort((left, right) => right.purchaseShare - left.purchaseShare);
}

export async function getWastedSpend(clientId: string, range: DateRange) {
  const sqp = await getSQPInsights(clientId, range);

  return sqp
    .filter((row) => row.recommendedAction === "Cut" || (row.spend > 120 && row.orders < 8))
    .slice(0, 5)
    .map((row) => ({
      title: row.query,
      detail: row.reason,
      metric: `${row.acos.toFixed(2)} ACOS on ${row.orders} orders`,
    })) satisfies InsightRow[];
}

export async function getScalingOpportunities(clientId: string, range: DateRange) {
  const sqp = await getSQPInsights(clientId, range);

  return sqp
    .filter((row) => row.recommendedAction === "Scale" || row.recommendedAction === "Defend")
    .slice(0, 5)
    .map((row) => ({
      title: row.query,
      detail: row.reason,
      metric: `${(row.purchaseShare * 100).toFixed(1)}% purchase share`,
    })) satisfies InsightRow[];
}

export async function getClientContext(clientId: string, range: DateRange) {
  const client = await getClient(clientId);

  if (!client) {
    return null;
  }

  const performance = await getPerformanceSummary(clientId, range);
  const campaignPerformance = await getCampaignPerformance(clientId, range);
  const productPerformance = await getProductPerformance(clientId, range);
  const sqpInsights = await getSQPInsights(clientId, range);
  const wastedSpend = await getWastedSpend(clientId, range);
  const scalingOpportunities = await getScalingOpportunities(clientId, range);

  return {
    client: {
      id: client.id,
      brandName: client.brandName,
      marketplace: client.marketplace,
      syncStatus: client.syncStatus,
      lastSyncAt: client.lastSyncAt,
    },
    performance: performance?.metrics ?? [],
    campaignPerformance,
    productPerformance,
    sqpInsights,
    wastedSpend,
    scalingOpportunities,
  };
}
