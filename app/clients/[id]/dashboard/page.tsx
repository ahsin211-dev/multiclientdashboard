import Link from "next/link";
import { notFound } from "next/navigation";

import { DateRangePicker } from "@/components/dashboard/date-range-picker";
import { ManualSyncButton } from "@/components/dashboard/manual-sync-button";
import { MetricCard } from "@/components/dashboard/metric-card";
import { PerformanceTrendChart } from "@/components/charts/performance-trend-chart";
import { CampaignTable } from "@/components/tables/campaign-table";
import { ProductTable } from "@/components/tables/product-table";
import { SearchTermTable } from "@/components/tables/search-term-table";
import { SQPTable } from "@/components/tables/sqp-table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getSQPInsights } from "@/lib/analytics/sqp";
import {
  getCampaignPerformance,
  getPerformanceSummary,
  getProductPerformance,
  getSearchTermPerformance,
  getTrendSeries
} from "@/lib/analytics/performance";
import { prisma } from "@/lib/db/prisma";
import type { DateRangePreset } from "@/lib/types";

function syncBadge(status: string) {
  if (status === "CONNECTED") return "success" as const;
  if (status === "SYNCING") return "warning" as const;
  if (status === "FAILED") return "danger" as const;
  return "default" as const;
}

export default async function ClientDashboardPage({
  params,
  searchParams
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { id } = await params;
  const query = await searchParams;

  const client = await prisma.client.findUnique({
    where: { id },
    include: {
      dataSyncJobs: {
        orderBy: { createdAt: "desc" },
        take: 5
      }
    }
  });
  if (!client) notFound();

  const range = (typeof query.range === "string" ? query.range : "last30") as DateRangePreset;
  const from = typeof query.from === "string" ? query.from : undefined;
  const to = typeof query.to === "string" ? query.to : undefined;

  const [summary, trend, campaigns, products, searchTerms, sqpRows] = await Promise.all([
    getPerformanceSummary(id, range, from, to),
    getTrendSeries(id, range, from, to),
    getCampaignPerformance(id, 10),
    getProductPerformance(id, 10),
    getSearchTermPerformance(id, 12),
    getSQPInsights(id, 20)
  ]);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <CardTitle className="text-xl">{client.brandName} Dashboard</CardTitle>
            <p className="text-sm text-slate-600">
              Marketplace: {client.marketplace} · Last sync:{" "}
              {client.lastSyncDate ? client.lastSyncDate.toLocaleString() : "Never"}
            </p>
          </div>
          <div className="flex flex-col items-start gap-2 md:items-end">
            <Badge variant={syncBadge(client.syncStatus)}>{client.syncStatus}</Badge>
            <DateRangePicker />
            <ManualSyncButton clientId={id} />
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex flex-wrap gap-2 text-sm">
            <Link href={`/clients/${id}/chat`} className="text-teal-700 hover:underline">
              AI chat
            </Link>
            <Link href={`/clients/${id}/audit`} className="text-teal-700 hover:underline">
              Audit
            </Link>
            <Link href={`/clients/${id}/reports`} className="text-teal-700 hover:underline">
              Reports
            </Link>
            <Link href={`/clients/${id}/settings`} className="text-teal-700 hover:underline">
              Settings
            </Link>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Ad Spend" value={summary.spend.current} delta={summary.spend.deltaPct} currency />
        <MetricCard label="Sales" value={summary.sales.current} delta={summary.sales.deltaPct} currency />
        <MetricCard label="ACOS" value={summary.acos.current} delta={summary.acos.deltaPct} isPercent />
        <MetricCard label="ROAS" value={summary.roas.current} delta={summary.roas.deltaPct} />
        <MetricCard label="Impressions" value={summary.impressions.current} delta={summary.impressions.deltaPct} />
        <MetricCard label="Clicks" value={summary.clicks.current} delta={summary.clicks.deltaPct} />
        <MetricCard label="CTR" value={summary.ctr.current} delta={summary.ctr.deltaPct} isPercent />
        <MetricCard label="CVR" value={summary.cvr.current} delta={summary.cvr.deltaPct} isPercent />
      </div>

      <PerformanceTrendChart data={trend} />
      <SQPTable rows={sqpRows} />
      <CampaignTable rows={campaigns} />
      <ProductTable rows={products} />
      <SearchTermTable rows={searchTerms} />

      <Card>
        <CardHeader>
          <CardTitle>Recent Sync Jobs</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          {client.dataSyncJobs.length === 0 ? (
            <div className="text-slate-500">No sync jobs yet.</div>
          ) : (
            client.dataSyncJobs.map((job) => (
              <div
                key={job.id}
                className="flex flex-col gap-1 rounded-md border border-slate-200 p-3 md:flex-row md:items-center md:justify-between"
              >
                <div>
                  <div className="font-medium text-slate-900">
                    {job.jobType} · {job.status}
                  </div>
                  <div className="text-xs text-slate-500">
                    Queued: {job.queuedAt.toLocaleString()} · Retries: {job.retryCount}
                  </div>
                </div>
                <div className="text-xs text-slate-500">{job.errorMessage ?? "No errors"}</div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
