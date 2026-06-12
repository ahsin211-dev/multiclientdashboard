import { prisma } from "@/lib/db/prisma";
import { getScalingOpportunities, getWastedSpend } from "@/lib/analytics/sqp";

export async function generateMarketingPlan(
  clientId: string,
  workspaceId: string,
  generatedById?: string
) {
  const [wastedSpend, scaling] = await Promise.all([
    getWastedSpend(clientId),
    getScalingOpportunities(clientId)
  ]);

  return prisma.marketingPlan.create({
    data: {
      workspaceId,
      clientId,
      generatedById,
      title: "AI-Assisted Marketing Plan",
      executiveSummary:
        "Prioritize spend efficiency by reducing waste and reallocating into high-intent SQP opportunities.",
      actions: {
        immediateFixes: wastedSpend.slice(0, 5).map((row) => `Reduce bids or pause query "${row.query}".`),
        campaignRestructuring: [
          "Separate brand, category, and conquest campaigns for cleaner budget control.",
          "Move scale-worthy SQP queries into dedicated exact-match campaign groups."
        ],
        budgetReallocation: [
          "Reallocate 15-25% of low-efficiency spend into high ROAS branded/category segments."
        ],
        keywordActions: [
          "Promote winning queries to exact match.",
          "Add negative keywords for repeated high-spend / low-order queries."
        ],
        sqpStrategy: scaling
      },
      roadmap: {
        days1to7: "Cut waste and stabilize ACOS with bid controls.",
        days8to14: "Launch SQP scale campaigns and optimize search term harvesting.",
        days15to21: "Rebuild ad group structure around converting intent clusters.",
        days22to30: "Consolidate wins and prepare executive-facing monthly report."
      }
    }
  });
}
