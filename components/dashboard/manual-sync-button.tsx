"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";

export function ManualSyncButton({ clientId }: { clientId: string }) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function runSync() {
    setLoading(true);
    setMessage(null);
    try {
      const response = await fetch(`/api/clients/${clientId}/sync`, {
        method: "POST",
        headers: { "Content-Type": "application/json" }
      });
      const payload = (await response.json()) as { job?: { id: string }; error?: string };
      if (!response.ok) {
        throw new Error(payload.error ?? "Sync trigger failed");
      }
      setMessage(`Manual sync queued (job: ${payload.job?.id ?? "n/a"}).`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to queue sync.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-2">
      <Button onClick={runSync} disabled={loading}>
        {loading ? "Queueing..." : "Run Manual Sync"}
      </Button>
      {message ? <p className="text-xs text-slate-600">{message}</p> : null}
    </div>
  );
}
