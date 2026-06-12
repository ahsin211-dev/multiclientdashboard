import {
  ChartDataPoint,
  CampaignPerformance,
  ProductPerformance,
  SQPRow,
  MetricSummary,
} from "./types";

function randomBetween(min: number, max: number) {
  return Math.random() * (max - min) + min;
}

function randomInt(min: number, max: number) {
  return Math.floor(randomBetween(min, max));
}

export function generateChartData(days = 30): ChartDataPoint[] {
  const data: ChartDataPoint[] = [];
  const now = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    const spend = randomBetween(800, 2500);
    const sales = spend * randomBetween(2.5, 6);
    const clicks = randomInt(200, 1200);
    const impressions = clicks * randomInt(20, 80);
    const orders = randomInt(15, 120);
    data.push({
      date: date.toISOString().split("T")[0],
      spend: Math.round(spend),
      sales: Math.round(sales),
      acos: Math.round((spend / sales) * 100 * 10) / 10,
      roas: Math.round((sales / spend) * 100) / 100,
      impressions,
      clicks,
      orders,
    });
  }
  return data;
}

export function generateMetricSummary(): MetricSummary {
  const spend = randomBetween(35000, 85000);
  const sales = spend * randomBetween(3, 6);
  const revenue = sales * randomBetween(1.3, 2.2);
  const impressions = randomInt(500000, 3000000);
  const clicks = randomInt(15000, 80000);
  const orders = randomInt(500, 3000);

  const prevSpend = spend * randomBetween(0.85, 1.15);
  const prevSales = prevSpend * randomBetween(3, 6);

  return {
    spend: Math.round(spend),
    sales: Math.round(sales),
    revenue: Math.round(revenue),
    impressions,
    clicks,
    orders,
    acos: Math.round((spend / sales) * 1000) / 10,
    roas: Math.round((sales / spend) * 100) / 100,
    tacos: Math.round((spend / revenue) * 1000) / 10,
    ctr: Math.round((clicks / impressions) * 10000) / 100,
    cpc: Math.round((spend / clicks) * 100) / 100,
    cvr: Math.round((orders / clicks) * 10000) / 100,
    spendChange: Math.round(((spend - prevSpend) / prevSpend) * 1000) / 10,
    salesChange: Math.round(((sales - prevSales) / prevSales) * 1000) / 10,
    acosChange: randomBetween(-5, 5),
    roasChange: randomBetween(-0.5, 0.5),
    impressionsChange: randomBetween(-10, 20),
    clicksChange: randomBetween(-8, 15),
    ordersChange: randomBetween(-5, 18),
  };
}

export function generateCampaigns(): CampaignPerformance[] {
  const names = [
    "SP - Auto - All Products",
    "SP - Manual - Branded Keywords",
    "SP - Manual - Competitor Keywords",
    "SP - Manual - Category Keywords",
    "SB - Brand Defense",
    "SB - Category Attack",
    "SD - Remarketing - Cart Abandoners",
    "SD - Competitor ASIN Targeting",
    "SP - Auto - New Launches",
    "SP - Manual - Long Tail Keywords",
    "SB - New Product Launch",
    "SP - Manual - High Intent Keywords",
  ];

  return names.map((name, i) => {
    const spend = randomBetween(500, 8000);
    const sales = spend * randomBetween(2, 8);
    const clicks = randomInt(100, 3000);
    const impressions = clicks * randomInt(15, 60);
    const orders = randomInt(10, 300);
    const budget = randomBetween(spend * 0.9, spend * 1.5);

    return {
      id: `camp-${i + 1}`,
      name,
      type: name.startsWith("SP")
        ? "SPONSORED_PRODUCTS"
        : name.startsWith("SB")
          ? "SPONSORED_BRANDS"
          : "SPONSORED_DISPLAY",
      state: i < 10 ? "ENABLED" : "PAUSED",
      spend: Math.round(spend),
      sales: Math.round(sales),
      orders,
      impressions,
      clicks,
      acos: Math.round((spend / sales) * 1000) / 10,
      roas: Math.round((sales / spend) * 100) / 100,
      ctr: Math.round((clicks / impressions) * 10000) / 100,
      cpc: Math.round((spend / clicks) * 100) / 100,
      cvr: Math.round((orders / clicks) * 10000) / 100,
      budget: Math.round(budget),
    };
  });
}

export function generateProducts(): ProductPerformance[] {
  const products = [
    { asin: "B08N5WRWNW", title: "Premium Wireless Headphones - Active Noise Canceling" },
    { asin: "B07XJ8C8F5", title: "USB-C Fast Charging Cable 6ft 3-Pack" },
    { asin: "B09B8VGCR3", title: "Laptop Stand Adjustable Aluminum - Portable" },
    { asin: "B08KTZ8249", title: "Smart LED Desk Lamp with Wireless Charging" },
    { asin: "B07PXGQC1Q", title: "Mechanical Gaming Keyboard - Blue Switches RGB" },
    { asin: "B08L5NP6NG", title: "Ergonomic Mouse Vertical Wireless - Rechargeable" },
    { asin: "B09W2CWQZF", title: "4K Webcam with Ring Light & Microphone" },
    { asin: "B07YFF3JQN", title: "Monitor Arm Dual - Full Motion Adjustable" },
  ];

  return products.map((p) => {
    const revenue = randomBetween(5000, 40000);
    const units = randomInt(50, 800);
    const sessions = randomInt(500, 5000);
    const adSpend = randomBetween(500, 8000);
    const adSales = adSpend * randomBetween(2, 7);

    return {
      asin: p.asin,
      title: p.title,
      revenue: Math.round(revenue),
      units,
      sessions,
      cvr: Math.round((units / sessions) * 10000) / 100,
      adSpend: Math.round(adSpend),
      adSales: Math.round(adSales),
      acos: Math.round((adSpend / adSales) * 1000) / 10,
      tacos: Math.round((adSpend / revenue) * 1000) / 10,
    };
  });
}

export function generateSQPData(): SQPRow[] {
  const queries = [
    "wireless headphones noise canceling",
    "bluetooth headphones over ear",
    "sony headphones wh1000xm5",
    "noise canceling headphones for office",
    "premium headphones wireless",
    "headphones with microphone for zoom",
    "best headphones 2024",
    "headphones for working from home",
    "bose quietcomfort alternative",
    "comfortable headphones all day",
    "headphones under 100",
    "studio headphones wireless",
    "gaming headset noise canceling",
    "active noise canceling earbuds",
    "headphones with long battery life",
  ];

  const actions: Array<"SCALE" | "CUT" | "TEST" | "DEFEND" | "MONITOR"> = [
    "SCALE",
    "CUT",
    "TEST",
    "DEFEND",
    "MONITOR",
  ];
  const reasons: Record<string, string> = {
    SCALE: "High purchase share with relatively low PPC investment — strong conversion signals.",
    CUT: "High spend with poor purchase share and above-target ACOS — budget drain.",
    TEST: "High impression share but low click share — title/price/creative optimization needed.",
    DEFEND: "Strong organic purchase share — competitors likely bidding on this query.",
    MONITOR: "Moderate performance across all metrics — watch for trend changes.",
  };

  return queries.map((query, i) => {
    const impressionShare = randomBetween(5, 45);
    const clickShare = impressionShare * randomBetween(0.2, 0.9);
    const cartAddShare = clickShare * randomBetween(0.2, 0.8);
    const purchaseShare = cartAddShare * randomBetween(0.3, 0.9);
    const ppcSpend = randomBetween(50, 3000);
    const ppcSales = ppcSpend * randomBetween(1.5, 8);
    const ppcClicks = randomInt(20, 500);
    const ppcOrders = randomInt(2, 80);

    let action: "SCALE" | "CUT" | "TEST" | "DEFEND" | "MONITOR";
    if (purchaseShare > 8 && ppcSpend < 500) action = "SCALE";
    else if (ppcSpend > 1000 && purchaseShare < 3) action = "CUT";
    else if (impressionShare > 20 && clickShare < 5) action = "TEST";
    else if (purchaseShare > 6 && ppcSpend < 300) action = "DEFEND";
    else action = actions[i % 5];

    return {
      id: `sqp-${i + 1}`,
      query,
      impressionShare: Math.round(impressionShare * 10) / 10,
      clickShare: Math.round(clickShare * 10) / 10,
      cartAddShare: Math.round(cartAddShare * 10) / 10,
      purchaseShare: Math.round(purchaseShare * 10) / 10,
      ppcSpend: Math.round(ppcSpend),
      ppcSales: Math.round(ppcSales),
      ppcClicks,
      ppcOrders,
      acos: Math.round((ppcSpend / ppcSales) * 1000) / 10,
      roas: Math.round((ppcSales / ppcSpend) * 100) / 100,
      action,
      reason: reasons[action],
    };
  });
}

export const MOCK_CLIENTS = [
  {
    id: "client-1",
    name: "TechGadgets Pro",
    brandName: "TechGadgets",
    marketplace: "US",
    isActive: true,
    logoUrl: null,
    notes: "Consumer electronics brand, Q4 heavy",
    workspaceId: "ws-1",
  },
  {
    id: "client-2",
    name: "HomeLife Essentials",
    brandName: "HomeLife",
    marketplace: "US",
    isActive: true,
    logoUrl: null,
    notes: "Home goods & kitchen products",
    workspaceId: "ws-1",
  },
  {
    id: "client-3",
    name: "FitActive Sports",
    brandName: "FitActive",
    marketplace: "US",
    isActive: true,
    logoUrl: null,
    notes: "Sports nutrition and fitness equipment",
    workspaceId: "ws-1",
  },
  {
    id: "client-4",
    name: "BeautyGlow Cosmetics",
    brandName: "BeautyGlow",
    marketplace: "US",
    isActive: false,
    logoUrl: null,
    notes: "Beauty and skincare products",
    workspaceId: "ws-1",
  },
];
