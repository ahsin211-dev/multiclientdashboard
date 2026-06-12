import { notFound } from "next/navigation";

import { DateRangePicker } from "@/components/dashboard/date-range-picker";
import { InsightList } from "@/components/dashboard/insight-list";
import { MetricCard } from "@/components/dashboard/metric-card";
import { PerformanceChart } from "@/components/charts/performance-chart";
import { ClientNav } from "@/components/layout/client-nav";
import { CampaignTable } from "@/components/tables/campaign-table";
import { ProductTable } from "@/components/tables/product-table";
import { SearchTermTable } from "@/components/tables/search-term-table";
import { SQPTable } from "@/components/tables/sqp-table";
import { getCampaignPerformance, getPerformanceSummary, getProductPerformance, getSQPInsights, getSearchTermPerformance, getScalingOpportunities, getTrendSeries, getWastedSpend } from "@/lib/analytics/service";
import { getClient } from "@/lib/db/repository";
import { parseDateRange } from "@/lib/utils";

type ClientDashboardPageProps = {
  params: Promise<{ id: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function ClientDashboardPage({ params, searchParams }: ClientDashboardPageProps) {
  const { id } = await params;
  const resolvedParams = searchParams ? await searchParams : undefined;
  const range = parseDateRange(resolvedParams);

  const client = await getClient(id);
  if (!client) {
    notFound();
  }

  const [summary, chartData, campaigns, products, searchTerms, sqp, wastedSpend, scaling] =
    await Promise.all([
      getPerformanceSummary(id, range),
      getTrendSeries(id, range),
      getCampaignPerformance(id, range),
      getProductPerformance(id, range),
      getSearchTermPerformance(id),
      getSQPInsights(id, range),
      getWastedSpend(id, range),
      getScalingOpportunities(id, range),
    ]);

  return (
    <div className="space-y-8">
      <section className="space-y-4">
        <ClientNav clientId={client.id} current="dashboard" />
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.24em] text-slate-400">Client dashboard</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">{client.brandName}</h1>
            <p className="mt-2 max-w-3xl text-slate-600">
              {client.marketplace} marketplace · synced {new Date(client.lastSyncAt).toLocaleString()}
            </p>
          </div>
          <DateRangePicker current={range.preset} />
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {summary?.metrics.map((metric) => (
          <MetricCard key={metric.key} metric={metric} currency={client.currency} />
        ))}
      </section>

      <PerformanceChart data={chartData} />

      <div className="grid gap-4 xl:grid-cols-2">
        <InsightList title="Wasted spend" rows={wastedSpend} />
        <InsightList title="Scaling opportunities" rows={scaling} />
      </div>

      <CampaignTable rows={campaigns} currency={client.currency} />
      <ProductTable rows={products} currency={client.currency} />
      <SearchTermTable rows={searchTerms} currency={client.currency} />
      <SQPTable rows={sqp} currency={client.currency} />
    </div>
  );
}
