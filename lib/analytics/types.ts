/**
 * Shared analytics types. These describe the normalized metric shapes consumed
 * by dashboards, the SQP analyzer, the audit engine and the AI co-pilot.
 */

export interface DateRange {
  from: Date;
  to: Date;
}

/** The full KPI set rendered on dashboards and used by the AI context. */
export interface MetricSummary {
  spend: number;
  sales: number; // ad-attributed sales
  revenue: number; // total business revenue (organic + ad)
  impressions: number;
  clicks: number;
  orders: number;
  units: number;
  // Derived ratios
  acos: number; // spend / ad sales
  tacos: number; // spend / total revenue
  roas: number; // ad sales / spend
  ctr: number; // clicks / impressions
  cpc: number; // spend / clicks
  cvr: number; // orders / clicks
}

export interface MetricWithComparison {
  current: MetricSummary;
  previous: MetricSummary;
  /** Per-metric percentage change vs previous period. */
  delta: Record<keyof MetricSummary, number>;
}

export interface TrendPoint {
  date: string; // ISO yyyy-mm-dd
  spend: number;
  sales: number;
  revenue: number;
  impressions: number;
  clicks: number;
  orders: number;
  acos: number;
  tacos: number;
  roas: number;
}

export interface CampaignPerformanceRow {
  id: string;
  name: string;
  type: string;
  state: string;
  dailyBudget: number;
  spend: number;
  sales: number;
  impressions: number;
  clicks: number;
  orders: number;
  acos: number;
  roas: number;
  ctr: number;
  cpc: number;
  cvr: number;
}

export interface ProductPerformanceRow {
  id: string;
  asin: string;
  title: string;
  imageUrl?: string | null;
  price: number;
  revenue: number;
  units: number;
  sessions: number;
  conversionRate: number;
  buyBoxPct: number;
}

export interface SearchTermRow {
  query: string;
  matchType: string;
  impressions: number;
  clicks: number;
  spend: number;
  orders: number;
  sales: number;
  acos: number;
  ctr: number;
  cvr: number;
}
