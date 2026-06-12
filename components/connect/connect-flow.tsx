"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { PlugZap, ShoppingCart, BarChart3, Loader2, CheckCircle2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ClientOption {
  id: string;
  brandName: string;
  marketplace: string;
  adsConnected: boolean;
  spConnected: boolean;
}

export function ConnectFlow({
  clients,
  initialClientId,
}: {
  clients: ClientOption[];
  initialClientId?: string;
}) {
  const router = useRouter();
  const [clientId, setClientId] = React.useState(initialClientId ?? clients[0]?.id ?? "");
  const [loading, setLoading] = React.useState<string | null>(null);

  const client = clients.find((c) => c.id === clientId);

  async function connect(type: "ADS" | "SP_API") {
    if (!clientId) return;
    setLoading(type);
    try {
      // Placeholder OAuth: in production this redirects to Amazon's consent
      // screen, then back to /api/amazon/callback. Here we simulate completion.
      await fetch("/api/amazon/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientId, type }),
      });
      router.refresh();
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="space-y-4 p-6">
          <div>
            <p className="text-sm font-medium">Select a client</p>
            <p className="text-xs text-muted-foreground">Choose which brand to connect.</p>
          </div>
          <Select value={clientId} onValueChange={setClientId}>
            <SelectTrigger className="max-w-sm">
              <SelectValue placeholder="Select a client" />
            </SelectTrigger>
            <SelectContent>
              {clients.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.brandName} · {c.marketplace}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <ConnectCard
          icon={BarChart3}
          title="Amazon Advertising API"
          description="Campaigns, ad groups, keywords, search terms and ad metrics."
          connected={client?.adsConnected ?? false}
          loading={loading === "ADS"}
          onConnect={() => connect("ADS")}
        />
        <ConnectCard
          icon={ShoppingCart}
          title="Selling Partner API"
          description="Sales, traffic, catalog and Brand Analytics / SQP data."
          connected={client?.spConnected ?? false}
          loading={loading === "SP_API"}
          onConnect={() => connect("SP_API")}
        />
      </div>

      {client?.adsConnected && (
        <Card>
          <CardContent className="flex items-center justify-between p-6">
            <div>
              <p className="font-medium">Connection complete</p>
              <p className="text-sm text-muted-foreground">
                Initial sync runs automatically. Continue to the dashboard.
              </p>
            </div>
            <Button onClick={() => router.push(`/clients/${clientId}/dashboard`)}>
              Go to dashboard <ArrowRight className="h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function ConnectCard({
  icon: Icon,
  title,
  description,
  connected,
  loading,
  onConnect,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  connected: boolean;
  loading: boolean;
  onConnect: () => void;
}) {
  return (
    <Card>
      <CardContent className="space-y-4 p-6">
        <div className="flex items-center gap-3">
          <div className={`rounded-lg p-2 ${connected ? "bg-success/10 text-success" : "bg-primary/10 text-primary"}`}>
            {connected ? <CheckCircle2 className="h-6 w-6" /> : <Icon className="h-6 w-6" />}
          </div>
          <div>
            <p className="font-semibold">{title}</p>
            <p className="text-xs text-muted-foreground">{description}</p>
          </div>
        </div>
        <Button onClick={onConnect} disabled={loading} variant={connected ? "outline" : "default"} className="w-full">
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" /> Connecting…
            </>
          ) : connected ? (
            "Reconnect"
          ) : (
            <>
              <PlugZap className="h-4 w-4" /> Connect
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
