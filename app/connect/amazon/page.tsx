import { ArrowRight, KeyRound, PlugZap, ShieldCheck } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getClients } from "@/lib/analytics/dashboard";

export default async function ConnectAmazonPage() {
  const clients = await getClients();
  const activeClient = clients[0];

  return (
    <AppShell clients={clients} activeClientId={activeClient?.id}>
      <div className="grid gap-6">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-blue-600">Amazon connection</p>
          <h1 className="mt-2 text-3xl font-bold text-slate-950">Connect Amazon Ads and SP-API</h1>
          <p className="mt-2 text-slate-600">OAuth placeholder flow for secure token storage, refresh, and first sync trigger.</p>
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          {[
            {
              icon: PlugZap,
              title: "Connect Amazon Ads",
              description: "Authorize campaign, keyword, search term, and reporting access.",
            },
            {
              icon: ShieldCheck,
              title: "Connect SP-API",
              description: "Authorize catalog, sales, and marketplace performance reports.",
            },
            {
              icon: KeyRound,
              title: "Encrypt tokens",
              description: "Store access and refresh tokens encrypted at rest and refresh on expiry.",
            },
          ].map((item) => (
            <Card key={item.title}>
              <CardHeader>
                <item.icon className="h-6 w-6 text-blue-600" />
                <CardTitle>{item.title}</CardTitle>
                <CardDescription>{item.description}</CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Start OAuth flow</CardTitle>
            <CardDescription>
              Requires AMAZON_ADS_CLIENT_ID, AMAZON_ADS_CLIENT_SECRET, AMAZON_ADS_REDIRECT_URI, and SP-API credentials.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form action="/api/connect/amazon" method="get">
              <input type="hidden" name="clientId" value={activeClient?.id ?? "peaktrail"} />
              <Button type="submit">
                Connect selected client <ArrowRight className="h-4 w-4" />
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
