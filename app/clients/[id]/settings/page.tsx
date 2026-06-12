import { PlugZap, RefreshCw, ShieldCheck } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getDashboardData } from "@/lib/analytics/dashboard";

export default async function ClientSettingsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const data = await getDashboardData(id);

  return (
    <AppShell clients={data.clients} activeClientId={data.client.id}>
      <div className="grid gap-6">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-blue-600">Client settings</p>
          <h1 className="mt-2 text-3xl font-bold text-slate-950">{data.client.brandName}</h1>
          <p className="mt-2 text-slate-600">Connection status, sync controls, and permissions for this brand.</p>
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PlugZap className="h-5 w-5 text-blue-600" /> Amazon Ads
              </CardTitle>
              <CardDescription>OAuth connection and Ads API data sync.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Badge variant="success">Connected</Badge>
              <Button variant="outline">Reconnect Ads</Button>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-emerald-600" /> SP-API
              </CardTitle>
              <CardDescription>Sales and catalog data connection.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Badge variant="success">Connected</Badge>
              <Button variant="outline">Reconnect SP-API</Button>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <RefreshCw className="h-5 w-5 text-amber-600" /> Sync status
              </CardTitle>
              <CardDescription>Manual syncs, daily cron, and failed-job retry.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Badge variant="success">{data.client.syncStatus}</Badge>
              <form action="/api/sync" method="post">
                <input type="hidden" name="clientId" value={data.client.id} />
                <Button type="submit">Run manual sync</Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
