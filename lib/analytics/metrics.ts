import { ratio } from "@/lib/utils";
import type { MetricSummary } from "./types";

/** Raw additive totals before derived ratios are computed. */
export interface RawTotals {
  spend: number;
  sales: number;
  revenue: number;
  impressions: number;
  clicks: number;
  orders: number;
  units: number;
}

export const emptyTotals = (): RawTotals => ({
  spend: 0,
  sales: 0,
  revenue: 0,
  impressions: 0,
  clicks: 0,
  orders: 0,
  units: 0,
});

export function addTotals(a: RawTotals, b: Partial<RawTotals>): RawTotals {
  return {
    spend: a.spend + (b.spend ?? 0),
    sales: a.sales + (b.sales ?? 0),
    revenue: a.revenue + (b.revenue ?? 0),
    impressions: a.impressions + (b.impressions ?? 0),
    clicks: a.clicks + (b.clicks ?? 0),
    orders: a.orders + (b.orders ?? 0),
    units: a.units + (b.units ?? 0),
  };
}

/**
 * Compute the full derived KPI set from raw additive totals. All ratios are
 * computed on the totals (never averaged from row-level ratios) so they stay
 * mathematically correct across any aggregation grain.
 */
export function deriveMetrics(t: RawTotals): MetricSummary {
  return {
    spend: t.spend,
    sales: t.sales,
    revenue: t.revenue,
    impressions: t.impressions,
    clicks: t.clicks,
    orders: t.orders,
    units: t.units,
    acos: ratio(t.spend, t.sales),
    tacos: ratio(t.spend, t.revenue),
    roas: ratio(t.sales, t.spend),
    ctr: ratio(t.clicks, t.impressions),
    cpc: ratio(t.spend, t.clicks),
    cvr: ratio(t.orders, t.clicks),
  };
}

export const emptyMetrics = (): MetricSummary => deriveMetrics(emptyTotals());
