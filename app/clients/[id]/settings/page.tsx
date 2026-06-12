import { notFound } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { prisma } from "@/lib/db/prisma";

export default async function ClientSettingsPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const client = await prisma.client.findUnique({
    where: { id },
    include: {
      amazonConnections: true,
      dataSyncJobs: {
        orderBy: { createdAt: "desc" },
        take: 15
      }
    }
  });
  if (!client) notFound();

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>{client.brandName} · Settings</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs text-slate-500">Brand Name</label>
            <Input value={client.brandName} readOnly />
          </div>
          <div>
            <label className="mb-1 block text-xs text-slate-500">Marketplace</label>
            <Input value={client.marketplace} readOnly />
          </div>
          <div>
            <label className="mb-1 block text-xs text-slate-500">Sync Status</label>
            <Input value={client.syncStatus} readOnly />
          </div>
          <div>
            <label className="mb-1 block text-xs text-slate-500">Last Sync</label>
            <Input value={client.lastSyncDate?.toLocaleString() ?? "Never"} readOnly />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Amazon Connections</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {client.amazonConnections.length === 0 ? (
            <p className="text-sm text-slate-600">No connections configured.</p>
          ) : (
            client.amazonConnections.map((connection) => (
              <div
                key={connection.id}
                className="flex flex-col gap-1 rounded-md border border-slate-200 p-3 text-sm md:flex-row md:items-center md:justify-between"
              >
                <div>
                  <div className="font-medium">{connection.connectionType}</div>
                  <div className="text-xs text-slate-500">
                    Token expiry: {connection.tokenExpiresAt?.toLocaleString() ?? "Unknown"}
                  </div>
                </div>
                <Badge variant="success">Connected</Badge>
              </div>
            ))
          )}
          <Button asChild variant="outline" size="sm">
            <a href="/connect/amazon">Reconnect Amazon</a>
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Sync Logs</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          {client.dataSyncJobs.map((job) => (
            <div key={job.id} className="rounded-md border border-slate-200 p-3">
              <div className="font-medium text-slate-900">
                {job.jobType} · {job.status}
              </div>
              <div className="text-xs text-slate-500">
                Queued: {job.queuedAt.toLocaleString()} · Retries: {job.retryCount}
              </div>
              {job.logs ? (
                <pre className="mt-2 overflow-auto rounded bg-slate-900 p-2 text-xs text-slate-100">
                  {JSON.stringify(job.logs, null, 2)}
                </pre>
              ) : null}
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
