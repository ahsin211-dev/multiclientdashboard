import { AppShell } from "@/components/layout/app-shell";
import { MetricCard } from "@/components/dashboard/metric-card";
import { TrendChart } from "@/components/dashboard/trend-chart";
import { CampaignTable } from "@/components/dashboard/campaign-table";
import { ClientSwitcher } from "@/components/dashboard/client-switcher";
import { DateRangePicker } from "@/components/dashboard/date-range-picker";
import { EmptyState } from "@/components/dashboard/empty-state";
import { getWorkspaceClients } from "@/lib/data/workspace";
import { getPeriodRange } from "@/lib/analytics/date-ranges";
import {
  getDashboardMetrics,
  getCampaignPerformance,
} from "@/lib/analytics/metrics";
import { prisma } from "@/lib/db/prisma";
import { requireSession } from "@/lib/auth/session";

interface PageProps {
  searchParams: Promise<{ period?: string }>;
}

export default async function DashboardPage({ searchParams }: PageProps) {
  const session = await requireSession();
  const { period = "30d" } = await searchParams;
  const clients = await getWorkspaceClients();

  if (clients.length === 0) {
    return (
      <AppShell title="Dashboard">
        <EmptyState
          title="No clients yet"
          description="Add your first client to start tracking Amazon Ads performance."
          actionLabel="Add Client"
          actionHref="/clients"
        />
      </AppShell>
    );
  }

  const clientIds = clients.map((c) => c.id);
  const { current, previous } = getPeriodRange(period === "7d" ? "7d" : "30d");

  const allMetrics = await Promise.all(
    clientIds.map((id) => getDashboardMetrics(id, current, previous))
  );

  const aggregate = {
    adSpend: { value: 0, previous: 0 },
    sales: { value: 0, previous: 0 },
    revenue: { value: 0, previous: 0 },
    tacos: { value: 0, previous: 0 },
    acos: { value: 0, previous: 0 },
    roas: { value: 0, previous: 0 },
    impressions: { value: 0, previous: 0 },
    clicks: { value: 0, previous: 0 },
    ctr: { value: 0, previous: 0 },
    cpc: { value: 0, previous: 0 },
    cvr: { value: 0, previous: 0 },
    orders: { value: 0, previous: 0 },
  };

  for (const m of allMetrics) {
    aggregate.adSpend.value += m.adSpend.value;
    aggregate.adSpend.previous = (aggregate.adSpend.previous ?? 0) + (m.adSpend.previous ?? 0);
    aggregate.sales.value += m.sales.value;
    aggregate.sales.previous = (aggregate.sales.previous ?? 0) + (m.sales.previous ?? 0);
    aggregate.revenue.value += m.revenue.value;
    aggregate.revenue.previous = (aggregate.revenue.previous ?? 0) + (m.revenue.previous ?? 0);
    aggregate.impressions.value += m.impressions.value;
    aggregate.clicks.value += m.clicks.value;
    aggregate.orders.value += m.orders.value;
  }

  aggregate.acos.value = aggregate.sales.value > 0 ? (aggregate.adSpend.value / aggregate.sales.value) * 100 : 0;
  aggregate.roas.value = aggregate.adSpend.value > 0 ? aggregate.sales.value / aggregate.adSpend.value : 0;
  aggregate.tacos.value = aggregate.revenue.value > 0 ? (aggregate.adSpend.value / aggregate.revenue.value) * 100 : 0;
  aggregate.ctr.value = aggregate.impressions.value > 0 ? (aggregate.clicks.value / aggregate.impressions.value) * 100 : 0;

  const trendData = await prisma.adMetric.groupBy({
    by: ["date"],
    where: {
      clientId: { in: clientIds },
      date: { gte: current.from, lte: current.to },
    },
    _sum: { spend: true, sales: true },
    orderBy: { date: "asc" },
  });

  const chartData = trendData.map((d) => ({
    date: d.date.toISOString().split("T")[0],
    spend: d._sum.spend ?? 0,
    sales: d._sum.sales ?? 0,
  }));

  const allCampaigns = await Promise.all(
    clientIds.map((id) => getCampaignPerformance(id, current))
  );
  const topCampaigns = allCampaigns.flat().sort((a, b) => b.spend - a.spend).slice(0, 10);

  const workspace = await prisma.workspace.findUnique({ where: { id: session.workspaceId } });

  return (
    <AppShell
      title={`${workspace?.name ?? "Workspace"} Dashboard`}
      actions={
        <>
          <ClientSwitcher clients={clients} />
          <DateRangePicker />
        </>
      }
    >
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard title="Total Ad Spend" metric={aggregate.adSpend} format="currency" />
        <MetricCard title="Attributed Sales" metric={aggregate.sales} format="currency" />
        <MetricCard title="Total Revenue" metric={aggregate.revenue} format="currency" />
        <MetricCard title="TACOS" metric={aggregate.tacos} format="percent" invertDelta />
        <MetricCard title="ACOS" metric={aggregate.acos} format="percent" invertDelta />
        <MetricCard title="ROAS" metric={aggregate.roas} format="ratio" />
        <MetricCard title="Impressions" metric={aggregate.impressions} />
        <MetricCard title="Clicks" metric={aggregate.clicks} />
        <MetricCard title="CTR" metric={aggregate.ctr} format="percent" />
        <MetricCard title="Orders" metric={aggregate.orders} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <TrendChart data={chartData} title="Portfolio Spend vs Sales" />
      </div>

      <div className="mt-6">
        <CampaignTable campaigns={topCampaigns} />
      </div>
    </AppShell>
  );
}
