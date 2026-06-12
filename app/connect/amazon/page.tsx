import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { getWorkspaceClients } from "@/lib/clients";
import { AppShell } from "@/components/layout/app-shell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { isAmazonAdsConfigured, isSpApiConfigured } from "@/lib/amazon/config";
import Link from "next/link";

export default async function ConnectAmazonPage({
  searchParams,
}: {
  searchParams: Promise<{ clientId?: string }>;
}) {
  const session = await getSession();
  if (!session) redirect("/login");

  const params = await searchParams;
  const clients = await getWorkspaceClients();
  const adsConfigured = isAmazonAdsConfigured();
  const spConfigured = isSpApiConfigured();

  return (
    <AppShell title="Connect Amazon">
      <div className="max-w-2xl space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Amazon Advertising API</CardTitle>
            <CardDescription>
              Connect your Amazon Ads account to sync campaigns, keywords, and
              performance metrics.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Configuration:</span>
              <Badge variant={adsConfigured ? "success" : "warning"}>
                {adsConfigured ? "Ready" : "Env vars needed"}
              </Badge>
            </div>
            {!adsConfigured && (
              <p className="text-sm text-muted-foreground">
                Set AMAZON_ADS_CLIENT_ID, AMAZON_ADS_CLIENT_SECRET, and
                AMAZON_ADS_REDIRECT_URI in your environment.
              </p>
            )}
            {clients.length > 0 ? (
              <div className="space-y-2">
                {clients.map((client) => (
                  <div
                    key={client.id}
                    className="flex items-center justify-between rounded-lg border p-3"
                  >
                    <span className="font-medium">{client.brandName}</span>
                    <Button asChild size="sm" disabled={!adsConfigured}>
                      <Link
                        href={`/api/amazon/ads/connect?clientId=${client.id}`}
                      >
                        Connect Ads
                      </Link>
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Create a client first to connect Amazon accounts.
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Amazon SP-API</CardTitle>
            <CardDescription>
              Connect Selling Partner API for sales data, inventory, and Brand
              Analytics / Search Query Performance.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Configuration:</span>
              <Badge variant={spConfigured ? "success" : "warning"}>
                {spConfigured ? "Ready" : "Env vars needed"}
              </Badge>
            </div>
            {clients.length > 0 && (
              <div className="space-y-2">
                {clients.map((client) => (
                  <div
                    key={client.id}
                    className="flex items-center justify-between rounded-lg border p-3"
                  >
                    <span className="font-medium">{client.brandName}</span>
                    <Button asChild size="sm" variant="outline" disabled={!spConfigured}>
                      <Link
                        href={`/api/amazon/sp/connect?clientId=${client.id}`}
                      >
                        Connect SP-API
                      </Link>
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {params.clientId && (
          <Card>
            <CardHeader>
              <CardTitle>OAuth Callback</CardTitle>
              <CardDescription>
                After Amazon redirects back, tokens are encrypted and stored. A
                first sync is triggered automatically.
              </CardDescription>
            </CardHeader>
          </Card>
        )}
      </div>
    </AppShell>
  );
}
