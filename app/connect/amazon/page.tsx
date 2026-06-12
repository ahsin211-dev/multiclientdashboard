import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getWorkspaceClients } from "@/lib/data/workspace";
import { Link2, ArrowRight } from "lucide-react";

export default async function ConnectAmazonPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const clients = await getWorkspaceClients();
  const { error } = await searchParams;

  const errorMessages: Record<string, string> = {
    missing_params: "OAuth callback missing required parameters.",
    token_exchange: "Failed to exchange authorization code for tokens.",
    callback_failed: "OAuth callback processing failed.",
  };

  return (
    <AppShell title="Connect Amazon">
      {error && (
        <div className="mb-6 rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
          {errorMessages[error] ?? "An error occurred during connection."}
        </div>
      )}

      <div className="max-w-2xl space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Link2 className="h-5 w-5" />
              Amazon Account Connection
            </CardTitle>
            <CardDescription>
              Connect Amazon Advertising API and Selling Partner API to sync campaigns, sales, and SQP data.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg bg-muted p-4 text-sm">
              <p className="font-medium">Required environment variables:</p>
              <ul className="mt-2 list-inside list-disc space-y-1 text-muted-foreground">
                <li>AMAZON_ADS_CLIENT_ID</li>
                <li>AMAZON_ADS_CLIENT_SECRET</li>
                <li>AMAZON_ADS_REDIRECT_URI</li>
                <li>AMAZON_SP_API_CLIENT_ID</li>
                <li>AMAZON_SP_API_CLIENT_SECRET</li>
                <li>AMAZON_SP_API_REFRESH_TOKEN</li>
              </ul>
            </div>

            <div className="space-y-3">
              <p className="text-sm font-medium">Select a client to connect:</p>
              {clients.map((client) => (
                <div key={client.id} className="flex items-center justify-between rounded-lg border p-4">
                  <div>
                    <p className="font-medium">{client.brandName}</p>
                    <p className="text-sm text-muted-foreground">{client.marketplace}</p>
                  </div>
                  <Button asChild variant="outline" size="sm">
                    <Link href={`/clients/${client.id}/settings`}>
                      Connect
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
