import Link from "next/link";
import { ArrowRight, Cable, ChartSpline, MessagesSquare } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getClients } from "@/lib/db/repository";

export default async function ClientsPage() {
  const clients = await getClients();

  return (
    <div className="space-y-8">
      <section>
        <p className="text-sm font-medium uppercase tracking-[0.24em] text-slate-400">Clients</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">
          Manage every brand in one workspace
        </h1>
        <p className="mt-2 max-w-3xl text-slate-600">
          Each client has its own Amazon connections, dashboards, audit trail, and AI strategy workspace.
        </p>
      </section>

      <section className="grid gap-5 xl:grid-cols-2">
        {clients.map((client) => (
          <Card key={client.id}>
            <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
              <div>
                <CardTitle>{client.brandName}</CardTitle>
                <CardDescription>
                  {client.marketplace} marketplace · {client.campaigns.length} campaigns · {client.products.length} products
                </CardDescription>
              </div>
              <Badge variant="success">{client.syncStatus}</Badge>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-lg border border-slate-100 p-4">
                  <div className="flex items-center gap-2 text-slate-500">
                    <ChartSpline className="h-4 w-4" />
                    Performance
                  </div>
                  <p className="mt-2 text-sm text-slate-600">Portfolio-ready dashboards and SQP analytics.</p>
                </div>
                <div className="rounded-lg border border-slate-100 p-4">
                  <div className="flex items-center gap-2 text-slate-500">
                    <MessagesSquare className="h-4 w-4" />
                    AI strategist
                  </div>
                  <p className="mt-2 text-sm text-slate-600">Claude-ready co-pilot scoped to this client.</p>
                </div>
                <div className="rounded-lg border border-slate-100 p-4">
                  <div className="flex items-center gap-2 text-slate-500">
                    <Cable className="h-4 w-4" />
                    Connections
                  </div>
                  <p className="mt-2 text-sm text-slate-600">
                    {client.connections.map((connection) => connection.type).join(" + ")}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-3">
                <Link
                  href={`/clients/${client.id}/dashboard`}
                  className="inline-flex items-center gap-2 rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white"
                >
                  Open dashboard
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href={`/clients/${client.id}/chat`}
                  className="inline-flex items-center gap-2 rounded-md border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700"
                >
                  Open co-pilot
                </Link>
              </div>
            </CardContent>
          </Card>
        ))}
      </section>
    </div>
  );
}
