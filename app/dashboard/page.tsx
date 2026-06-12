import Link from "next/link";

import { DateRangePicker } from "@/components/dashboard/date-range-picker";
import { MetricCard } from "@/components/dashboard/metric-card";
import { PerformanceTrendChart } from "@/components/charts/performance-trend-chart";
import { CampaignTable } from "@/components/tables/campaign-table";
import { ProductTable } from "@/components/tables/product-table";
import { SearchTermTable } from "@/components/tables/search-term-table";
import { prisma } from "@/lib/db/prisma";
import {
  getCampaignPerformance,
  getPerformanceSummary,
  getProductPerformance,
  getSearchTermPerformance,
  getTrendSeries
} from "@/lib/analytics/performance";
import type { DateRangePreset } from "@/lib/types";

export default async function DashboardPage({
  searchParams
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const clients = await prisma.client.findMany({
    orderBy: { brandName: "asc" },
    select: {
      id: true,
      brandName: true,
      marketplace: true,
      syncStatus: true,
      lastSyncDate: true
    }
  });

  if (clients.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center">
        <h2 className="text-lg font-semibold text-slate-900">No clients yet</h2>
        <p className="mt-1 text-sm text-slate-600">
          Seed the database and connect your first Amazon account to start.
        </p>
        <Link
          href="/connect/amazon"
          className="mt-4 inline-flex rounded-md bg-teal-700 px-4 py-2 text-sm font-medium text-white"
        >
          Connect Amazon
        </Link>
      </div>
    );
  }

  const selectedClientId = typeof params.clientId === "string" ? params.clientId : clients[0].id;
  const range = (typeof params.range === "string" ? params.range : "last7") as DateRangePreset;
  const from = typeof params.from === "string" ? params.from : undefined;
  const to = typeof params.to === "string" ? params.to : undefined;

  const [summary, trend, campaigns, products, searchTerms] = await Promise.all([
    getPerformanceSummary(selectedClientId, range, from, to),
    getTrendSeries(selectedClientId, range, from, to),
    getCampaignPerformance(selectedClientId, 12),
    getProductPerformance(selectedClientId, 10),
    getSearchTermPerformance(selectedClientId, 15)
  ]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Executive Dashboard</h2>
          <p className="text-sm text-slate-600">
            Track ad spend, sales efficiency, and trend movement across client data.
          </p>
        </div>
        <DateRangePicker />
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Ad Spend" value={summary.spend.current} delta={summary.spend.deltaPct} currency />
        <MetricCard label="Sales" value={summary.sales.current} delta={summary.sales.deltaPct} currency />
        <MetricCard label="ACOS" value={summary.acos.current} delta={summary.acos.deltaPct} isPercent />
        <MetricCard label="ROAS" value={summary.roas.current} delta={summary.roas.deltaPct} />
        <MetricCard label="TACOS" value={summary.tacos.current} delta={summary.tacos.deltaPct} isPercent />
        <MetricCard label="Impressions" value={summary.impressions.current} delta={summary.impressions.deltaPct} />
        <MetricCard label="Clicks" value={summary.clicks.current} delta={summary.clicks.deltaPct} />
        <MetricCard label="Revenue" value={summary.revenue.current} delta={summary.revenue.deltaPct} currency />
      </div>

      <PerformanceTrendChart data={trend} />
      <CampaignTable rows={campaigns} />
      <ProductTable rows={products} />
      <SearchTermTable rows={searchTerms} />
    </div>
  );
}
