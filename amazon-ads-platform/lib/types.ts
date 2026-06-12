export interface DateRange {
  from: Date;
  to: Date;
}

export interface MetricSummary {
  spend: number;
  sales: number;
  revenue: number;
  impressions: number;
  clicks: number;
  orders: number;
  acos: number;
  roas: number;
  tacos: number;
  ctr: number;
  cpc: number;
  cvr: number;
  spendChange?: number;
  salesChange?: number;
  acosChange?: number;
  roasChange?: number;
  impressionsChange?: number;
  clicksChange?: number;
  ordersChange?: number;
}

export interface CampaignPerformance {
  id: string;
  name: string;
  type: string;
  state: string;
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
  budget: number;
}

export interface ProductPerformance {
  asin: string;
  title: string;
  imageUrl?: string;
  revenue: number;
  units: number;
  sessions: number;
  cvr: number;
  adSpend: number;
  adSales: number;
  acos: number;
  tacos: number;
}

export interface SQPRow {
  id: string;
  query: string;
  impressionShare: number;
  clickShare: number;
  cartAddShare: number;
  purchaseShare: number;
  ppcSpend: number;
  ppcSales: number;
  ppcClicks: number;
  ppcOrders: number;
  acos: number;
  roas: number;
  action: "SCALE" | "CUT" | "TEST" | "DEFEND" | "MONITOR";
  reason: string;
}

export interface ChartDataPoint {
  date: string;
  spend: number;
  sales: number;
  acos: number;
  roas: number;
  impressions: number;
  clicks: number;
  orders: number;
}

export interface AuditFinding {
  category: string;
  severity: "HIGH" | "MEDIUM" | "LOW";
  title: string;
  description: string;
  impact: string;
  recommendation: string;
  affectedItems?: string[];
  estimatedWastedSpend?: number;
}

export interface ClientContext {
  client: {
    id: string;
    name: string;
    brandName: string;
    marketplace: string;
  };
  dateRange: DateRange;
  metrics: MetricSummary;
  campaigns: CampaignPerformance[];
  topProducts: ProductPerformance[];
  sqpInsights: SQPRow[];
  wastedSpend: number;
  scalingOpportunities: Array<{
    type: string;
    name: string;
    recommendation: string;
    potentialImpact: string;
  }>;
}
