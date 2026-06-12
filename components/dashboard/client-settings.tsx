"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link2, RefreshCw } from "lucide-react";

interface Connection {
  id: string;
  type: string;
  status: string;
  profileId: string | null;
  sellerId: string | null;
}

interface SyncJob {
  id: string;
  type: string;
  status: string;
  createdAt: string | Date;
  error: string | null;
}

interface ClientSettingsProps {
  client: {
    id: string;
    brandName: string;
    marketplace: string;
    syncStatus: string;
    lastSyncAt: Date | string | null;
    connections: Connection[];
    syncJobs: SyncJob[];
  };
  connected?: boolean;
}

export function ClientSettings({ client, connected }: ClientSettingsProps) {
  const [connecting, setConnecting] = useState(false);
  const [message, setMessage] = useState<string | null>(
    connected ? "Amazon Ads connected successfully!" : null
  );

  async function connectAmazonAds() {
    setConnecting(true);
    setMessage(null);
    try {
      const res = await fetch("/api/amazon/ads/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientId: client.id }),
      });
      const data = await res.json();
      if (data.authUrl) {
        window.location.href = data.authUrl;
      } else if (data.placeholder) {
        setMessage(data.message);
      } else if (!res.ok) {
        throw new Error(data.error);
      }
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Connection failed");
    } finally {
      setConnecting(false);
    }
  }

  async function retryJob(jobId: string) {
    await fetch("/api/sync/retry", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jobId }),
    });
    window.location.reload();
  }

  return (
    <div className="space-y-6 max-w-3xl">
      {message && (
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm text-blue-800">
          {message}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Client Details</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div>
            <p className="text-sm text-muted-foreground">Brand Name</p>
            <p className="font-medium">{client.brandName}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Marketplace</p>
            <p className="font-medium">{client.marketplace}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Sync Status</p>
            <Badge variant={client.syncStatus === "COMPLETED" ? "success" : "secondary"}>
              {client.syncStatus.replace("_", " ")}
            </Badge>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Last Sync</p>
            <p className="font-medium">
              {client.lastSyncAt
                ? new Date(client.lastSyncAt).toLocaleString()
                : "Never"}
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Amazon Connections</CardTitle>
          <CardDescription>Connect Amazon Advertising and Selling Partner APIs</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {client.connections.map((conn) => (
            <div key={conn.id} className="flex items-center justify-between rounded-lg border p-4">
              <div>
                <p className="font-medium">
                  {conn.type === "AMAZON_ADS" ? "Amazon Advertising" : "Selling Partner API"}
                </p>
                <p className="text-sm text-muted-foreground">
                  {conn.profileId || conn.sellerId || "Not connected"}
                </p>
              </div>
              <Badge variant={conn.status === "CONNECTED" ? "success" : "secondary"}>
                {conn.status}
              </Badge>
            </div>
          ))}
          <Button onClick={connectAmazonAds} disabled={connecting}>
            <Link2 />
            {connecting ? "Connecting..." : "Connect Amazon Ads"}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Sync History</CardTitle>
        </CardHeader>
        <CardContent>
          {client.syncJobs.length === 0 ? (
            <p className="text-sm text-muted-foreground">No sync jobs yet.</p>
          ) : (
            <div className="space-y-2">
              {client.syncJobs.map((job) => (
                <div key={job.id} className="flex items-center justify-between rounded-lg border p-3 text-sm">
                  <div>
                    <p className="font-medium">{job.type}</p>
                    <p className="text-muted-foreground">
                      {new Date(job.createdAt).toLocaleString()}
                    </p>
                    {job.error && <p className="text-destructive">{job.error}</p>}
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={job.status === "COMPLETED" ? "success" : job.status === "FAILED" ? "destructive" : "secondary"}>
                      {job.status}
                    </Badge>
                    {job.status === "FAILED" && (
                      <Button size="sm" variant="outline" onClick={() => retryJob(job.id)}>
                        <RefreshCw className="h-3 w-3" />
                        Retry
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
