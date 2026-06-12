export type DateRangePreset = "last7" | "last30" | "custom";

export interface DateRange {
  from: Date;
  to: Date;
}

export interface MetricSnapshot {
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
}

export interface MetricComparison {
  current: number;
  previous: number;
  delta: number;
  deltaPct: number;
}

export interface DashboardSummary {
  spend: MetricComparison;
  sales: MetricComparison;
  tacos: MetricComparison;
  acos: MetricComparison;
  roas: MetricComparison;
  impressions: MetricComparison;
  clicks: MetricComparison;
  ctr: MetricComparison;
  cpc: MetricComparison;
  cvr: MetricComparison;
  orders: MetricComparison;
  revenue: MetricComparison;
}

export interface TrendPoint {
  date: string;
  spend: number;
  sales: number;
  tacos: number;
  acos: number;
}
