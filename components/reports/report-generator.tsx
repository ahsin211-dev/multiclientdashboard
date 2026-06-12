"use client";

import * as React from "react";
import { FileText, Loader2, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Markdown } from "@/components/ui/markdown";
import { EmptyState } from "@/components/states/states";

export function ReportGenerator({
  clientId,
  period = "30d",
}: {
  clientId: string;
  period?: string;
}) {
  const [markdown, setMarkdown] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);

  async function generate() {
    setLoading(true);
    try {
      const res = await fetch(`/api/clients/${clientId}/report`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientId, period }),
      });
      const json = await res.json();
      setMarkdown(json.markdown ?? "No report generated.");
    } catch {
      setMarkdown("Failed to generate report.");
    } finally {
      setLoading(false);
    }
  }

  function download() {
    if (!markdown) return;
    const blob = new Blob([markdown], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `report-${clientId}-${new Date().toISOString().slice(0, 10)}.md`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Button onClick={generate} disabled={loading}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />}
          {loading ? "Generating…" : markdown ? "Regenerate report" : "Generate report"}
        </Button>
        {markdown && (
          <Button variant="outline" onClick={download}>
            <Download className="h-4 w-4" />
            Download .md
          </Button>
        )}
      </div>

      {markdown ? (
        <Card>
          <CardContent className="pt-6">
            <Markdown content={markdown} />
          </CardContent>
        </Card>
      ) : (
        !loading && (
          <EmptyState
            title="No report generated"
            description="Generate an executive client report with key metrics, problems found and recommended next steps."
            icon={FileText}
          />
        )
      )}
    </div>
  );
}
