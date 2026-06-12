import { prisma } from "@/lib/db/prisma";
import type { DateRange } from "@/lib/analytics/types";
import { getMetricsWithComparison, getCampaignPerformance } from "@/lib/analytics/metrics";
import { generateAuditFindings } from "./audit";

export interface ClientReportData {
  executiveSummary: string;
  keyMetrics: Record<string, string | number>;
  problemsFound: Array<{ title: string; description: string; severity: string }>;
  recommendedActions: string[];
  nextSteps: string[];
}

export async function generateClientReport(
  clientId: string,
  range: DateRange
): Promise<ClientReportData> {
  const [client, metrics, campaigns, findings] = await Promise.all([
    prisma.client.findUnique({ where: { id: clientId } }),
    getMetricsWithComparison(clientId, range),
    getCampaignPerformance(clientId, range),
    generateAuditFindings(clientId, range),
  ]);

  const brandName = client?.brandName ?? "Client";
  const acosTrend = metrics.changes.acos > 0 ? "increased" : "decreased";
  const roasTrend = metrics.changes.roas > 0 ? "improved" : "declined";

  const executiveSummary = `${brandName} spent $${metrics.spend.toFixed(0)} on Amazon Ads generating $${metrics.sales.toFixed(0)} in attributed sales (${metrics.acos.toFixed(1)}% ACOS, ${metrics.roas.toFixed(1)}x ROAS). Total revenue was $${metrics.revenue.toFixed(0)} (TACOS ${metrics.tacos.toFixed(1)}%). ACOS ${acosTrend} by ${Math.abs(metrics.changes.acos).toFixed(1)}pp and ROAS ${roasTrend} ${Math.abs(metrics.changes.roas).toFixed(1)}% vs. previous period. ${findings.filter((f) => f.severity === "critical").length} critical issues and ${findings.filter((f) => f.severity === "positive").length} growth opportunities identified.`;

  const keyMetrics = {
    adSpend: `$${metrics.spend.toFixed(0)}`,
    attributedSales: `$${metrics.sales.toFixed(0)}`,
    totalRevenue: `$${metrics.revenue.toFixed(0)}`,
    acos: `${metrics.acos.toFixed(1)}%`,
    tacos: `${metrics.tacos.toFixed(1)}%`,
    roas: `${metrics.roas.toFixed(1)}x`,
    orders: metrics.orders,
    impressions: metrics.impressions.toLocaleString(),
    clicks: metrics.clicks.toLocaleString(),
    ctr: `${metrics.ctr.toFixed(2)}%`,
    cpc: `$${metrics.cpc.toFixed(2)}`,
    cvr: `${metrics.cvr.toFixed(1)}%`,
    activeCampaigns: campaigns.length,
  };

  const problemsFound = findings
    .filter((f) => f.severity !== "positive")
    .map((f) => ({
      title: f.title,
      description: f.description,
      severity: f.severity,
    }));

  const recommendedActions = [
    ...findings
      .filter((f) => f.severity === "critical")
      .map((f) => f.recommendation),
    ...findings
      .filter((f) => f.severity === "positive")
      .slice(0, 3)
      .map((f) => f.recommendation),
  ].slice(0, 8);

  const nextSteps = [
    "Review and approve recommended budget changes",
    "Implement negative keyword additions from audit",
    "Schedule follow-up review in 7 days",
    "Run updated audit after changes are live",
  ];

  return {
    executiveSummary,
    keyMetrics,
    problemsFound,
    recommendedActions,
    nextSteps,
  };
}
