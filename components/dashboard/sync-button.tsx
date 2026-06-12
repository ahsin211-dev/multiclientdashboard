"use client";

import { useState } from "react";
import { RefreshCw } from "lucide-react";

import { Button } from "@/components/ui/button";

type SyncButtonProps = {
  clientId: string;
};

export function SyncButton({ clientId }: SyncButtonProps) {
  const [state, setState] = useState<"idle" | "loading" | "done">("idle");

  async function handleSync() {
    setState("loading");
    await fetch(`/api/clients/${clientId}/sync`, { method: "POST" });
    setState("done");
  }

  return (
    <Button variant="outline" onClick={handleSync} disabled={state === "loading"}>
      <RefreshCw className={`h-4 w-4 ${state === "loading" ? "animate-spin" : ""}`} />
      {state === "loading" ? "Syncing" : state === "done" ? "Queued" : "Manual sync"}
    </Button>
  );
}
