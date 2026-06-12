"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, Loader2, Map } from "lucide-react";
import { formatCurrency, formatPercent } from "@/lib/utils";

interface ClientReportData {
  executiveSummary: string;
  keyMetrics: Record<string, { value: number }>;
  recommendedActions: { title: string; description: string }[];
}

interface MarketingPlanData {
  title: string;
  summary: string;
  sections: Record<string, string[]>;
  roadmap?: Record<string, string[]>;
}

interface ReportsPanelProps {
  clientId: string;
  brandName: string;
}

export function ReportsPanel({ clientId, brandName }: ReportsPanelProps) {
  const [clientReport, setClientReport] = useState<ClientReportData | null>(null);
  const [marketingPlan, setMarketingPlan] = useState<MarketingPlanData | null>(null);
  const [loading, setLoading] = useState<string | null>(null);

  async function generateReport(type: "client" | "marketing-plan") {
    setLoading(type);
    try {
      const res = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientId, type }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      if (type === "client") setClientReport(data);
      else setMarketingPlan(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(null);
    }
  }

  return (
    <Tabs defaultValue="client">
      <TabsList>
        <TabsTrigger value="client">Client Report</TabsTrigger>
        <TabsTrigger value="plan">Marketing Plan</TabsTrigger>
      </TabsList>

      <TabsContent value="client" className="space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Generate an executive summary with key metrics, problems, and recommended actions.
          </p>
          <Button onClick={() => generateReport("client")} disabled={loading === "client"}>
            {loading === "client" ? <Loader2 className="animate-spin" /> : <FileText />}
            Generate Report
          </Button>
        </div>

        {clientReport && (
          <Card>
            <CardHeader>
              <CardTitle>{brandName} — Client Report</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <section>
                <h3 className="font-semibold">Executive Summary</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  {clientReport.executiveSummary}
                </p>
              </section>

              <section>
                <h3 className="font-semibold">Key Metrics</h3>
                <div className="mt-2 grid grid-cols-2 gap-4 md:grid-cols-4">
                  {Object.entries(clientReport.keyMetrics).map(
                    ([key, metric]) => (
                      <div key={key} className="rounded-lg border p-3">
                        <p className="text-xs text-muted-foreground uppercase">{key}</p>
                        <p className="text-lg font-semibold">
                          {key.includes("acos") || key.includes("tacos")
                            ? formatPercent(metric.value)
                            : key.includes("roas")
                              ? `${metric.value.toFixed(2)}x`
                              : formatCurrency(metric.value)}
                        </p>
                      </div>
                    )
                  )}
                </div>
              </section>

              <section>
                <h3 className="font-semibold">Recommended Actions</h3>
                <ul className="mt-2 space-y-2">
                  {clientReport.recommendedActions.map(
                    (action, i) => (
                      <li key={i} className="rounded-lg border p-3 text-sm">
                        <p className="font-medium">{action.title}</p>
                        <p className="text-muted-foreground">{action.description}</p>
                      </li>
                    )
                  )}
                </ul>
              </section>
            </CardContent>
          </Card>
        )}
      </TabsContent>

      <TabsContent value="plan" className="space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Generate a 30-day marketing plan with immediate fixes, restructuring, and SQP strategy.
          </p>
          <Button onClick={() => generateReport("marketing-plan")} disabled={loading === "marketing-plan"}>
            {loading === "marketing-plan" ? <Loader2 className="animate-spin" /> : <Map />}
            Generate Plan
          </Button>
        </div>

        {marketingPlan && (
          <Card>
            <CardHeader>
              <CardTitle>{marketingPlan.title}</CardTitle>
              <p className="text-sm text-muted-foreground">{marketingPlan.summary}</p>
            </CardHeader>
            <CardContent className="space-y-6">
              {Object.entries(marketingPlan.sections).map(
                ([section, items]) => (
                  <section key={section}>
                    <h3 className="font-semibold capitalize">
                      {section.replace(/([A-Z])/g, " $1").trim()}
                    </h3>
                    <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-muted-foreground">
                      {items.map((item, i) => (
                        <li key={i}>{item}</li>
                      ))}
                    </ul>
                  </section>
                )
              )}

              {marketingPlan.roadmap && (
                <section>
                  <h3 className="font-semibold">30-Day Roadmap</h3>
                  <div className="mt-2 grid gap-3 md:grid-cols-2">
                    {Object.entries(marketingPlan.roadmap).map(
                      ([week, tasks]) => (
                        <div key={week} className="rounded-lg border p-3">
                          <p className="font-medium capitalize">{week}</p>
                          <ul className="mt-1 list-inside list-disc text-sm text-muted-foreground">
                            {tasks.map((t, i) => (
                              <li key={i}>{t}</li>
                            ))}
                          </ul>
                        </div>
                      )
                    )}
                  </div>
                </section>
              )}
            </CardContent>
          </Card>
        )}
      </TabsContent>
    </Tabs>
  );
}
