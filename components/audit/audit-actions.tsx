"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { ClipboardCheck, Wand2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export function RunAuditButton({ clientId, period = "30d" }: { clientId: string; period?: string }) {
  const router = useRouter();
  const [loading, setLoading] = React.useState(false);

  async function run() {
    setLoading(true);
    try {
      await fetch(`/api/clients/${clientId}/audit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientId, period }),
      });
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button onClick={run} disabled={loading}>
      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ClipboardCheck className="h-4 w-4" />}
      {loading ? "Running audit…" : "Run audit"}
    </Button>
  );
}

export function GeneratePlanButton({
  clientId,
  auditId,
}: {
  clientId: string;
  auditId: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = React.useState(false);

  async function run() {
    setLoading(true);
    try {
      await fetch(`/api/clients/${clientId}/marketing-plan`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientId, auditId }),
      });
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button variant="outline" onClick={run} disabled={loading}>
      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}
      {loading ? "Generating plan…" : "Generate marketing plan"}
    </Button>
  );
}
