import Link from "next/link";
import { ArrowRight, Plus } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getClients } from "@/lib/analytics/dashboard";

export default async function ClientsPage() {
  const clients = await getClients();

  return (
    <AppShell clients={clients} activeClientId={clients[0]?.id}>
      <div className="grid gap-6">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-blue-600">Client accounts</p>
            <h1 className="mt-2 text-3xl font-bold text-slate-950">Clients</h1>
            <p className="mt-2 text-slate-600">Manage brands, marketplaces, Amazon connections, sync status, and workspace access.</p>
          </div>
          <Button>
            <Plus className="h-4 w-4" />
            New client
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {clients.map((client) => (
            <Card key={client.id}>
              <CardHeader>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <CardTitle>{client.brandName}</CardTitle>
                    <CardDescription>{client.marketplace} marketplace</CardDescription>
                  </div>
                  <Badge variant={client.syncStatus === "SYNCED" ? "success" : "warning"}>{client.syncStatus}</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-slate-500">
                  Last sync: {client.lastSyncAt ? new Date(client.lastSyncAt).toLocaleString() : "Never synced"}
                </p>
                <Link
                  href={`/clients/${client.id}/dashboard`}
                  className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-blue-600 hover:text-blue-700"
                >
                  Open client dashboard <ArrowRight className="h-4 w-4" />
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
