import { MetricCard } from "./metric-card";
import type { MetricWithComparison } from "@/lib/analytics/types";
import { formatCurrency, formatNumber, formatPercent } from "@/lib/utils";

/** Renders the full KPI card grid for a client's metrics. */
export function MetricGrid({
  metrics,
  currency = "USD",
}: {
  metrics: MetricWithComparison;
  currency?: string;
}) {
  const c = metrics.current;
  const d = metrics.delta;

  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
      <MetricCard
        label="Ad Spend"
        value={formatCurrency(c.spend, currency)}
        delta={d.spend}
        higherIsBetter={false}
      />
      <MetricCard
        label="Ad Sales"
        value={formatCurrency(c.sales, currency)}
        delta={d.sales}
      />
      <MetricCard
        label="Revenue"
        value={formatCurrency(c.revenue, currency)}
        delta={d.revenue}
        hint="Total business (organic + ad)"
      />
      <MetricCard
        label="ACOS"
        value={formatPercent(c.acos)}
        delta={d.acos}
        higherIsBetter={false}
      />
      <MetricCard
        label="TACOS"
        value={formatPercent(c.tacos)}
        delta={d.tacos}
        higherIsBetter={false}
      />
      <MetricCard label="ROAS" value={`${c.roas.toFixed(2)}x`} delta={d.roas} />
      <MetricCard
        label="Impressions"
        value={formatNumber(c.impressions)}
        delta={d.impressions}
      />
      <MetricCard label="Clicks" value={formatNumber(c.clicks)} delta={d.clicks} />
      <MetricCard
        label="CTR"
        value={formatPercent(c.ctr, 2)}
        delta={d.ctr}
      />
      <MetricCard label="CPC" value={formatCurrency(c.cpc, currency)} delta={d.cpc} higherIsBetter={false} />
      <MetricCard label="CVR" value={formatPercent(c.cvr)} delta={d.cvr} />
      <MetricCard label="Orders" value={formatNumber(c.orders)} delta={d.orders} />
    </div>
  );
}
