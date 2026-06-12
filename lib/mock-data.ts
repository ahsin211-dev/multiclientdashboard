import type {
  CampaignPerformance,
  ClientRecord,
  DashboardData,
  MetricComparison,
  ProductPerformance,
  SearchTermPerformance,
  SqpInsight,
  TrendPoint,
} from "@/lib/analytics/types";

export const mockClients: ClientRecord[] = [
  {
    id: "peaktrail",
    brandName: "PeakTrail Gear",
    marketplace: "US",
    syncStatus: "SYNCED",
    lastSyncAt: new Date().toISOString(),
  },
  {
    id: "glownest",
    brandName: "GlowNest Beauty",
    marketplace: "US",
    syncStatus: "SYNCED",
    lastSyncAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
  },
];

export const mockCampaigns: CampaignPerformance[] = [
  { id: "c1", name: "Trail Shoes | Exact", state: "enabled", spend: 8240, sales: 43120, acos: 19.1, roas: 5.23, clicks: 16420, orders: 1520 },
  { id: "c2", name: "Backpacks | Auto", state: "enabled", spend: 6120, sales: 18840, acos: 32.5, roas: 3.08, clicks: 12110, orders: 610 },
  { id: "c3", name: "Hydration Packs | Broad", state: "enabled", spend: 3910, sales: 15100, acos: 25.9, roas: 3.86, clicks: 7900, orders: 410 },
];

export const mockProducts: ProductPerformance[] = [
  { id: "p1", asin: "B0TRAIL01", title: "PeakTrail Waterproof Hiking Shoe", revenue: 74900, adSales: 43120, spend: 8240, tacos: 11.0, cvr: 8.7, orders: 1520 },
  { id: "p2", asin: "B0PACK02", title: "PeakTrail 40L Technical Backpack", revenue: 45200, adSales: 18840, spend: 6120, tacos: 13.5, cvr: 6.1, orders: 610 },
  { id: "p3", asin: "B0HYDRO3", title: "PeakTrail Hydration Pack", revenue: 25400, adSales: 15100, spend: 3910, tacos: 15.4, cvr: 5.2, orders: 410 },
];

export const mockSearchTerms: SearchTermPerformance[] = [
  { query: "waterproof hiking shoes", spend: 980, sales: 6120, acos: 16.0, roas: 6.24, clicks: 1880, orders: 210 },
  { query: "lightweight backpack 40l", spend: 220, sales: 1870, acos: 11.8, roas: 8.5, clicks: 420, orders: 71 },
  { query: "hydration pack running", spend: 1410, sales: 690, acos: 204.3, roas: 0.49, clicks: 2480, orders: 24 },
  { query: "trail shoes men", spend: 470, sales: 4080, acos: 11.5, roas: 8.68, clicks: 930, orders: 124 },
];

export const mockSqpInsights: SqpInsight[] = [
  {
    query: "waterproof hiking shoes",
    impressionShare: 21,
    clickShare: 16,
    cartAddShare: 14,
    purchaseShare: 12,
    ppcSpend: 420,
    ppcClicks: 1176,
    ppcOrders: 50,
    ppcSales: 2100,
    acos: 20,
    roas: 5,
    recommendedAction: "Defend",
    reason: "Strong purchase share with efficient PPC; protect rank and monitor competitor bids.",
  },
  {
    query: "lightweight backpack 40l",
    impressionShare: 18,
    clickShare: 9,
    cartAddShare: 8,
    purchaseShare: 7,
    ppcSpend: 95,
    ppcClicks: 266,
    ppcOrders: 20,
    ppcSales: 860,
    acos: 11,
    roas: 9.05,
    recommendedAction: "Scale",
    reason: "Purchase share and ROAS are strong while PPC investment is low.",
  },
  {
    query: "hydration pack running",
    impressionShare: 14,
    clickShare: 4,
    cartAddShare: 3,
    purchaseShare: 2,
    ppcSpend: 610,
    ppcClicks: 1708,
    ppcOrders: 7,
    ppcSales: 310,
    acos: 196.8,
    roas: 0.51,
    recommendedAction: "Cut",
    reason: "High spend with weak purchase share and poor ACOS.",
  },
  {
    query: "trail shoes men",
    impressionShare: 27,
    clickShare: 20,
    cartAddShare: 17,
    purchaseShare: 15,
    ppcSpend: 180,
    ppcClicks: 504,
    ppcOrders: 36,
    ppcSales: 1500,
    acos: 12,
    roas: 8.33,
    recommendedAction: "Defend",
    reason: "High SQP share and efficient PPC indicate a profitable defensive term.",
  },
];

export function buildMockTrends(days = 30): TrendPoint[] {
  return Array.from({ length: days }, (_, index) => {
    const day = days - index;
    const date = new Date();
    date.setUTCDate(date.getUTCDate() - day);
    const spend = Math.round(610 + Math.sin(index / 2.5) * 90 + index * 8);
    const sales = Math.round(2100 + Math.cos(index / 3.2) * 280 + index * 34);
    const revenue = Math.round(sales * 1.74);
    return {
      date: date.toISOString().slice(5, 10),
      spend,
      sales,
      revenue,
      acos: Math.round((spend / sales) * 1000) / 10,
      roas: Math.round((sales / spend) * 100) / 100,
    };
  });
}

export function buildMockSummary(): MetricComparison {
  const summary = {
    spend: 18270,
    sales: 77060,
    tacos: 12.5,
    acos: 23.7,
    roas: 4.22,
    impressions: 1645000,
    clicks: 36430,
    ctr: 2.2,
    cpc: 0.5,
    cvr: 7.0,
    orders: 2540,
    revenue: 145500,
  };
  const previous = {
    spend: 16100,
    sales: 72800,
    tacos: 11.9,
    acos: 22.1,
    roas: 4.52,
    impressions: 1540000,
    clicks: 33100,
    ctr: 2.1,
    cpc: 0.49,
    cvr: 6.8,
    orders: 2250,
    revenue: 135200,
  };
  return {
    ...summary,
    previous,
    delta: Object.fromEntries(
      Object.entries(summary).map(([key, value]) => [
        key,
        ((value - previous[key as keyof typeof previous]) / previous[key as keyof typeof previous]) * 100,
      ]),
    ),
  };
}

export function buildMockDashboardData(clientId = "peaktrail", days = 30): DashboardData {
  const client = mockClients.find((item) => item.id === clientId) ?? mockClients[0];
  return {
    client,
    clients: mockClients,
    range: {
      key: days === 7 ? "7d" : "30d",
      from: new Date(Date.now() - days * 24 * 60 * 60 * 1000),
      to: new Date(),
    },
    summary: buildMockSummary(),
    trends: buildMockTrends(days),
    campaigns: mockCampaigns,
    products: mockProducts,
    searchTerms: mockSearchTerms,
    sqpInsights: mockSqpInsights,
  };
}
