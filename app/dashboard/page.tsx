import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { getWorkspaceClients, parseDateRange } from "@/lib/clients";
import { getMetricsWithComparison } from "@/lib/analytics/metrics";
import { AppShell } from "@/components/layout/app-shell";
import { MetricCard } from "@/components/dashboard/metric-card";
import { DateRangePicker } from "@/components/dashboard/date-range-picker";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { formatCurrency } from "@/lib/utils";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string }>;
}) {
  const session = await getSession();
  if (!session) redirect("/login");

  const params = await searchParams;
  const range = parseDateRange(params.range);
  const clients = await getWorkspaceClients();

  const clientMetrics = await Promise.all(
    clients.map(async (client) => {
      const metrics = await getMetricsWithComparison(client.id, range);
      return { client, metrics };
    })
  );

  const totals = clientMetrics.reduce(
    (acc, { metrics }) => ({
      spend: acc.spend + metrics.spend,
      sales: acc.sales + metrics.sales,
      revenue: acc.revenue + metrics.revenue,
      orders: acc.orders + metrics.orders,
    }),
    { spend: 0, sales: 0, revenue: 0, orders: 0 }
  );

  const avgAcos = totals.sales > 0 ? (totals.spend / totals.sales) * 100 : 0;
  const avgRoas = totals.spend > 0 ? totals.sales / totals.spend : 0;
  const avgTacos = totals.revenue > 0 ? (totals.spend / totals.revenue) * 100 : 0;

  return (
    <AppShell
      title="Workspace Dashboard"
      clients={clients}
      actions={<DateRangePicker />}
    >
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <MetricCard title="Total Ad Spend" value={totals.spend} format="currency" />
          <MetricCard title="Attributed Sales" value={totals.sales} format="currency" />
          <MetricCard title="Total Revenue" value={totals.revenue} format="currency" />
          <MetricCard title="Orders" value={totals.orders} format="number" />
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <MetricCard title="ACOS" value={avgAcos} format="percent" invertChange />
          <MetricCard title="TACOS" value={avgTacos} format="percent" invertChange />
          <MetricCard title="ROAS" value={avgRoas} format="ratio" />
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Clients Overview</CardTitle>
          </CardHeader>
          <CardContent>
            {clients.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>No clients yet.</p>
                <Link href="/clients" className="text-primary hover:underline">
                  Add your first client
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {clientMetrics.map(({ client, metrics }) => (
                  <Link
                    key={client.id}
                    href={`/clients/${client.id}/dashboard`}
                    className="flex items-center justify-between rounded-lg border p-4 hover:bg-accent/50 transition-colors"
                  >
                    <div>
                      <div className="font-medium">{client.brandName}</div>
                      <div className="text-sm text-muted-foreground">
                        {client.marketplace} · {formatCurrency(metrics.spend)} spend
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right text-sm">
                        <div>{metrics.acos.toFixed(1)}% ACOS</div>
                        <div className="text-muted-foreground">
                          {metrics.roas.toFixed(1)}x ROAS
                        </div>
                      </div>
                      <Badge
                        variant={
                          client.syncStatus === "SUCCESS"
                            ? "success"
                            : client.syncStatus === "FAILED"
                              ? "destructive"
                              : "secondary"
                        }
                      >
                        {client.syncStatus}
                      </Badge>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
