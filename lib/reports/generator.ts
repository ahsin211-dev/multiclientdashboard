import { getClient } from "@/lib/db/repository";
import { getClientContext, getPerformanceSummary, getScalingOpportunities, getSQPInsights, getWastedSpend } from "@/lib/analytics/service";
import { type DateRange } from "@/lib/utils";

export async function generateAudit(clientId: string, range: DateRange) {
  const client = await getClient(clientId);
  const performance = await getPerformanceSummary(clientId, range);
  const wastedSpend = await getWastedSpend(clientId, range);
  const scaling = await getScalingOpportunities(clientId, range);
  const sqp = await getSQPInsights(clientId, range);

  if (!client || !performance) {
    return null;
  }

  return {
    title: `${client.brandName} audit`,
    summary: client.audit.summary,
    findings: [
      ...client.audit.findings,
      ...wastedSpend.slice(0, 2).map((item) => ({
        category: "Wasted spend",
        severity: "high" as const,
        insight: `${item.title}: ${item.detail}`,
      })),
      ...scaling.slice(0, 2).map((item) => ({
        category: "Scale opportunity",
        severity: "medium" as const,
        insight: `${item.title}: ${item.detail}`,
      })),
      {
        category: "SQP coverage",
        severity: "medium" as const,
        insight: `${sqp.filter((row) => row.recommendedAction === "Scale").length} queries qualify for scale action.`,
      },
    ],
    metrics: performance.metrics,
  };
}

export async function generateMarketingPlan(clientId: string) {
  const client = await getClient(clientId);

  if (!client) {
    return null;
  }

  return client.marketingPlan;
}

export async function generateClientReport(clientId: string, range: DateRange) {
  const client = await getClient(clientId);
  const context = await getClientContext(clientId, range);

  if (!client || !context) {
    return null;
  }

  const executiveSummary = [
    `${client.brandName} maintained ${context.performance.find((metric) => metric.key === "roas")?.value.toFixed(2) ?? "0.00"} ROAS in the selected period.`,
    `${context.wastedSpend.length} primary waste pockets and ${context.scalingOpportunities.length} scale opportunities were detected.`,
    `SQP analysis highlighted ${context.sqpInsights.filter((row) => row.recommendedAction === "Scale").length} search queries that merit more PPC investment.`,
  ];

  return {
    title: `${client.brandName} weekly report`,
    executiveSummary,
    keyMetrics: context.performance,
    problemsFound: context.wastedSpend,
    recommendedActions: context.scalingOpportunities,
    nextSteps: client.marketingPlan.roadmap,
  };
}
