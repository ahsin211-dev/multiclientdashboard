import { redirect, notFound } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { getClientById, getWorkspaceClients, parseDateRange } from "@/lib/clients";
import {
  getMetricsWithComparison,
  getTrendData,
  getCampaignPerformance,
  getProductPerformance,
  getSearchTermPerformance,
} from "@/lib/analytics/metrics";
import { AppShell } from "@/components/layout/app-shell";
import { MetricCard } from "@/components/dashboard/metric-card";
import { DateRangePicker } from "@/components/dashboard/date-range-picker";
import { TrendChart } from "@/components/charts/trend-chart";
import { DataTable } from "@/components/tables/data-table";
import { SyncButton } from "@/components/dashboard/sync-button";
import { formatCurrency, formatNumber, formatPercent } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

export default async function ClientDashboardPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ range?: string }>;
}) {
  const session = await getSession();
  if (!session) redirect("/login");

  const { id } = await params;
  const sp = await searchParams;
  const client = await getClientById(id);
  if (!client) notFound();

  const clients = await getWorkspaceClients();
  const range = parseDateRange(sp.range);

  const [metrics, trend, campaigns, products, searchTerms] = await Promise.all([
    getMetricsWithComparison(id, range),
    getTrendData(id, range),
    getCampaignPerformance(id, range),
    getProductPerformance(id, range),
    getSearchTermPerformance(id, range),
  ]);

  return (
    <AppShell
      title={client.brandName}
      clientId={id}
      clients={clients}
      actions={
        <div className="flex items-center gap-2">
          <DateRangePicker />
          <SyncButton clientId={id} />
        </div>
      }
    >
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <MetricCard
            title="Ad Spend"
            value={metrics.spend}
            format="currency"
            change={metrics.changes.spend}
          />
          <MetricCard
            title="Sales"
            value={metrics.sales}
            format="currency"
            change={metrics.changes.sales}
          />
          <MetricCard
            title="Revenue"
            value={metrics.revenue}
            format="currency"
            change={metrics.changes.revenue}
          />
          <MetricCard
            title="Orders"
            value={metrics.orders}
            format="number"
            change={metrics.changes.orders}
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <MetricCard
            title="ACOS"
            value={metrics.acos}
            format="percent"
            change={metrics.changes.acos}
            invertChange
          />
          <MetricCard
            title="TACOS"
            value={metrics.tacos}
            format="percent"
            change={metrics.changes.tacos}
            invertChange
          />
          <MetricCard
            title="ROAS"
            value={metrics.roas}
            format="ratio"
            change={metrics.changes.roas}
          />
          <MetricCard
            title="Impressions"
            value={metrics.impressions}
            format="number"
            change={metrics.changes.impressions}
          />
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <MetricCard title="Clicks" value={metrics.clicks} format="number" change={metrics.changes.clicks} />
          <MetricCard title="CTR" value={metrics.ctr} format="percent" change={metrics.changes.ctr} />
          <MetricCard title="CPC" value={metrics.cpc} format="currency" change={metrics.changes.cpc} invertChange />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <MetricCard title="CVR" value={metrics.cvr} format="percent" change={metrics.changes.cvr} />
        </div>

        <TrendChart data={trend} />

        <DataTable
          title="Campaign Performance"
          data={campaigns}
          columns={[
            { key: "name", header: "Campaign" },
            {
              key: "status",
              header: "Status",
              render: (row) => (
                <Badge variant={row.status === "ENABLED" ? "success" : "secondary"}>
                  {String(row.status)}
                </Badge>
              ),
            },
            {
              key: "spend",
              header: "Spend",
              render: (row) => formatCurrency(row.spend as number),
              className: "text-right",
            },
            {
              key: "sales",
              header: "Sales",
              render: (row) => formatCurrency(row.sales as number),
              className: "text-right",
            },
            {
              key: "acos",
              header: "ACOS",
              render: (row) => formatPercent(row.acos as number),
              className: "text-right",
            },
            {
              key: "roas",
              header: "ROAS",
              render: (row) => `${(row.roas as number).toFixed(2)}x`,
              className: "text-right",
            },
          ]}
        />

        <DataTable
          title="Product Performance"
          data={products}
          columns={[
            { key: "asin", header: "ASIN" },
            {
              key: "title",
              header: "Product",
              render: (row) => (
                <span className="max-w-[200px] truncate block">
                  {String(row.title)}
                </span>
              ),
            },
            {
              key: "revenue",
              header: "Revenue",
              render: (row) => formatCurrency(row.revenue as number),
              className: "text-right",
            },
            {
              key: "orders",
              header: "Orders",
              render: (row) => formatNumber(row.orders as number),
              className: "text-right",
            },
            {
              key: "conversionRate",
              header: "CVR",
              render: (row) => formatPercent(row.conversionRate as number),
              className: "text-right",
            },
            {
              key: "tacos",
              header: "TACOS",
              render: (row) => formatPercent(row.tacos as number),
              className: "text-right",
            },
          ]}
        />

        <DataTable
          title="Search Terms"
          data={searchTerms.slice(0, 20)}
          columns={[
            { key: "query", header: "Search Term" },
            {
              key: "impressions",
              header: "Impressions",
              render: (row) => formatNumber(row.impressions as number),
              className: "text-right",
            },
            {
              key: "clicks",
              header: "Clicks",
              render: (row) => formatNumber(row.clicks as number),
              className: "text-right",
            },
            {
              key: "spend",
              header: "Spend",
              render: (row) => formatCurrency(row.spend as number),
              className: "text-right",
            },
            {
              key: "acos",
              header: "ACOS",
              render: (row) => formatPercent(row.acos as number),
              className: "text-right",
            },
          ]}
        />
      </div>
    </AppShell>
  );
}
