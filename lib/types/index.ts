export interface DateRange {
  from: Date;
  to: Date;
}

export interface MetricValue {
  value: number;
  previous?: number;
  delta?: number;
}

export interface DashboardMetrics {
  adSpend: MetricValue;
  sales: MetricValue;
  revenue: MetricValue;
  tacos: MetricValue;
  acos: MetricValue;
  roas: MetricValue;
  impressions: MetricValue;
  clicks: MetricValue;
  ctr: MetricValue;
  cpc: MetricValue;
  cvr: MetricValue;
  orders: MetricValue;
}

export interface CampaignPerformance {
  id: string;
  name: string;
  spend: number;
  sales: number;
  acos: number;
  roas: number;
  impressions: number;
  clicks: number;
  ctr: number;
  orders: number;
}

export interface ProductPerformance {
  asin: string;
  title: string;
  revenue: number;
  orders: number;
  sessions: number;
  conversion: number;
  adSpend: number;
  tacos: number;
}

export interface SearchTermPerformance {
  query: string;
  impressions: number;
  clicks: number;
  spend: number;
  sales: number;
  orders: number;
  acos: number;
  roas: number;
}

export interface SQPInsight {
  query: string;
  impressionShare: number;
  clickShare: number;
  purchaseShare: number;
  ppcSpend: number;
  ppcSales: number;
  acos: number;
  recommendedAction: string;
  reason: string;
}

export interface AuditFinding {
  type: string;
  title: string;
  description: string;
  impact: "high" | "medium" | "low";
  metric?: string;
  value?: number;
}

export interface ClientContext {
  client: {
    id: string;
    brandName: string;
    marketplace: string;
    lastSyncAt: string | null;
  };
  dateRange: { from: string; to: string };
  metrics: DashboardMetrics;
  campaigns: CampaignPerformance[];
  products: ProductPerformance[];
  searchTerms: SearchTermPerformance[];
  sqpInsights: SQPInsight[];
  wastedSpend: { query: string; spend: number; sales: number; acos: number }[];
  scalingOpportunities: SQPInsight[];
  dataGaps: string[];
}
