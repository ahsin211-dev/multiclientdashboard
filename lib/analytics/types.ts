export interface DateRange {
  from: Date;
  to: Date;
}

export interface MetricSummary {
  spend: number;
  sales: number;
  revenue: number;
  orders: number;
  impressions: number;
  clicks: number;
  acos: number;
  tacos: number;
  roas: number;
  ctr: number;
  cpc: number;
  cvr: number;
}

export interface MetricWithComparison extends MetricSummary {
  previous: MetricSummary;
  changes: {
    spend: number;
    sales: number;
    revenue: number;
    orders: number;
    impressions: number;
    clicks: number;
    acos: number;
    tacos: number;
    roas: number;
    ctr: number;
    cpc: number;
    cvr: number;
  };
}

export interface CampaignPerformance {
  id: string;
  name: string;
  status: string;
  spend: number;
  sales: number;
  orders: number;
  impressions: number;
  clicks: number;
  acos: number;
  roas: number;
  ctr: number;
  cpc: number;
  cvr: number;
}

export interface ProductPerformance {
  id: string;
  asin: string;
  title: string;
  revenue: number;
  orders: number;
  units: number;
  sessions: number;
  conversionRate: number;
  adSpend: number;
  tacos: number;
}

export interface SearchTermPerformance {
  id: string;
  query: string;
  impressions: number;
  clicks: number;
  spend: number;
  sales: number;
  orders: number;
  acos: number;
  roas: number;
}

export interface TrendDataPoint {
  date: string;
  spend: number;
  sales: number;
  revenue: number;
  acos: number;
  tacos: number;
  impressions: number;
  clicks: number;
}

export interface SQPInsight {
  id: string;
  query: string;
  impressionShare: number;
  clickShare: number;
  purchaseShare: number;
  ppcSpend: number;
  ppcSales: number;
  ppcAcos: number;
  recommendedAction: string;
  actionReason: string;
}

export interface WastedSpendItem {
  entityType: "campaign" | "keyword" | "search_term";
  entityId: string;
  name: string;
  spend: number;
  sales: number;
  acos: number;
  reason: string;
}

export interface ScalingOpportunity {
  entityType: "campaign" | "keyword" | "sqp_query";
  entityId: string;
  name: string;
  currentSpend: number;
  roas: number;
  acos: number;
  reason: string;
  priority: "high" | "medium" | "low";
}
