import Link from "next/link";
import { PageHeader } from "@/components/layout/page-header";
import { PeriodSelector } from "@/components/dashboard/period-selector";
import { MetricCard } from "@/components/dashboard/metric-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/states/states";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { getActiveWorkspace } from "@/lib/workspace";
import { prisma } from "@/lib/db/prisma";
import { getMetricSummary } from "@/lib/analytics/service";
import { parseRange } from "@/lib/analytics/date-ranges";
import { deriveMetrics, addTotals, emptyTotals } from "@/lib/analytics/metrics";
import { formatCurrency, formatPercent, formatNumber } from "@/lib/utils";
import { ArrowRight, PlugZap } from "lucide-react";

export const dynamic = "force-dynamic";

const syncBadge: Record<string, { label: string; variant: "success" | "warning" | "secondary" | "destructive" }> = {
  COMPLETED: { label: "Synced", variant: "success" },
  RUNNING: { label: "Syncing", variant: "warning" },
  PENDING: { label: "Pending", variant: "warning" },
  FAILED: { label: "Failed", variant: "destructive" },
  NEVER_SYNCED: { label: "Never synced", variant: "secondary" },
};

export default async function OverviewPage({
  searchParams,
}: {
  searchParams: { period?: string; from?: string; to?: string };
}) {
  const ws = await getActiveWorkspace();
  const range = parseRange(
    searchParams.from,
    searchParams.to,
    (searchParams.period as any) ?? "30d"
  );

  const clients = ws
    ? await prisma.client.findMany({
        where: { workspaceId: ws.id },
        orderBy: { brandName: "asc" },
      })
    : [];

  const summaries = await Promise.all(
    clients.map(async (c) => ({
      client: c,
      metrics: await getMetricSummary(c.id, range),
    }))
  );

  const totals = summaries.reduce(
    (acc, s) =>
      addTotals(acc, {
        spend: s.metrics.spend,
        sales: s.metrics.sales,
        revenue: s.metrics.revenue,
        impressions: s.metrics.impressions,
        clicks: s.metrics.clicks,
        orders: s.metrics.orders,
        units: s.metrics.units,
      }),
    emptyTotals()
  );
  const agg = deriveMetrics(totals);

  return (
    <>
      <PageHeader
        title="Portfolio Overview"
        description={`${clients.length} client${clients.length === 1 ? "" : "s"} in ${ws?.name ?? "workspace"}`}
        actions={<PeriodSelector />}
      />

      {clients.length === 0 ? (
        <EmptyState
          title="No clients yet"
          description="Connect an Amazon account to start tracking performance."
          icon={PlugZap}
          action={
            <Button asChild>
              <Link href="/connect/amazon">Connect Amazon</Link>
            </Button>
          }
        />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
            <MetricCard label="Total Spend" value={formatCurrency(agg.spend)} higherIsBetter={false} />
            <MetricCard label="Ad Sales" value={formatCurrency(agg.sales)} />
            <MetricCard label="Revenue" value={formatCurrency(agg.revenue)} />
            <MetricCard label="Blended ACOS" value={formatPercent(agg.acos)} higherIsBetter={false} />
            <MetricCard label="Blended TACOS" value={formatPercent(agg.tacos)} higherIsBetter={false} />
            <MetricCard label="ROAS" value={`${agg.roas.toFixed(2)}x`} />
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Clients</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Brand</TableHead>
                    <TableHead>Marketplace</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Spend</TableHead>
                    <TableHead className="text-right">Sales</TableHead>
                    <TableHead className="text-right">ACOS</TableHead>
                    <TableHead className="text-right">TACOS</TableHead>
                    <TableHead className="text-right">Orders</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {summaries.map(({ client, metrics }) => {
                    const b = syncBadge[client.syncStatus] ?? syncBadge.NEVER_SYNCED;
                    return (
                      <TableRow key={client.id}>
                        <TableCell className="font-medium">{client.brandName}</TableCell>
                        <TableCell>{client.marketplace}</TableCell>
                        <TableCell>
                          <Badge variant={b.variant}>{b.label}</Badge>
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {formatCurrency(metrics.spend, client.currency)}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {formatCurrency(metrics.sales, client.currency)}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {metrics.acos > 0 ? formatPercent(metrics.acos) : "—"}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {metrics.tacos > 0 ? formatPercent(metrics.tacos) : "—"}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {formatNumber(metrics.orders)}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button asChild variant="ghost" size="sm">
                            <Link href={`/clients/${client.id}/dashboard`}>
                              Open <ArrowRight className="h-4 w-4" />
                            </Link>
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </>
      )}
    </>
  );
}
