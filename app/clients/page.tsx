import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/dashboard/empty-state";
import { getWorkspaceClients } from "@/lib/data/workspace";
import { formatCurrency } from "@/lib/utils";
import { getDashboardMetrics } from "@/lib/analytics/metrics";
import { getPeriodRange } from "@/lib/analytics/date-ranges";
import { Plus, ArrowRight } from "lucide-react";

export default async function ClientsPage() {
  const clients = await getWorkspaceClients();
  const { current, previous } = getPeriodRange("30d");

  const clientsWithMetrics = await Promise.all(
    clients.map(async (client) => {
      const metrics = await getDashboardMetrics(client.id, current, previous);
      return { ...client, metrics };
    })
  );

  return (
    <AppShell
      title="Clients"
      actions={
        <Button asChild>
          <Link href="/clients/new">
            <Plus className="h-4 w-4" />
            Add Client
          </Link>
        </Button>
      }
    >
      {clients.length === 0 ? (
        <EmptyState
          title="No clients yet"
          description="Create your first client account to start tracking Amazon Ads and sales data."
          actionLabel="Add Client"
          actionHref="/clients/new"
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {clientsWithMetrics.map((client) => (
            <Card key={client.id} className="transition-shadow hover:shadow-md">
              <CardHeader className="flex flex-row items-start justify-between">
                <div>
                  <CardTitle className="text-lg">{client.brandName}</CardTitle>
                  <p className="text-sm text-muted-foreground">{client.marketplace}</p>
                </div>
                <Badge variant={client.syncStatus === "COMPLETED" ? "success" : "secondary"}>
                  {client.syncStatus.replace("_", " ")}
                </Badge>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Ad Spend (30d)</p>
                    <p className="font-semibold">{formatCurrency(client.metrics.adSpend.value)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">ACOS</p>
                    <p className="font-semibold">{client.metrics.acos.value.toFixed(1)}%</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">ROAS</p>
                    <p className="font-semibold">{client.metrics.roas.value.toFixed(2)}x</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Last Sync</p>
                    <p className="font-semibold">
                      {client.lastSyncAt
                        ? new Date(client.lastSyncAt).toLocaleDateString()
                        : "Never"}
                    </p>
                  </div>
                </div>
                <Button asChild variant="outline" className="mt-4 w-full">
                  <Link href={`/clients/${client.id}/dashboard`}>
                    View Dashboard
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </AppShell>
  );
}
