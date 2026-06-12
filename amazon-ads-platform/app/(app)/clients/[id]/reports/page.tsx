"use client";

import { useState } from "react";
import { use } from "react";
import { Header } from "@/components/layout/header";
import { MOCK_CLIENTS, generateMetricSummary } from "@/lib/mock-data";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  FileText,
  Download,
  Loader2,
  CheckCircle2,
  BarChart2,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Sparkles,
} from "lucide-react";

interface PageProps {
  params: Promise<{ id: string }>;
}

const reportTypes = [
  {
    id: "weekly",
    title: "Weekly Performance Report",
    description: "Executive summary, key metrics, campaign highlights, and recommended actions for this week.",
    icon: BarChart2,
    estimatedTime: "~15 seconds",
  },
  {
    id: "audit",
    title: "Full Account Audit Report",
    description: "Deep-dive audit with wasted spend analysis, conversion issues, and growth opportunities.",
    icon: AlertTriangle,
    estimatedTime: "~30 seconds",
  },
  {
    id: "marketing_plan",
    title: "30-Day Marketing Plan",
    description: "Strategic campaign roadmap, budget allocation, keyword strategy, and SQP action plan.",
    icon: Sparkles,
    estimatedTime: "~25 seconds",
  },
  {
    id: "sqp",
    title: "SQP Intelligence Report",
    description: "Comprehensive Search Query Performance analysis with Scale/Cut/Test/Defend actions.",
    icon: TrendingUp,
    estimatedTime: "~20 seconds",
  },
];

interface ReportState {
  status: "idle" | "generating" | "complete";
  progress: number;
  content?: string;
}

export default function ReportsPage({ params }: PageProps) {
  const { id: clientId } = use(params);
  const client = MOCK_CLIENTS.find((c) => c.id === clientId) ?? MOCK_CLIENTS[0];
  const [reportStates, setReportStates] = useState<Record<string, ReportState>>({});

  const metrics = generateMetricSummary();

  const generateReport = async (reportId: string) => {
    setReportStates((prev) => ({
      ...prev,
      [reportId]: { status: "generating", progress: 0 },
    }));

    for (let p = 0; p <= 100; p += 10) {
      await new Promise((r) => setTimeout(r, 200));
      setReportStates((prev) => ({
        ...prev,
        [reportId]: { status: "generating", progress: p },
      }));
    }

    const content = generateMockReport(reportId, client.brandName, metrics);

    setReportStates((prev) => ({
      ...prev,
      [reportId]: { status: "complete", progress: 100, content },
    }));
  };

  return (
    <div className="flex flex-col h-full">
      <Header title="Reports" subtitle={`${client.brandName} — Generate client-ready reports`} />

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {reportTypes.map((report) => {
            const Icon = report.icon;
            const state = reportStates[report.id] ?? { status: "idle", progress: 0 };

            return (
              <Card key={report.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <Icon className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1">
                      <CardTitle className="text-base">{report.title}</CardTitle>
                      <p className="text-sm text-muted-foreground mt-1">{report.description}</p>
                      <p className="text-xs text-muted-foreground mt-1">Est. {report.estimatedTime}</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  {state.status === "idle" && (
                    <Button
                      onClick={() => generateReport(report.id)}
                      className="w-full gap-2"
                      variant="outline"
                    >
                      <Sparkles className="w-4 h-4" />
                      Generate with AI
                    </Button>
                  )}

                  {state.status === "generating" && (
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <Loader2 className="w-4 h-4 animate-spin text-primary" />
                        <span className="text-sm text-muted-foreground">Generating report...</span>
                      </div>
                      <Progress value={state.progress} />
                    </div>
                  )}

                  {state.status === "complete" && state.content && (
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                        <span className="text-sm font-medium">Report ready</span>
                      </div>
                      <div className="bg-muted/40 rounded-lg p-4 text-sm font-mono max-h-64 overflow-y-auto whitespace-pre-wrap text-xs leading-relaxed">
                        {state.content}
                      </div>
                      <div className="flex gap-2 mt-3">
                        <Button size="sm" className="gap-2 flex-1">
                          <Download className="w-3.5 h-3.5" />
                          Download PDF
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => generateReport(report.id)}
                        >
                          Regenerate
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function generateMockReport(reportId: string, brandName: string, metrics: ReturnType<typeof generateMetricSummary>): string {
  const date = new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });

  switch (reportId) {
    case "weekly":
      return `WEEKLY PERFORMANCE REPORT — ${brandName}
Generated: ${date}

EXECUTIVE SUMMARY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Strong week for ${brandName} with ad sales up ${Math.abs(metrics.salesChange ?? 0).toFixed(1)}% vs prior period.
ACOS held steady at ${metrics.acos}%, within target range.
Total orders: ${metrics.orders.toLocaleString()} | Revenue: $${metrics.revenue.toLocaleString()}

KEY METRICS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Ad Spend:     $${metrics.spend.toLocaleString()} (${(metrics.spendChange ?? 0) > 0 ? "+" : ""}${(metrics.spendChange ?? 0).toFixed(1)}%)
Ad Sales:     $${metrics.sales.toLocaleString()} (${(metrics.salesChange ?? 0) > 0 ? "+" : ""}${(metrics.salesChange ?? 0).toFixed(1)}%)
ACOS:         ${metrics.acos}%
ROAS:         ${metrics.roas}x
TACOS:        ${metrics.tacos}%
Impressions:  ${metrics.impressions.toLocaleString()}
Clicks:       ${metrics.clicks.toLocaleString()}
CTR:          ${metrics.ctr}%
CVR:          ${metrics.cvr}%

TOP FINDINGS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1. SP - Manual - Branded: ROAS 8.2x — scale budget immediately
2. SD - Competitor Targeting: ACOS 52% — reduce bids by 25%
3. 3 SQP queries with >10% purchase share missing PPC coverage

RECOMMENDED ACTIONS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Priority 1: Increase branded campaign budget by $50/day
Priority 2: Pause zero-conversion auto campaigns
Priority 3: Create exact match for top 3 SQP opportunities
Priority 4: Audit product pages for 2 low-CVR ASINs

Next Report: ${new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}`;

    case "marketing_plan":
      return `30-DAY MARKETING PLAN — ${brandName}
Generated: ${date}

SITUATION ANALYSIS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Current ACOS: ${metrics.acos}% | Target: 22%
TACOS: ${metrics.tacos}% | Gap to close: ${Math.max(0, metrics.tacos - 12).toFixed(1)}pp
Primary opportunity: SQP coverage gaps + budget-capped winners

WEEK 1: IMMEDIATE FIXES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
□ Pause campaigns with ACOS > 50% and < 50 orders
□ Increase branded keyword campaign budget by 40%
□ Add negatives from search term report (identify irrelevant queries)
□ Fix product listings with CVR < 3%

WEEK 2: CAMPAIGN RESTRUCTURING  
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
□ Create exact match campaigns for top 5 SQP queries
□ Split auto campaigns by match type performance
□ Launch competitor defensive targeting with $30/day budget
□ Build dedicated campaign for top 3 ASINs by revenue

WEEK 3-4: SCALE & OPTIMIZE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
□ Scale top 3 SP campaigns by 20-30% if ACOS holds
□ Test new SB video creative on branded terms
□ Launch SD retargeting for product page visitors
□ Implement dayparting on campaigns with poor overnight performance

BUDGET ALLOCATION (30-Day)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Sponsored Products:  70% of total budget
Sponsored Brands:    20% of total budget  
Sponsored Display:   10% of total budget

SUCCESS METRICS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Target ACOS: 22% (from current ${metrics.acos}%)
Target TACOS: 12% (from current ${metrics.tacos}%)
Revenue growth target: +15% MoM
Orders target: ${Math.round(metrics.orders * 1.15).toLocaleString()}/month`;

    default:
      return `REPORT — ${brandName}\nGenerated: ${date}\n\nReport content for ${reportId} would be generated here using live Claude API with actual client data context.`;
  }
}
