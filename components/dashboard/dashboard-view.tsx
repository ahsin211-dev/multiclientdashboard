import { CampaignTable } from "@/components/tables/campaign-table";
import { DateRangeControls } from "@/components/dashboard/date-range-controls";
import { MetricCard } from "@/components/dashboard/metric-card";
import { ProductTable } from "@/components/tables/product-table";
import { SearchTermTable } from "@/components/tables/search-term-table";
import { SqpTable } from "@/components/tables/sqp-table";
import { TrendChart } from "@/components/charts/trend-chart";
import type { DashboardData } from "@/lib/analytics/types";
import { formatCurrency, formatNumber, formatPercent, formatRatio } from "@/lib/utils";

export function DashboardView({ data, basePath }: { data: DashboardData; basePath: string }) {
  const summary = data.summary;
  return (
    <div className="grid gap-6">
      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-blue-600">Amazon intelligence</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">{data.client.brandName}</h1>
          <p className="mt-2 text-slate-600">
            Multi-client ads, sales, SQP, audit, and AI co-pilot dashboard.
          </p>
        </div>
        <DateRangeControls basePath={basePath} activeRange={data.range.key} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard title="Ad spend" value={formatCurrency(summary.spend)} delta={summary.delta.spend} inverse />
        <MetricCard title="Sales" value={formatCurrency(summary.sales)} delta={summary.delta.sales} />
        <MetricCard title="TACOS" value={formatPercent(summary.tacos)} delta={summary.delta.tacos} inverse />
        <MetricCard title="ACOS" value={formatPercent(summary.acos)} delta={summary.delta.acos} inverse />
        <MetricCard title="ROAS" value={formatRatio(summary.roas)} delta={summary.delta.roas} />
        <MetricCard title="Impressions" value={formatNumber(summary.impressions)} delta={summary.delta.impressions} />
        <MetricCard title="Clicks" value={formatNumber(summary.clicks)} delta={summary.delta.clicks} />
        <MetricCard title="CTR" value={formatPercent(summary.ctr)} delta={summary.delta.ctr} />
        <MetricCard title="CPC" value={formatCurrency(summary.cpc)} delta={summary.delta.cpc} inverse />
        <MetricCard title="CVR" value={formatPercent(summary.cvr)} delta={summary.delta.cvr} />
        <MetricCard title="Orders" value={formatNumber(summary.orders)} delta={summary.delta.orders} />
        <MetricCard title="Revenue" value={formatCurrency(summary.revenue)} delta={summary.delta.revenue} />
      </div>

      <TrendChart data={data.trends} />
      <CampaignTable campaigns={data.campaigns} />
      <ProductTable products={data.products} />
      <SearchTermTable searchTerms={data.searchTerms} />
      <SqpTable insights={data.sqpInsights} />
    </div>
  );
}
