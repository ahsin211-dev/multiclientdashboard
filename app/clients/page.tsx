import { redirect } from "next/navigation";
import Link from "next/link";
import { getSession } from "@/lib/auth/session";
import { getWorkspaceClients } from "@/lib/clients";
import { AppShell } from "@/components/layout/app-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plus, ExternalLink } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { getMetricsWithComparison } from "@/lib/analytics/metrics";
import { getPresetDateRange } from "@/lib/analytics/date-ranges";

export default async function ClientsPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const clients = await getWorkspaceClients();
  const range = getPresetDateRange("30d").current;

  const clientsWithMetrics = await Promise.all(
    clients.map(async (client) => {
      const metrics = await getMetricsWithComparison(client.id, range);
      return { ...client, metrics };
    })
  );

  return (
    <AppShell title="Clients">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <p className="text-muted-foreground">
            Manage your brand accounts and Amazon connections
          </p>
          <Button asChild>
            <Link href="/connect/amazon">
              <Plus className="h-4 w-4 mr-2" />
              Add Client
            </Link>
          </Button>
        </div>

        {clientsWithMetrics.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16">
              <p className="text-muted-foreground mb-4">No clients configured yet</p>
              <Button asChild>
                <Link href="/connect/amazon">Connect Amazon Account</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {clientsWithMetrics.map((client) => (
              <Card key={client.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{client.brandName}</CardTitle>
                      <p className="text-sm text-muted-foreground">{client.marketplace}</p>
                    </div>
                    <Badge
                      variant={
                        client.syncStatus === "SUCCESS" ? "success" : "secondary"
                      }
                    >
                      {client.syncStatus}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <div className="text-muted-foreground">Spend</div>
                      <div className="font-medium">
                        {formatCurrency(client.metrics.spend)}
                      </div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">ACOS</div>
                      <div className="font-medium">
                        {client.metrics.acos.toFixed(1)}%
                      </div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">ROAS</div>
                      <div className="font-medium">
                        {client.metrics.roas.toFixed(1)}x
                      </div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Revenue</div>
                      <div className="font-medium">
                        {formatCurrency(client.metrics.revenue)}
                      </div>
                    </div>
                  </div>
                  <Button asChild variant="outline" className="w-full">
                    <Link href={`/clients/${client.id}/dashboard`}>
                      View Dashboard
                      <ExternalLink className="h-4 w-4 ml-2" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
