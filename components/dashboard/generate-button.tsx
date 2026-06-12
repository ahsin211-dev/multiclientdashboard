"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";

export function GenerateButton({
  endpoint,
  label
}: {
  endpoint: string;
  label: string;
}) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function run() {
    setLoading(true);
    setMessage(null);
    try {
      const response = await fetch(endpoint, { method: "POST" });
      if (!response.ok) {
        const payload = (await response.json()) as { error?: string };
        throw new Error(payload.error ?? "Request failed");
      }
      setMessage("Generated successfully. Refresh the page to see latest output.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to generate.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-2">
      <Button onClick={run} disabled={loading} size="sm">
        {loading ? "Generating..." : label}
      </Button>
      {message ? <p className="text-xs text-slate-600">{message}</p> : null}
    </div>
  );
}
