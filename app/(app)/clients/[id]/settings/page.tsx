import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge, type BadgeProps } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { SyncButton } from "@/components/sync/sync-button";
import { EmptyState } from "@/components/states/states";
import { prisma } from "@/lib/db/prisma";
import { format } from "date-fns";
import { PlugZap, CheckCircle2 } from "lucide-react";

export const dynamic = "force-dynamic";

const jobBadge: Record<string, BadgeProps["variant"]> = {
  COMPLETED: "success",
  RUNNING: "warning",
  PENDING: "warning",
  FAILED: "destructive",
};

export default async function SettingsPage({ params }: { params: { id: string } }) {
  const client = await prisma.client.findUnique({
    where: { id: params.id },
    include: {
      connections: true,
      syncJobs: { orderBy: { createdAt: "desc" }, take: 10 },
      _count: { select: { campaigns: true, products: true, sqpMetrics: true } },
    },
  });
  if (!client) notFound();

  const ads = client.connections.find((c) => c.type === "ADS");
  const sp = client.connections.find((c) => c.type === "SP_API");

  return (
    <>
      <PageHeader
        title="Settings"
        description={`Manage ${client.brandName} connections and data syncs.`}
        actions={<SyncButton clientId={client.id} />}
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Brand</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <Row label="Brand name" value={client.brandName} />
            <Row label="Marketplace" value={client.marketplace} />
            <Row label="Currency" value={client.currency} />
            <Row label="Campaigns" value={String(client._count.campaigns)} />
            <Row label="Products" value={String(client._count.products)} />
            <Row label="SQP rows" value={String(client._count.sqpMetrics)} />
            <Row
              label="Last sync"
              value={client.lastSyncedAt ? format(client.lastSyncedAt, "MMM d, yyyy h:mm a") : "Never"}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Amazon connections</CardTitle>
            <CardDescription>OAuth tokens are encrypted at rest.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <ConnectionRow
              title="Amazon Advertising API"
              status={ads?.status}
              clientId={client.id}
              profileId={ads?.profileId}
            />
            <Separator />
            <ConnectionRow
              title="Selling Partner API (SP-API)"
              status={sp?.status}
              clientId={client.id}
              profileId={sp?.profileId}
            />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Sync history</CardTitle>
          <CardDescription>Background data sync jobs and their status.</CardDescription>
        </CardHeader>
        <CardContent>
          {client.syncJobs.length === 0 ? (
            <EmptyState title="No syncs yet" description="Run a sync to populate analytics." />
          ) : (
            <div className="space-y-3">
              {client.syncJobs.map((job) => {
                const logs = (job.logs as { ts: string; msg: string }[] | null) ?? [];
                return (
                  <div key={job.id} className="rounded-lg border p-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge variant={jobBadge[job.status] ?? "secondary"}>{job.status}</Badge>
                        <span className="text-sm font-medium">{job.type}</span>
                        <span className="text-xs text-muted-foreground">
                          {format(job.createdAt, "MMM d, h:mm:ss a")}
                          {job.attempts > 1 ? ` · attempt ${job.attempts}` : ""}
                        </span>
                      </div>
                    </div>
                    {job.error && <p className="mt-2 text-xs text-destructive">{job.error}</p>}
                    {logs.length > 0 && (
                      <details className="mt-2">
                        <summary className="cursor-pointer text-xs text-muted-foreground">
                          {logs.length} log lines
                        </summary>
                        <ul className="mt-1 space-y-0.5 font-mono text-[11px] text-muted-foreground">
                          {logs.map((l, i) => (
                            <li key={i}>{l.msg}</li>
                          ))}
                        </ul>
                      </details>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}

function ConnectionRow({
  title,
  status,
  clientId,
  profileId,
}: {
  title: string;
  status?: string;
  clientId: string;
  profileId?: string | null;
}) {
  const connected = status === "CONNECTED";
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className={`rounded-lg p-2 ${connected ? "bg-success/10 text-success" : "bg-muted text-muted-foreground"}`}>
          {connected ? <CheckCircle2 className="h-5 w-5" /> : <PlugZap className="h-5 w-5" />}
        </div>
        <div>
          <p className="text-sm font-medium">{title}</p>
          <p className="text-xs text-muted-foreground">
            {connected ? `Connected${profileId ? ` · ${profileId}` : ""}` : "Not connected"}
          </p>
        </div>
      </div>
      <Button asChild variant={connected ? "outline" : "default"} size="sm">
        <Link href={`/connect/amazon?clientId=${clientId}`}>
          {connected ? "Reconnect" : "Connect"}
        </Link>
      </Button>
    </div>
  );
}
