import { randomUUID } from "node:crypto";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getAmazonAdsAuthUrl } from "@/lib/amazon/ads";

export default function ConnectAmazonPage() {
  const authUrl = getAmazonAdsAuthUrl(randomUUID());

  return (
    <div className="space-y-8">
      <section>
        <p className="text-sm font-medium uppercase tracking-[0.24em] text-slate-400">Connect Amazon</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">
          OAuth-ready account connection workflow
        </h1>
        <p className="mt-2 max-w-3xl text-slate-600">
          Connect Amazon Ads first, then trigger the initial sync, audit, and marketing plan workflow.
        </p>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Step 1 · Connect Amazon Ads</CardTitle>
            <CardDescription>
              Uses environment-based OAuth credentials and stores encrypted tokens after callback exchange.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <ul className="space-y-2 text-sm text-slate-700">
              <li>• Do not hardcode credentials.</li>
              <li>• Store encrypted access and refresh tokens.</li>
              <li>• Trigger first sync after successful connection.</li>
            </ul>
            {authUrl ? (
              <Button asChild>
                <a href={authUrl}>Connect Amazon Ads</a>
              </Button>
            ) : (
              <Button disabled>Set Amazon env vars to enable OAuth</Button>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Step 2 · Post-connection workflow</CardTitle>
            <CardDescription>
              The MVP is already structured to proceed into sync, audit, marketing plan, and client report generation.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-slate-700">
            <p>1. Connect Amazon account</p>
            <p>2. Queue first sync</p>
            <p>3. Normalize campaigns, ad groups, keywords, search terms, products, and SQP metrics</p>
            <p>4. Generate audit findings and 30-day plan</p>
            <p>5. Produce stakeholder-ready weekly report</p>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
