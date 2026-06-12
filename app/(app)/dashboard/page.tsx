import Link from "next/link";

import { DateRangePicker } from "@/components/dashboard/date-range-picker";
import { InsightList } from "@/components/dashboard/insight-list";
import { MetricCard } from "@/components/dashboard/metric-card";
import { PerformanceChart } from "@/components/charts/performance-chart";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CampaignTable } from "@/components/tables/campaign-table";
import { ProductTable } from "@/components/tables/product-table";
import { SearchTermTable } from "@/components/tables/search-term-table";
import { getCampaignPerformance, getPerformanceSummary, getProductPerformance, getSearchTermPerformance, getTrendSeries, getWastedSpend, type MetricCardValue } from "@/lib/analytics/service";
import { getClients } from "@/lib/db/repository";
import { formatCurrency, parseDateRange } from "@/lib/utils";

type DashboardPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function mergeMetrics(metricGroups: MetricCardValue[][]) {
  const map = new Map<string, MetricCardValue>();

  metricGroups.flat().forEach((metric) => {
    const current = map.get(metric.key);
    if (!current) {
      map.set(metric.key, { ...metric });
      return;
    }

    current.value += metric.value;
    current.previousValue += metric.previousValue;
  });

  return [...map.values()].map((metric) => ({
    ...metric,
    delta:
      metric.previousValue === 0
        ? metric.value === 0
          ? 0
          : 1
        : (metric.value - metric.previousValue) / metric.previousValue,
  }));
}

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const resolvedParams = searchParams ? await searchParams : undefined;
  const range = parseDateRange(resolvedParams);
  const clients = await getClients();
  const summaries = await Promise.all(clients.map((client) => getPerformanceSummary(client.id, range)));
  const metrics = mergeMetrics(summaries.flatMap((summary) => (summary ? [summary.metrics] : [])));
  const trendSeries = await Promise.all(clients.map((client) => getTrendSeries(client.id, range)));

  const trendMap = new Map<string, { date: string; spend: number; sales: number; revenue: number }>();
  trendSeries.flat().forEach((point) => {
    const current = trendMap.get(point.date) ?? { date: point.date, spend: 0, sales: 0, revenue: 0 };
    current.spend += point.spend;
    current.sales += point.sales;
    current.revenue += point.revenue;
    trendMap.set(point.date, current);
  });

  const topCampaigns = (
    await Promise.all(
      clients.map(async (client) =>
        (await getCampaignPerformance(client.id, range)).slice(0, 2).map((row) => ({
          ...row,
          campaign: `${client.brandName} · ${row.campaign}`,
        })),
      ),
    )
  )
    .flat()
    .sort((left, right) => right.sales - left.sales)
    .slice(0, 6);

  const topProducts = (
    await Promise.all(
      clients.map(async (client) =>
        (await getProductPerformance(client.id, range)).slice(0, 2).map((row) => ({
          ...row,
          product: `${client.brandName} · ${row.product}`,
        })),
      ),
    )
  )
    .flat()
    .sort((left, right) => right.revenue - left.revenue)
    .slice(0, 6);

  const topSearchTerms = (
    await Promise.all(
      clients.map(async (client) =>
        (await getSearchTermPerformance(client.id)).slice(0, 2).map((row) => ({
          ...row,
          term: `${client.brandName} · ${row.term}`,
        })),
      ),
    )
  )
    .flat()
    .sort((left, right) => right.sales - left.sales)
    .slice(0, 8);

  const wastedSpend = (
    await Promise.all(clients.map((client) => getWastedSpend(client.id, range)))
  ).flat().slice(0, 5);

  return (
    <div className="space-y-8">
      <section className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-medium uppercase tracking-[0.24em] text-slate-400">
            Portfolio dashboard
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">
            Multi-client Amazon growth control center
          </h1>
          <p className="mt-2 max-w-3xl text-slate-600">
            Agency-wide performance across spend, sales, efficiency, and SQP opportunity signals.
          </p>
        </div>
        <DateRangePicker current={range.preset} />
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {metrics.slice(0, 8).map((metric) => (
          <MetricCard key={metric.key} metric={metric} currency="USD" />
        ))}
      </section>

      <PerformanceChart data={[...trendMap.values()].sort((left, right) => left.date.localeCompare(right.date))} />

      <section className="grid gap-4 xl:grid-cols-3">
        {clients.map((client) => (
          <Card key={client.id}>
            <CardHeader>
              <CardTitle>{client.brandName}</CardTitle>
              <CardDescription>
                {client.marketplace} marketplace · Last sync {new Date(client.lastSyncAt).toLocaleString()}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-lg border border-slate-100 p-3">
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Campaigns</p>
                  <p className="mt-2 text-lg font-semibold text-slate-950">{client.campaigns.length}</p>
                </div>
                <div className="rounded-lg border border-slate-100 p-3">
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Products</p>
                  <p className="mt-2 text-lg font-semibold text-slate-950">{client.products.length}</p>
                </div>
              </div>
              <Link
                href={`/clients/${client.id}/dashboard`}
                className="inline-flex text-sm font-medium text-slate-900 underline-offset-4 hover:underline"
              >
                Open client workspace
              </Link>
            </CardContent>
          </Card>
        ))}
      </section>

      <CampaignTable rows={topCampaigns} currency="USD" />
      <ProductTable rows={topProducts} currency="USD" />
      <SearchTermTable rows={topSearchTerms} currency="USD" />
      <InsightList title="Portfolio wasted spend watchlist" rows={wastedSpend} />
    </div>
  );
}
