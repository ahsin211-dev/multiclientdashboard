import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { prisma } from "@/lib/db/prisma";

function syncBadge(status: string) {
  if (status === "CONNECTED") return "success" as const;
  if (status === "SYNCING") return "warning" as const;
  if (status === "FAILED") return "danger" as const;
  return "default" as const;
}

export default async function ClientsPage() {
  const clients = await prisma.client.findMany({
    orderBy: { brandName: "asc" },
    include: {
      adAccounts: true
    }
  });

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">Client Portfolio</h2>
        <p className="text-sm text-slate-600">
          Manage each client workspace, connection status, and performance hub.
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {clients.map((client) => (
          <Card key={client.id}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>{client.brandName}</span>
                <Badge variant={syncBadge(client.syncStatus)}>{client.syncStatus}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-slate-600">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <div className="text-xs text-slate-500">Marketplace</div>
                  <div>{client.marketplace}</div>
                </div>
                <div>
                  <div className="text-xs text-slate-500">Ad Accounts</div>
                  <div>{client.adAccounts.length}</div>
                </div>
                <div>
                  <div className="text-xs text-slate-500">Last Sync</div>
                  <div>{client.lastSyncDate ? client.lastSyncDate.toLocaleString() : "Never"}</div>
                </div>
                <div>
                  <div className="text-xs text-slate-500">Client ID</div>
                  <div className="truncate">{client.id}</div>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button asChild variant="default" size="sm">
                  <Link href={`/clients/${client.id}/dashboard`}>Dashboard</Link>
                </Button>
                <Button asChild variant="secondary" size="sm">
                  <Link href={`/clients/${client.id}/chat`}>Chat</Link>
                </Button>
                <Button asChild variant="outline" size="sm">
                  <Link href={`/clients/${client.id}/audit`}>Audit</Link>
                </Button>
                <Button asChild variant="outline" size="sm">
                  <Link href={`/clients/${client.id}/reports`}>Reports</Link>
                </Button>
                <Button asChild variant="outline" size="sm">
                  <Link href={`/clients/${client.id}/settings`}>Settings</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
