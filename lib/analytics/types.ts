export type DateRangeKey = "7d" | "30d" | "custom";

export type DateRange = {
  key: DateRangeKey;
  from: Date;
  to: Date;
};

export type MetricSummary = {
  spend: number;
  sales: number;
  tacos: number;
  acos: number;
  roas: number;
  impressions: number;
  clicks: number;
  ctr: number;
  cpc: number;
  cvr: number;
  orders: number;
  revenue: number;
};

export type MetricComparison = MetricSummary & {
  previous: MetricSummary;
  delta: Partial<Record<keyof MetricSummary, number>>;
};

export type TrendPoint = {
  date: string;
  spend: number;
  sales: number;
  revenue: number;
  acos: number;
  roas: number;
};

export type CampaignPerformance = {
  id: string;
  name: string;
  state: string;
  spend: number;
  sales: number;
  acos: number;
  roas: number;
  clicks: number;
  orders: number;
};

export type ProductPerformance = {
  id: string;
  asin: string;
  title: string;
  revenue: number;
  adSales: number;
  spend: number;
  tacos: number;
  cvr: number;
  orders: number;
};

export type SearchTermPerformance = {
  query: string;
  spend: number;
  sales: number;
  acos: number;
  roas: number;
  clicks: number;
  orders: number;
};

export type SqpAction = "Scale" | "Cut" | "Test" | "Defend";

export type SqpInsight = {
  query: string;
  impressionShare: number;
  clickShare: number;
  cartAddShare: number;
  purchaseShare: number;
  ppcSpend: number;
  ppcClicks: number;
  ppcOrders: number;
  ppcSales: number;
  acos: number;
  roas: number;
  recommendedAction: SqpAction;
  reason: string;
};

export type ClientRecord = {
  id: string;
  brandName: string;
  marketplace: string;
  syncStatus: string;
  lastSyncAt: string | null;
};

export type DashboardData = {
  client: ClientRecord;
  clients: ClientRecord[];
  range: DateRange;
  summary: MetricComparison;
  trends: TrendPoint[];
  campaigns: CampaignPerformance[];
  products: ProductPerformance[];
  searchTerms: SearchTermPerformance[];
  sqpInsights: SqpInsight[];
};

export type AuditFinding = {
  category: string;
  severity: "high" | "medium" | "low";
  finding: string;
  recommendation: string;
  impact: string;
};

export type MarketingPlan = {
  immediateFixes: string[];
  campaignRestructuring: string[];
  budgetReallocation: string[];
  keywordActions: string[];
  sqpStrategy: string[];
  roadmap30Days: string[];
};

export type ClientReport = {
  executiveSummary: string;
  keyMetrics: MetricSummary;
  problemsFound: string[];
  recommendedActions: string[];
  nextSteps: string[];
};

export type ClientContext = {
  client: ClientRecord;
  summary: MetricComparison;
  campaigns: CampaignPerformance[];
  products: ProductPerformance[];
  sqpInsights: SqpInsight[];
  wastedSpend: SearchTermPerformance[];
  scalingOpportunities: CampaignPerformance[];
  dateRange: {
    from: string;
    to: string;
  };
};
