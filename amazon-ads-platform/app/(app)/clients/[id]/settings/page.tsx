"use client";

import { use } from "react";
import { Header } from "@/components/layout/header";
import { MOCK_CLIENTS } from "@/lib/mock-data";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import {
  Link2,
  RefreshCw,
  Trash2,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
} from "lucide-react";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function ClientSettingsPage({ params }: PageProps) {
  const { id: clientId } = use(params);
  const client = MOCK_CLIENTS.find((c) => c.id === clientId) ?? MOCK_CLIENTS[0];

  const handleSave = () => {
    toast.success("Settings saved");
  };

  const handleConnect = (type: string) => {
    toast.info(`Connecting ${type}...`, { description: "You'll be redirected to Amazon to authorize." });
  };

  return (
    <div className="flex flex-col h-full">
      <Header title="Client Settings" subtitle={`${client.brandName} — Account Configuration`} />

      <div className="flex-1 overflow-y-auto p-6 space-y-6 max-w-2xl">
        {/* Client Info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Client Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Client Name</Label>
                <Input defaultValue={client.name} className="mt-1" />
              </div>
              <div>
                <Label>Brand Name</Label>
                <Input defaultValue={client.brandName} className="mt-1" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Marketplace</Label>
                <Input defaultValue={client.marketplace} className="mt-1" />
              </div>
              <div>
                <Label>Status</Label>
                <div className="mt-1">
                  <Badge variant={client.isActive ? "default" : "secondary"}>
                    {client.isActive ? "Active" : "Inactive"}
                  </Badge>
                </div>
              </div>
            </div>
            <div>
              <Label>Notes</Label>
              <Input defaultValue={client.notes ?? ""} className="mt-1" />
            </div>
            <Button onClick={handleSave}>Save Changes</Button>
          </CardContent>
        </Card>

        {/* Amazon Ads Connection */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Amazon Advertising API</CardTitle>
            <CardDescription>
              Connect to pull campaign, keyword, and ad performance data automatically.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/30">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-amber-500" />
                <div>
                  <p className="text-sm font-medium">Not connected</p>
                  <p className="text-xs text-muted-foreground">Amazon Ads API authorization required</p>
                </div>
              </div>
              <Button size="sm" onClick={() => handleConnect("Amazon Ads")} className="gap-2">
                <Link2 className="w-3.5 h-3.5" />
                Connect
                <ExternalLink className="w-3.5 h-3.5" />
              </Button>
            </div>

            <div>
              <Label className="text-xs text-muted-foreground">Profile ID (after connection)</Label>
              <Input placeholder="Amazon Ads Profile ID" className="mt-1" disabled />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Daily Budget Alerts ($)</Label>
              <Input placeholder="e.g. 5000" type="number" className="mt-1" />
            </div>
          </CardContent>
        </Card>

        {/* SP-API Connection */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Amazon Selling Partner API (SP-API)</CardTitle>
            <CardDescription>
              Connect to pull sales metrics, product data, and brand analytics.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/30">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-amber-500" />
                <div>
                  <p className="text-sm font-medium">Not connected</p>
                  <p className="text-xs text-muted-foreground">SP-API authorization required</p>
                </div>
              </div>
              <Button size="sm" onClick={() => handleConnect("SP-API")} className="gap-2">
                <Link2 className="w-3.5 h-3.5" />
                Connect
                <ExternalLink className="w-3.5 h-3.5" />
              </Button>
            </div>

            <div>
              <Label className="text-xs text-muted-foreground">Seller ID (after connection)</Label>
              <Input placeholder="Amazon Seller ID" className="mt-1" disabled />
            </div>
          </CardContent>
        </Card>

        {/* Sync Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Sync Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Daily Auto-Sync</p>
                <p className="text-xs text-muted-foreground">Automatically sync at 6:00 AM UTC</p>
              </div>
              <Badge variant="secondary">Enabled</Badge>
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Sync History</p>
                <p className="text-xs text-muted-foreground">No syncs yet — connect Amazon APIs to begin</p>
              </div>
              <Button variant="outline" size="sm" className="gap-2" disabled>
                <RefreshCw className="w-3.5 h-3.5" />
                Sync Now
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Danger Zone */}
        <Card className="border-red-200">
          <CardHeader>
            <CardTitle className="text-base text-red-600">Danger Zone</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between p-3 rounded-lg border border-red-200 bg-red-50">
              <div>
                <p className="text-sm font-medium">Delete Client</p>
                <p className="text-xs text-muted-foreground">Permanently remove this client and all associated data.</p>
              </div>
              <Button
                variant="destructive"
                size="sm"
                className="gap-2"
                onClick={() => toast.error("Delete not available in demo mode")}
              >
                <Trash2 className="w-3.5 h-3.5" />
                Delete
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
