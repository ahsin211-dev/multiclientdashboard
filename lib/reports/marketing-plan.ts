import { prisma } from "@/lib/db/prisma";
import type { DateRange } from "@/lib/analytics/types";
import { generateAuditFindings } from "./audit";
import { getMetricsWithComparison } from "@/lib/analytics/metrics";
import { getScalingOpportunities, getWastedSpend } from "@/lib/analytics/insights";
import { getSQPInsights } from "@/lib/analytics/sqp";

export async function generateMarketingPlan(
  clientId: string,
  range: DateRange
) {
  const [findings, metrics, wasted, scaling, sqp] = await Promise.all([
    generateAuditFindings(clientId, range),
    getMetricsWithComparison(clientId, range),
    getWastedSpend(clientId, range),
    getScalingOpportunities(clientId, range),
    getSQPInsights(clientId, range),
  ]);

  const client = await prisma.client.findUnique({ where: { id: clientId } });

  const sections = {
    immediateFixes: [
      ...wasted.slice(0, 5).map((w) => ({
        action: `Pause or reduce: ${w.name}`,
        reason: w.reason,
        impact: `Save ~$${w.spend.toFixed(0)}/period`,
      })),
      ...findings
        .filter((f) => f.severity === "critical")
        .slice(0, 3)
        .map((f) => ({
          action: f.recommendation,
          reason: f.description,
          impact: "Reduce wasted spend",
        })),
    ],
    campaignRestructuring: findings
      .filter((f) => f.type === "HIGH_ACOS")
      .slice(0, 5)
      .map((f) => ({
        campaign: f.entity,
        action: f.recommendation,
        currentAcos: f.metric,
      })),
    budgetReallocation: scaling.slice(0, 5).map((s) => ({
      target: s.name,
      type: s.entityType,
      currentSpend: `$${s.currentSpend.toFixed(0)}`,
      roas: `${s.roas.toFixed(1)}x`,
      action: `Increase budget by 20-30%`,
      reason: s.reason,
    })),
    keywordActions: {
      negative: wasted
        .filter((w) => w.entityType === "search_term")
        .slice(0, 10)
        .map((w) => ({ term: w.name, reason: w.reason })),
      scale: scaling
        .filter((s) => s.entityType === "keyword")
        .slice(0, 10)
        .map((s) => ({ keyword: s.name, reason: s.reason })),
    },
    sqpStrategy: sqp
      .filter((s) => ["SCALE", "DEFEND", "TEST"].includes(s.recommendedAction))
      .slice(0, 10)
      .map((s) => ({
        query: s.query,
        action: s.recommendedAction,
        reason: s.actionReason,
        impressionShare: `${s.impressionShare.toFixed(1)}%`,
        purchaseShare: `${s.purchaseShare.toFixed(1)}%`,
      })),
  };

  const roadmap = {
    week1: [
      "Pause top wasted spend campaigns/keywords",
      "Implement negative keywords from audit",
      "Increase budgets on top 3 ROAS campaigns by 15%",
    ],
    week2: [
      "Launch SQP scale queries as new keyword targets",
      "A/B test main images on low-CTR search terms",
      "Restructure high-ACOS campaigns into tighter ad groups",
    ],
    week3: [
      "Review bid adjustments based on week 1-2 performance",
      "Expand successful keyword targets",
      "Test Sponsored Brands for top SQP queries",
    ],
    week4: [
      "Full performance review vs. baseline metrics",
      "Finalize budget allocation for next month",
      "Document learnings and update SOPs",
    ],
  };

  return prisma.marketingPlan.create({
    data: {
      clientId,
      title: `30-Day Marketing Plan — ${client?.brandName ?? "Client"}`,
      summary: `Plan based on $${metrics.spend.toFixed(0)} ad spend, ${metrics.acos.toFixed(1)}% ACOS, ${metrics.roas.toFixed(1)}x ROAS over the audit period.`,
      sections: sections as unknown as object,
      roadmap: roadmap as unknown as object,
    },
  });
}
