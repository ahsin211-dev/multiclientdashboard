"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ClipboardCheck, Loader2 } from "lucide-react";

interface AuditFinding {
  type: string;
  title: string;
  description: string;
  impact: "high" | "medium" | "low";
}

interface AuditReport {
  id: string;
  title: string;
  summary: string;
  score: number | null;
  findings: AuditFinding[];
  createdAt: string;
}

interface AuditPanelProps {
  clientId: string;
  initialReports: AuditReport[];
}

const impactVariant: Record<string, "destructive" | "warning" | "secondary"> = {
  high: "destructive",
  medium: "warning",
  low: "secondary",
};

export function AuditPanel({ clientId, initialReports }: AuditPanelProps) {
  const [reports, setReports] = useState(initialReports);
  const [loading, setLoading] = useState(false);
  const [latest, setLatest] = useState<AuditReport | null>(
    initialReports[0] ?? null
  );

  async function runAudit() {
    setLoading(true);
    try {
      const res = await fetch("/api/audit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setLatest(data);
      setReports((prev) => [data, ...prev]);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Account Audit</h2>
          <p className="text-sm text-muted-foreground">
            Analyze wasted spend, high ACOS campaigns, SQP opportunities, and conversion issues.
          </p>
        </div>
        <Button onClick={runAudit} disabled={loading}>
          {loading ? (
            <Loader2 className="animate-spin" />
          ) : (
            <ClipboardCheck />
          )}
          {loading ? "Running Audit..." : "Run Audit"}
        </Button>
      </div>

      {latest && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>{latest.title}</CardTitle>
              {latest.score !== null && (
                <Badge variant={latest.score >= 70 ? "success" : latest.score >= 50 ? "warning" : "destructive"}>
                  Score: {latest.score}/100
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground">{latest.summary}</p>
          </CardHeader>
          <CardContent className="space-y-4">
            {(latest.findings as AuditFinding[]).map((finding, i) => (
              <div key={i} className="flex items-start gap-3 rounded-lg border p-4">
                <Badge variant={impactVariant[finding.impact] ?? "secondary"}>
                  {finding.impact}
                </Badge>
                <div>
                  <p className="font-medium">{finding.title}</p>
                  <p className="text-sm text-muted-foreground">{finding.description}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {reports.length > 1 && (
        <div>
          <h3 className="mb-3 text-sm font-medium text-muted-foreground">Previous Audits</h3>
          <div className="space-y-2">
            {reports.slice(1).map((r) => (
              <div key={r.id} className="flex items-center justify-between rounded-md border p-3 text-sm">
                <span>{r.title}</span>
                <span className="text-muted-foreground">
                  {new Date(r.createdAt).toLocaleDateString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
