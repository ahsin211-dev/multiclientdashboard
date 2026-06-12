"use client";

import { FormEvent, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";

interface ClientOption {
  id: string;
  brandName: string;
}

export function ConnectAmazonForm({ clients }: { clients: ClientOption[] }) {
  const [clientId, setClientId] = useState(clients[0]?.id ?? "");
  const [adsAccessToken, setAdsAccessToken] = useState("mock_ads_access_token");
  const [adsRefreshToken, setAdsRefreshToken] = useState("mock_ads_refresh_token");
  const [spAccessToken, setSpAccessToken] = useState("mock_sp_access_token");
  const [spRefreshToken, setSpRefreshToken] = useState("mock_sp_refresh_token");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const response = await fetch("/api/connect/amazon", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientId,
          adsAccessToken,
          adsRefreshToken,
          spAccessToken,
          spRefreshToken,
          expiresInSeconds: 3600
        })
      });

      const payload = (await response.json()) as { message?: string; error?: string };
      if (!response.ok) throw new Error(payload.error ?? "Connection failed");
      setMessage(payload.message ?? "Connected successfully.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to connect account.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <label className="mb-1 block text-xs text-slate-500">Client</label>
        <Select value={clientId} onChange={(event) => setClientId(event.target.value)} required>
          {clients.map((client) => (
            <option key={client.id} value={client.id}>
              {client.brandName}
            </option>
          ))}
        </Select>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="mb-1 block text-xs text-slate-500">Amazon Ads Access Token</label>
          <Input value={adsAccessToken} onChange={(event) => setAdsAccessToken(event.target.value)} required />
        </div>
        <div>
          <label className="mb-1 block text-xs text-slate-500">Amazon Ads Refresh Token</label>
          <Input value={adsRefreshToken} onChange={(event) => setAdsRefreshToken(event.target.value)} required />
        </div>
        <div>
          <label className="mb-1 block text-xs text-slate-500">SP-API Access Token</label>
          <Input value={spAccessToken} onChange={(event) => setSpAccessToken(event.target.value)} required />
        </div>
        <div>
          <label className="mb-1 block text-xs text-slate-500">SP-API Refresh Token</label>
          <Input value={spRefreshToken} onChange={(event) => setSpRefreshToken(event.target.value)} required />
        </div>
      </div>
      <Button type="submit" disabled={loading}>
        {loading ? "Connecting..." : "Connect Account + Trigger Initial Sync"}
      </Button>
      {message ? <p className="text-sm text-slate-600">{message}</p> : null}
    </form>
  );
}
