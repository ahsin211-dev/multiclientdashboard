import { notFound } from "next/navigation";

import { SyncButton } from "@/components/dashboard/sync-button";
import { ClientNav } from "@/components/layout/client-nav";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getClient } from "@/lib/db/repository";

type ClientSettingsPageProps = {
  params: Promise<{ id: string }>;
};

export default async function ClientSettingsPage({ params }: ClientSettingsPageProps) {
  const { id } = await params;
  const client = await getClient(id);

  if (!client) {
    notFound();
  }

  return (
    <div className="space-y-8">
      <section className="space-y-4">
        <ClientNav clientId={client.id} current="settings" />
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.24em] text-slate-400">Client settings</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">
              Connections and sync control for {client.brandName}
            </h1>
            <p className="mt-2 max-w-3xl text-slate-600">
              Manage OAuth connections, monitor sync health, and trigger data refreshes on demand.
            </p>
          </div>
          <SyncButton clientId={client.id} />
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        {client.connections.map((connection) => (
          <Card key={connection.type}>
            <CardHeader>
              <div className="flex items-center justify-between gap-3">
                <CardTitle>{connection.type}</CardTitle>
                <Badge variant="success">{connection.status}</Badge>
              </div>
              <CardDescription>{connection.accountName}</CardDescription>
            </CardHeader>
          </Card>
        ))}
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Sync logs</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {client.syncLogs.map((log) => (
            <div key={log.id} className="rounded-lg border border-slate-100 p-4">
              <div className="flex items-center justify-between gap-3">
                <p className="font-medium text-slate-900">{log.type}</p>
                <Badge variant={log.status === "completed" ? "success" : log.status === "running" ? "warning" : "outline"}>
                  {log.status}
                </Badge>
              </div>
              <p className="mt-2 text-sm text-slate-600">{log.summary}</p>
              <p className="mt-3 text-xs text-slate-400">{new Date(log.createdAt).toLocaleString()}</p>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
