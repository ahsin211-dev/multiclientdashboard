import { Suspense } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { MetricCard } from "@/components/dashboard/metric-card";
import { TrendChart } from "@/components/dashboard/trend-chart";
import { CampaignTable } from "@/components/dashboard/campaign-table";
import { ProductTable } from "@/components/dashboard/product-table";
import { SearchTermTable } from "@/components/dashboard/search-term-table";
import { SQPTable } from "@/components/dashboard/sqp-table";
import { ClientSwitcher } from "@/components/dashboard/client-switcher";
import { DateRangePicker } from "@/components/dashboard/date-range-picker";
import { SyncButton } from "@/components/dashboard/sync-button";
import { Skeleton } from "@/components/ui/skeleton";
import { getClientOrThrow, getWorkspaceClients } from "@/lib/data/workspace";
import { getPeriodRange } from "@/lib/analytics/date-ranges";
import {
  getDashboardMetrics,
  getTrendData,
  getCampaignPerformance,
  getProductPerformance,
  getSearchTermPerformance,
} from "@/lib/analytics/metrics";
import { getSQPInsights } from "@/lib/analytics/sqp";
import { Badge } from "@/components/ui/badge";

interface PageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ period?: string }>;
}

async function ClientDashboardContent({
  clientId,
  period,
}: {
  clientId: string;
  period: string;
}) {
  const [client, clients] = await Promise.all([
    getClientOrThrow(clientId),
    getWorkspaceClients(),
  ]);

  const { current, previous } = getPeriodRange(period === "7d" ? "7d" : "30d");

  const [metrics, trendData, campaigns, products, searchTerms, sqpInsights] =
    await Promise.all([
      getDashboardMetrics(clientId, current, previous),
      getTrendData(clientId, current),
      getCampaignPerformance(clientId, current),
      getProductPerformance(clientId, current),
      getSearchTermPerformance(clientId, current),
      getSQPInsights(clientId, current),
    ]);

  return (
  <>
    <AppShell
      clientId={clientId}
      title={client.brandName}
      actions={
        <>
          <Badge variant="outline">{client.marketplace}</Badge>
          <ClientSwitcher clients={clients} currentClientId={clientId} />
          <DateRangePicker />
          <SyncButton clientId={clientId} />
        </>
      }
    >
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard title="Ad Spend" metric={metrics.adSpend} format="currency" />
        <MetricCard title="Attributed Sales" metric={metrics.sales} format="currency" />
        <MetricCard title="Revenue" metric={metrics.revenue} format="currency" />
        <MetricCard title="TACOS" metric={metrics.tacos} format="percent" invertDelta />
        <MetricCard title="ACOS" metric={metrics.acos} format="percent" invertDelta />
        <MetricCard title="ROAS" metric={metrics.roas} format="ratio" />
        <MetricCard title="Impressions" metric={metrics.impressions} />
        <MetricCard title="Clicks" metric={metrics.clicks} />
        <MetricCard title="CTR" metric={metrics.ctr} format="percent" />
        <MetricCard title="CPC" metric={metrics.cpc} format="currency" />
        <MetricCard title="CVR" metric={metrics.cvr} format="percent" />
        <MetricCard title="Orders" metric={metrics.orders} />
      </div>

      <div className="mt-6">
        <TrendChart data={trendData} />
      </div>

      <div className="mt-6 space-y-6">
        <CampaignTable campaigns={campaigns} />
        <ProductTable products={products} />
        <SearchTermTable terms={searchTerms} />
        <SQPTable insights={sqpInsights} />
      </div>
    </AppShell>
  </>
  );
}

export default async function ClientDashboardPage({ params, searchParams }: PageProps) {
  const { id } = await params;
  const { period = "30d" } = await searchParams;

  return (
    <Suspense
      fallback={
        <div className="p-6 space-y-4">
          <Skeleton className="h-8 w-64" />
          <div className="grid gap-4 md:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-24" />
            ))}
          </div>
        </div>
      }
    >
      <ClientDashboardContent clientId={id} period={period} />
    </Suspense>
  );
}
