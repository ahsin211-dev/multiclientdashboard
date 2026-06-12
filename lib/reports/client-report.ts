import { prisma } from "@/lib/db/prisma";
import type { DateRange } from "@/lib/types";
import { getDashboardMetrics, getCampaignPerformance } from "@/lib/analytics/metrics";
import { generateAuditFindings } from "./audit";

export async function generateClientReport(clientId: string, range: DateRange) {
  const client = await prisma.client.findUniqueOrThrow({ where: { id: clientId } });

  const days =
    Math.ceil((range.to.getTime() - range.from.getTime()) / 86400000) + 1;
  const previousFrom = new Date(range.from);
  previousFrom.setDate(previousFrom.getDate() - days);
  const previousTo = new Date(range.from);
  previousTo.setDate(previousTo.getDate() - 1);

  const [metrics, campaigns, findings] = await Promise.all([
    getDashboardMetrics(clientId, range, { from: previousFrom, to: previousTo }),
    getCampaignPerformance(clientId, range),
    generateAuditFindings(clientId, range),
  ]);

  const highImpact = findings.filter((f) => f.impact === "high");

  return {
    client: client.brandName,
    period: {
      from: range.from.toISOString().split("T")[0],
      to: range.to.toISOString().split("T")[0],
    },
    executiveSummary: `${client.brandName} spent $${metrics.adSpend.value.toFixed(0)} on ads generating $${metrics.sales.value.toFixed(0)} in attributed sales (${metrics.acos.value.toFixed(1)}% ACOS, ${metrics.roas.value.toFixed(2)}x ROAS). Total revenue was $${metrics.revenue.value.toFixed(0)} with TACOS at ${metrics.tacos.value.toFixed(1)}%.`,
    keyMetrics: {
      adSpend: metrics.adSpend,
      sales: metrics.sales,
      revenue: metrics.revenue,
      acos: metrics.acos,
      roas: metrics.roas,
      tacos: metrics.tacos,
      orders: metrics.orders,
    },
    topCampaigns: campaigns.slice(0, 5),
    problemsFound: findings,
    recommendedActions: highImpact.map((f) => ({
      title: f.title,
      description: f.description,
      priority: f.impact,
    })),
    nextSteps: [
      "Review and approve budget reallocation",
      "Implement negative keyword additions",
      "Schedule follow-up audit in 30 days",
    ],
  };
}
