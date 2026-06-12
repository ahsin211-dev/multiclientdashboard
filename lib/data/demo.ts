import { subDays } from "date-fns";

export type MemberRole = "Owner" | "Admin" | "Analyst" | "Viewer";
export type SyncJobState = "pending" | "running" | "completed" | "failed";
export type MarketplaceCode = "US" | "UK";

export type WorkspaceMemberSummary = {
  id: string;
  name: string;
  email: string;
  role: MemberRole;
};

export type ClientConnection = {
  type: "Amazon Ads" | "SP-API";
  status: "Connected" | "Pending" | "Error";
  accountName: string;
};

export type ClientCampaign = {
  id: string;
  name: string;
  status: "Active" | "Paused";
  budget: number;
  channel: string;
};

export type ClientProduct = {
  id: string;
  asin: string;
  sku: string;
  title: string;
  price: number;
  category: string;
};

export type ClientSearchTerm = {
  id: string;
  term: string;
  spend: number;
  sales: number;
  clicks: number;
  orders: number;
  ctr: number;
  cvr: number;
  acos: number;
  roas: number;
};

export type AdMetricPoint = {
  date: string;
  campaignId: string;
  spend: number;
  sales: number;
  impressions: number;
  clicks: number;
  orders: number;
};

export type SalesMetricPoint = {
  date: string;
  productId: string;
  revenue: number;
  sessions: number;
  unitsOrdered: number;
  totalOrders: number;
  organicSales: number;
};

export type SQPPoint = {
  date: string;
  query: string;
  impressionShare: number;
  clickShare: number;
  cartAddShare: number;
  purchaseShare: number;
  spend: number;
  clicks: number;
  orders: number;
  sales: number;
};

export type AuditSeed = {
  title: string;
  summary: string;
  findings: Array<{
    category: string;
    severity: "high" | "medium" | "low";
    insight: string;
  }>;
};

export type MarketingPlanSeed = {
  title: string;
  immediateFixes: string[];
  campaignRestructuring: string[];
  budgetReallocation: string[];
  keywordActions: string[];
  sqpStrategy: string[];
  roadmap: Array<{
    week: string;
    action: string;
  }>;
};

export type SyncLogSeed = {
  id: string;
  type: string;
  status: SyncJobState;
  createdAt: string;
  summary: string;
};

export type DemoClient = {
  id: string;
  workspaceId: string;
  brandName: string;
  marketplace: MarketplaceCode;
  currency: "USD" | "GBP";
  syncStatus: "Connected" | "Syncing" | "Failed";
  lastSyncAt: string;
  connections: ClientConnection[];
  campaigns: ClientCampaign[];
  products: ClientProduct[];
  searchTerms: ClientSearchTerm[];
  adMetrics: AdMetricPoint[];
  salesMetrics: SalesMetricPoint[];
  sqpMetrics: SQPPoint[];
  audit: AuditSeed;
  marketingPlan: MarketingPlanSeed;
  syncLogs: SyncLogSeed[];
};

export type DemoWorkspace = {
  id: string;
  name: string;
  slug: string;
  members: WorkspaceMemberSummary[];
  clients: DemoClient[];
};

const workspaceId = "workspace-agency-growth-partners";

const members: WorkspaceMemberSummary[] = [
  {
    id: "member-owner",
    name: "Olivia Carter",
    email: "owner@demo.com",
    role: "Owner",
  },
  {
    id: "member-analyst",
    name: "Marcus Lee",
    email: "analyst@demo.com",
    role: "Analyst",
  },
];

function toIsoDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

function buildClient(config: {
  id: string;
  brandName: string;
  marketplace: MarketplaceCode;
  currency: "USD" | "GBP";
  accountName: string;
  profileId: string;
  campaigns: Array<{ id: string; name: string; budget: number; channel: string }>;
  products: ClientProduct[];
  sqpQueries: string[];
  baseSpend: number;
  baseRevenue: number;
  searchTerms: ClientSearchTerm[];
  audit: AuditSeed;
  marketingPlan: MarketingPlanSeed;
}): DemoClient {
  const adMetrics: AdMetricPoint[] = [];
  const salesMetrics: SalesMetricPoint[] = [];
  const sqpMetrics: SQPPoint[] = [];

  for (let index = 59; index >= 0; index -= 1) {
    const day = subDays(new Date(), index);
    const date = toIsoDate(day);
    const dayOffset = 59 - index;

    config.campaigns.forEach((campaign, campaignIndex) => {
      const spend = Number((config.baseSpend + campaignIndex * 15 + (dayOffset % 7) * 4.1).toFixed(2));
      const clicks = Math.round(spend * 10.2 + campaignIndex * 16);
      const impressions = clicks * (18 + campaignIndex * 2);
      const orders = Math.max(4, Math.round(clicks * (0.11 + campaignIndex * 0.01)));
      const sales = Number((orders * (config.baseRevenue + campaignIndex * 6.5)).toFixed(2));

      adMetrics.push({
        date,
        campaignId: campaign.id,
        spend,
        sales,
        impressions,
        clicks,
        orders,
      });
    });

    config.products.forEach((product, productIndex) => {
      const sessions = 180 + productIndex * 26 + (dayOffset % 5) * 20;
      const totalOrders = 16 + productIndex * 3 + (dayOffset % 4);
      const unitsOrdered = totalOrders + 2 + productIndex;
      const revenue = Number((unitsOrdered * (product.price * (0.96 + productIndex * 0.02))).toFixed(2));
      const organicSales = Number((revenue * (0.31 + productIndex * 0.04)).toFixed(2));

      salesMetrics.push({
        date,
        productId: product.id,
        revenue,
        sessions,
        unitsOrdered,
        totalOrders,
        organicSales,
      });
    });

    config.sqpQueries.forEach((query, queryIndex) => {
      const spend = Number((42 + queryIndex * 7 + (dayOffset % 6) * 2.6).toFixed(2));
      const clicks = 42 + queryIndex * 6 + (dayOffset % 3) * 3;
      const orders = Math.max(2, Math.round(clicks * (0.11 + queryIndex * 0.012)));
      const sales = Number((orders * (config.baseRevenue - 5 + queryIndex * 3.8)).toFixed(2));

      sqpMetrics.push({
        date,
        query,
        impressionShare: Number((0.14 + queryIndex * 0.05).toFixed(4)),
        clickShare: Number((0.09 + queryIndex * 0.03).toFixed(4)),
        cartAddShare: Number((0.07 + queryIndex * 0.025).toFixed(4)),
        purchaseShare: Number((0.08 + queryIndex * 0.035).toFixed(4)),
        spend,
        clicks,
        orders,
        sales,
      });
    });
  }

  return {
    id: config.id,
    workspaceId,
    brandName: config.brandName,
    marketplace: config.marketplace,
    currency: config.currency,
    syncStatus: "Connected",
    lastSyncAt: new Date().toISOString(),
    connections: [
      {
        type: "Amazon Ads",
        status: "Connected",
        accountName: config.accountName,
      },
      {
        type: "SP-API",
        status: "Connected",
        accountName: `${config.brandName} Seller Central`,
      },
    ],
    campaigns: config.campaigns.map((campaign) => ({
      ...campaign,
      status: "Active",
    })),
    products: config.products,
    searchTerms: config.searchTerms,
    adMetrics,
    salesMetrics,
    sqpMetrics,
    audit: config.audit,
    marketingPlan: config.marketingPlan,
    syncLogs: [
      {
        id: `${config.id}-sync-running`,
        type: "manual-sync",
        status: "completed",
        createdAt: new Date().toISOString(),
        summary: "Pulled campaigns, ad groups, keywords, search terms, products, and sales metrics.",
      },
      {
        id: `${config.id}-sync-daily`,
        type: "daily-sync",
        status: "completed",
        createdAt: subDays(new Date(), 1).toISOString(),
        summary: "Normalized Amazon Ads + SP-API data and refreshed dashboards.",
      },
    ],
  };
}

const northwind = buildClient({
  id: "client-northwind-nutrition",
  brandName: "Northwind Nutrition",
  marketplace: "US",
  currency: "USD",
  accountName: "Northwind Nutrition Ads",
  profileId: "NW-US-001",
  baseSpend: 74,
  baseRevenue: 42,
  campaigns: [
    { id: "nw-c1", name: "Protein - Hero ASIN", budget: 280, channel: "Sponsored Products" },
    { id: "nw-c2", name: "Creatine - Scale", budget: 190, channel: "Sponsored Products" },
    { id: "nw-c3", name: "Brand Defense", budget: 120, channel: "Sponsored Brands" },
  ],
  products: [
    { id: "nw-p1", asin: "B0NW1001", sku: "NW-WHEY-01", title: "Northwind Grass-Fed Whey Isolate", price: 49.99, category: "Protein" },
    { id: "nw-p2", asin: "B0NW1002", sku: "NW-CREA-01", title: "Northwind Micronized Creatine", price: 24.99, category: "Performance" },
    { id: "nw-p3", asin: "B0NW1003", sku: "NW-COLL-01", title: "Northwind Marine Collagen Peptides", price: 34.99, category: "Recovery" },
  ],
  sqpQueries: [
    "grass fed whey isolate",
    "best creatine monohydrate",
    "protein powder low sugar",
    "northwind whey isolate",
    "marine collagen peptides",
  ],
  searchTerms: [
    { id: "nw-st1", term: "grass fed whey isolate", spend: 842, sales: 3360, clicks: 741, orders: 92, ctr: 0.041, cvr: 0.124, acos: 0.251, roas: 3.99 },
    { id: "nw-st2", term: "best creatine monohydrate", spend: 618, sales: 1844, clicks: 569, orders: 64, ctr: 0.038, cvr: 0.112, acos: 0.335, roas: 2.98 },
    { id: "nw-st3", term: "protein powder low sugar", spend: 510, sales: 1229, clicks: 498, orders: 34, ctr: 0.031, cvr: 0.068, acos: 0.415, roas: 2.41 },
    { id: "nw-st4", term: "northwind whey isolate", spend: 296, sales: 1738, clicks: 284, orders: 52, ctr: 0.072, cvr: 0.183, acos: 0.17, roas: 5.87 },
  ],
  audit: {
    title: "Northwind Nutrition Weekly Audit",
    summary: "ACOS drift is being driven by generic non-brand acquisition while brand defense remains highly efficient.",
    findings: [
      { category: "Wasted spend", severity: "high", insight: "Generic protein and creatine terms carry elevated spend with below-target CVR." },
      { category: "High performers", severity: "medium", insight: "Brand defense maintains strong ROAS and can safely absorb more budget." },
      { category: "SQP opportunity", severity: "medium", insight: "Purchase share is outpacing paid investment on core whey isolate queries." },
    ],
  },
  marketingPlan: {
    title: "Northwind Nutrition 30-Day Plan",
    immediateFixes: ["Reduce bids on low-CVR broad terms by 15%.", "Add negatives from low-converting generic search terms."],
    campaignRestructuring: ["Split generic protein and creatine themes into tighter exact-match campaigns.", "Separate brand defense into its own reporting view and budget lane."],
    budgetReallocation: ["Move 12% of spend into branded and hero-ASIN campaigns.", "Cap low-ROAS generics until CVR improves."],
    keywordActions: ["Harvest exact-match winners from SQP scale candidates.", "Pause search terms with spend > $120 and no orders."],
    sqpStrategy: ["Launch dedicated exact campaigns for high-purchase-share whey terms.", "Refresh creative for queries with strong impression share but weak click share."],
    roadmap: [
      { week: "Week 1", action: "Bid cuts, negatives, and waste cleanup" },
      { week: "Week 2", action: "Launch exact-match scale campaigns" },
      { week: "Week 3", action: "PDP and creative refresh for low-click queries" },
      { week: "Week 4", action: "Budget reforecast and report-out" },
    ],
  },
});

const alpine = buildClient({
  id: "client-alpine-glow-beauty",
  brandName: "Alpine Glow Beauty",
  marketplace: "UK",
  currency: "GBP",
  accountName: "Alpine Glow Beauty Ads",
  profileId: "AG-UK-001",
  baseSpend: 62,
  baseRevenue: 34,
  campaigns: [
    { id: "ag-c1", name: "Vitamin C Serum - Prospecting", budget: 210, channel: "Sponsored Products" },
    { id: "ag-c2", name: "Moisturizer - Retargeting", budget: 145, channel: "Sponsored Display" },
    { id: "ag-c3", name: "Brand Search", budget: 95, channel: "Sponsored Brands" },
  ],
  products: [
    { id: "ag-p1", asin: "B0AG1001", sku: "AG-SERUM-01", title: "Alpine Glow Vitamin C Serum", price: 27.99, category: "Serums" },
    { id: "ag-p2", asin: "B0AG1002", sku: "AG-CREAM-01", title: "Alpine Glow Ceramide Moisturizer", price: 22.49, category: "Moisturizers" },
    { id: "ag-p3", asin: "B0AG1003", sku: "AG-EYE-01", title: "Alpine Glow Caffeine Eye Cream", price: 18.99, category: "Eye Care" },
  ],
  sqpQueries: [
    "vitamin c serum sensitive skin",
    "ceramide moisturizer face",
    "caffeine eye cream depuff",
    "alpine glow serum",
    "brightening serum dark spots",
  ],
  searchTerms: [
    { id: "ag-st1", term: "vitamin c serum sensitive skin", spend: 642, sales: 1984, clicks: 588, orders: 73, ctr: 0.039, cvr: 0.124, acos: 0.324, roas: 3.09 },
    { id: "ag-st2", term: "ceramide moisturizer face", spend: 521, sales: 1682, clicks: 470, orders: 66, ctr: 0.036, cvr: 0.141, acos: 0.31, roas: 3.23 },
    { id: "ag-st3", term: "brightening serum dark spots", spend: 408, sales: 924, clicks: 422, orders: 28, ctr: 0.027, cvr: 0.066, acos: 0.442, roas: 2.27 },
    { id: "ag-st4", term: "alpine glow serum", spend: 204, sales: 1308, clicks: 198, orders: 44, ctr: 0.069, cvr: 0.222, acos: 0.156, roas: 6.41 },
  ],
  audit: {
    title: "Alpine Glow Beauty Weekly Audit",
    summary: "Retargeting and brand campaigns are healthy, but cold acquisition terms need tighter creative and offer alignment.",
    findings: [
      { category: "Wasted spend", severity: "high", insight: "Brightening serum prospecting terms show poor click-through and weak conversion." },
      { category: "Creative signal", severity: "medium", insight: "Several queries have strong impression share but low click share, suggesting a title or image problem." },
      { category: "Scale candidate", severity: "medium", insight: "Brand and moisturizer retargeting terms remain efficient and can scale." },
    ],
  },
  marketingPlan: {
    title: "Alpine Glow Beauty 30-Day Plan",
    immediateFixes: ["Downbid weak prospecting terms and isolate them for creative testing.", "Boost budget on brand search and retargeting."],
    campaignRestructuring: ["Create category-specific exact campaigns for serum and moisturizer.", "Separate hero product retargeting from brand awareness."],
    budgetReallocation: ["Move 10% of spend from weak prospecting into high-ROAS brand and retargeting campaigns."],
    keywordActions: ["Promote efficient retargeting terms into standalone ad groups.", "Add negatives for vague low-intent skincare searches."],
    sqpStrategy: ["Test higher bids on high-purchase-share moisturizer terms.", "Refresh main image/title for high-impression, low-click serum queries."],
    roadmap: [
      { week: "Week 1", action: "Waste reduction and search term isolation" },
      { week: "Week 2", action: "Creative test rollout" },
      { week: "Week 3", action: "SQP-led scaling" },
      { week: "Week 4", action: "Budget pacing and report delivery" },
    ],
  },
});

export const demoWorkspace: DemoWorkspace = {
  id: workspaceId,
  name: "Agency Growth Partners",
  slug: "agency-growth-partners",
  members,
  clients: [northwind, alpine],
};

export function getDemoClients() {
  return demoWorkspace.clients;
}

export function getDemoClientById(clientId: string) {
  return demoWorkspace.clients.find((client) => client.id === clientId);
}
