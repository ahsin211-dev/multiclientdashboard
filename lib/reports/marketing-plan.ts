import { prisma } from "@/lib/db/prisma";
import type { DateRange } from "@/lib/types";
import { generateAuditFindings } from "./audit";
import { getCampaignPerformance } from "@/lib/analytics/metrics";
import { getSQPInsights } from "@/lib/analytics/sqp";

export async function generateMarketingPlan(clientId: string, range: DateRange) {
  const client = await prisma.client.findUniqueOrThrow({ where: { id: clientId } });
  const [findings, campaigns, sqpInsights] = await Promise.all([
    generateAuditFindings(clientId, range),
    getCampaignPerformance(clientId, range),
    getSQPInsights(clientId, range),
  ]);

  const wastedSpend = findings.filter((f) => f.type === "WASTED_SPEND");
  const highAcos = findings.filter((f) => f.type === "HIGH_ACOS");
  const strongRoas = findings.filter((f) => f.type === "STRONG_ROAS");
  const sqpOpps = sqpInsights.filter((s) => s.recommendedAction === "SCALE");

  const sections = {
    immediateFixes: [
      ...wastedSpend.map((f) => `Pause/negate wasted spend queries — ${f.description}`),
      ...highAcos.slice(0, 3).map((f) => `Reduce bids on ${f.title}`),
    ],
    campaignRestructuring: campaigns
      .filter((c) => c.acos > 40)
      .slice(0, 5)
      .map((c) => `Restructure "${c.name}" — split winners/losers, tighten match types`),
    budgetReallocation: [
      ...strongRoas.map((f) => `Increase budget for ${f.title}`),
      "Shift 15-20% budget from high ACOS to top ROAS campaigns",
    ],
    keywordActions: [
      "Add negative keywords for zero-order search terms",
      "Harvest converting search terms into exact match campaigns",
      ...sqpOpps.slice(0, 5).map((s) => `Launch exact match for "${s.query}"`),
    ],
    sqpStrategy: sqpInsights
      .filter((s) => s.recommendedAction !== "MONITOR")
      .slice(0, 8)
      .map((s) => `${s.recommendedAction}: "${s.query}" — ${s.reason}`),
  };

  const roadmap = {
    week1: ["Pause wasted spend", "Add negatives", "Fix top 3 high ACOS campaigns"],
    week2: ["Launch SQP scale campaigns", "Increase budgets on ROAS winners"],
    week3: ["A/B test listings for low CTR queries", "Review product conversion issues"],
    week4: ["Full performance review", "Adjust TACOS targets", "Plan next month budget"],
  };

  const summary = `30-day marketing plan for ${client.brandName} based on ${findings.length} audit findings.`;

  return prisma.marketingPlan.create({
    data: {
      clientId,
      title: `Marketing Plan — ${client.brandName}`,
      summary,
      sections: sections as unknown as object,
      roadmap: roadmap as unknown as object,
    },
  });
}
