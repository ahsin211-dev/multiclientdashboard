import Link from "next/link";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/states/states";
import { NewClientDialog } from "@/components/clients/new-client-dialog";
import { getActiveWorkspace } from "@/lib/workspace";
import { prisma } from "@/lib/db/prisma";
import { getMetricSummary } from "@/lib/analytics/service";
import { presetRange } from "@/lib/analytics/date-ranges";
import { formatCurrency, formatPercent } from "@/lib/utils";
import { ArrowRight } from "lucide-react";

export const dynamic = "force-dynamic";

const syncBadge: Record<string, { label: string; variant: "success" | "warning" | "secondary" | "destructive" }> = {
  COMPLETED: { label: "Synced", variant: "success" },
  RUNNING: { label: "Syncing", variant: "warning" },
  PENDING: { label: "Pending", variant: "warning" },
  FAILED: { label: "Failed", variant: "destructive" },
  NEVER_SYNCED: { label: "Never synced", variant: "secondary" },
};

export default async function ClientsPage() {
  const ws = await getActiveWorkspace();
  const range = presetRange("30d");

  const clients = ws
    ? await prisma.client.findMany({
        where: { workspaceId: ws.id },
        orderBy: { brandName: "asc" },
        include: { connections: true, _count: { select: { campaigns: true, products: true } } },
      })
    : [];

  const withMetrics = await Promise.all(
    clients.map(async (c) => ({ client: c, metrics: await getMetricSummary(c.id, range) }))
  );

  return (
    <>
      <PageHeader
        title="Clients"
        description="Manage brands, connections and sync status."
        actions={<NewClientDialog />}
      />

      {clients.length === 0 ? (
        <EmptyState title="No clients yet" description="Create your first client to get started." action={<NewClientDialog />} />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {withMetrics.map(({ client, metrics }) => {
            const b = syncBadge[client.syncStatus] ?? syncBadge.NEVER_SYNCED;
            const ads = client.connections.find((x) => x.type === "ADS");
            const sp = client.connections.find((x) => x.type === "SP_API");
            return (
              <Link key={client.id} href={`/clients/${client.id}/dashboard`}>
                <Card className="h-full transition-shadow hover:shadow-md">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-sm font-semibold text-primary">
                          {client.brandName.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-semibold">{client.brandName}</p>
                          <p className="text-xs text-muted-foreground">
                            {client.marketplace} · {client.currency}
                          </p>
                        </div>
                      </div>
                      <Badge variant={b.variant}>{b.label}</Badge>
                    </div>

                    <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                      <Stat label="Spend (30d)" value={formatCurrency(metrics.spend, client.currency)} />
                      <Stat label="Sales (30d)" value={formatCurrency(metrics.sales, client.currency)} />
                      <Stat label="ACOS" value={metrics.acos > 0 ? formatPercent(metrics.acos) : "—"} />
                    </div>

                    <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
                      <div className="flex gap-2">
                        <Badge variant={ads?.status === "CONNECTED" ? "success" : "secondary"}>
                          Ads {ads?.status === "CONNECTED" ? "✓" : "—"}
                        </Badge>
                        <Badge variant={sp?.status === "CONNECTED" ? "success" : "secondary"}>
                          SP-API {sp?.status === "CONNECTED" ? "✓" : "—"}
                        </Badge>
                      </div>
                      <span className="inline-flex items-center gap-1 font-medium text-primary">
                        Open <ArrowRight className="h-3 w-3" />
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-muted/50 p-2">
      <p className="text-sm font-semibold tabular-nums">{value}</p>
      <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</p>
    </div>
  );
}
