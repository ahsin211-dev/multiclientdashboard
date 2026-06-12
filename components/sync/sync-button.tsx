"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/** Triggers a manual sync for a client and refreshes the page when done. */
export function SyncButton({
  clientId,
  variant = "default",
  size = "default",
}: {
  clientId: string;
  variant?: "default" | "outline" | "secondary";
  size?: "default" | "sm";
}) {
  const router = useRouter();
  const [loading, setLoading] = React.useState(false);
  const [status, setStatus] = React.useState<string | null>(null);

  async function trigger() {
    setLoading(true);
    setStatus(null);
    try {
      const res = await fetch(`/api/clients/${clientId}/sync`, { method: "POST" });
      const json = await res.json();
      setStatus(json.mode === "queued" ? "Queued" : "Syncing…");
      // Poll job status briefly then refresh.
      await pollJob(clientId, json.jobId);
      router.refresh();
      setStatus("Synced");
    } catch {
      setStatus("Failed");
    } finally {
      setLoading(false);
      setTimeout(() => setStatus(null), 3000);
    }
  }

  return (
    <Button onClick={trigger} disabled={loading} variant={variant} size={size}>
      <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
      {loading ? status ?? "Syncing…" : status ?? "Sync now"}
    </Button>
  );
}

async function pollJob(clientId: string, jobId: string, tries = 20) {
  for (let i = 0; i < tries; i++) {
    await new Promise((r) => setTimeout(r, 1000));
    try {
      const res = await fetch(`/api/clients/${clientId}/sync?jobId=${jobId}`);
      const json = await res.json();
      if (json.status === "COMPLETED" || json.status === "FAILED") return json.status;
    } catch {
      // keep polling
    }
  }
  return "TIMEOUT";
}
