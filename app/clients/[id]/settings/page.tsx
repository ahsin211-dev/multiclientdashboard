import { redirect, notFound } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { getClientById, getWorkspaceClients } from "@/lib/clients";
import { AppShell } from "@/components/layout/app-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { prisma } from "@/lib/db/prisma";
import Link from "next/link";

export default async function ClientSettingsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getSession();
  if (!session) redirect("/login");

  const { id } = await params;
  const client = await getClientById(id);
  if (!client) notFound();

  const clients = await getWorkspaceClients();

  const syncJobs = await prisma.dataSyncJob.findMany({
    where: { clientId: id },
    orderBy: { createdAt: "desc" },
    take: 10,
  });

  const statusVariant: Record<string, "success" | "destructive" | "secondary" | "warning"> = {
    COMPLETED: "success",
    FAILED: "destructive",
    RUNNING: "warning",
    PENDING: "secondary",
  };

  return (
    <AppShell title={`${client.brandName} — Settings`} clientId={id} clients={clients}>
      <div className="space-y-6 max-w-3xl">
        <Card>
          <CardHeader>
            <CardTitle>Client Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <div className="text-sm text-muted-foreground">Brand Name</div>
                <div className="font-medium">{client.brandName}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Marketplace</div>
                <div className="font-medium">{client.marketplace}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Sync Status</div>
                <Badge variant={client.syncStatus === "SUCCESS" ? "success" : "secondary"}>
                  {client.syncStatus}
                </Badge>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Last Sync</div>
                <div className="font-medium">
                  {client.lastSyncAt
                    ? client.lastSyncAt.toLocaleString()
                    : "Never"}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Amazon Connections</CardTitle>
              <Button asChild size="sm" variant="outline">
                <Link href={`/connect/amazon?clientId=${id}`}>Manage Connections</Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {client.connections.length === 0 ? (
              <p className="text-muted-foreground">No Amazon accounts connected.</p>
            ) : (
              <div className="space-y-3">
                {client.connections.map((conn) => (
                  <div
                    key={conn.id}
                    className="flex items-center justify-between rounded-lg border p-3"
                  >
                    <div>
                      <div className="font-medium">{conn.type.replace("_", " ")}</div>
                      <div className="text-sm text-muted-foreground">
                        Profile: {conn.profileId ?? conn.sellerId ?? "—"}
                      </div>
                    </div>
                    <Badge
                      variant={
                        conn.status === "CONNECTED" ? "success" : "secondary"
                      }
                    >
                      {conn.status}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Sync History</CardTitle>
          </CardHeader>
          <CardContent>
            {syncJobs.length === 0 ? (
              <p className="text-muted-foreground">No sync jobs yet.</p>
            ) : (
              <div className="space-y-2">
                {syncJobs.map((job) => (
                  <div
                    key={job.id}
                    className="flex items-center justify-between rounded-lg border p-3 text-sm"
                  >
                    <div>
                      <div className="font-medium">{job.type}</div>
                      <div className="text-muted-foreground">
                        {job.createdAt.toLocaleString()}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={statusVariant[job.status] ?? "secondary"}>
                        {job.status}
                      </Badge>
                      {job.status === "FAILED" && (
                        <form action="/api/sync/retry" method="POST">
                          <input type="hidden" name="jobId" value={job.id} />
                          <Button type="submit" size="sm" variant="outline">
                            Retry
                          </Button>
                        </form>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
