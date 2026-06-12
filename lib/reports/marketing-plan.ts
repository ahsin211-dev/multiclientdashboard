import { generateAuditFindings } from "@/lib/reports/audit";
import type { MarketingPlan } from "@/lib/analytics/types";

export async function generateMarketingPlan(clientId: string): Promise<MarketingPlan> {
  const findings = await generateAuditFindings(clientId);
  const wastedSpendCount = findings.filter((finding) => finding.category === "Wasted spend").length;
  const sqpCount = findings.filter((finding) => finding.category === "SQP missed opportunity").length;

  return {
    immediateFixes: [
      wastedSpendCount
        ? `Cut or reduce bids on ${wastedSpendCount} wasted-spend query groups.`
        : "Review search terms weekly and add negatives for non-converting queries.",
      "Lower bids on campaigns above target ACOS before increasing budgets.",
    ],
    campaignRestructuring: [
      "Move proven search terms into exact-match campaigns with dedicated budgets.",
      "Keep auto and broad campaigns as controlled discovery with lower bid ceilings.",
    ],
    budgetReallocation: [
      "Shift budget from high-ACOS discovery to campaigns above 4.0x ROAS.",
      "Reserve 10-15% of spend for SQP-driven tests with clear stop-loss rules.",
    ],
    keywordActions: [
      "Scale exact keywords with strong conversion and purchase share.",
      "Add negatives for terms with material spend and poor purchase share.",
    ],
    sqpStrategy: [
      sqpCount
        ? `Launch tests for ${sqpCount} underfunded SQP opportunities.`
        : "Use SQP gaps to identify high-share queries with low PPC investment.",
      "Defend terms with strong purchase share and efficient PPC.",
    ],
    roadmap30Days: [
      "Week 1: Audit search terms, bids, budgets, and SQP gaps.",
      "Week 2: Restructure campaigns and launch exact winners.",
      "Week 3: Run SQP opportunity tests and product page experiments.",
      "Week 4: Report results, reallocate budget, and set next test backlog.",
    ],
  };
}
