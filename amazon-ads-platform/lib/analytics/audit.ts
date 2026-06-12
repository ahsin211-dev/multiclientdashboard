import { AuditFinding, CampaignPerformance, SQPRow } from "@/lib/types";
import { getCampaignPerformance, getWastedSpend } from "./metrics";
import { getSQPInsights } from "./sqp";
import { DateRange } from "@/lib/types";

export async function generateAuditFindings(
  clientId: string,
  dateRange: DateRange
): Promise<{ findings: AuditFinding[]; wastedSpend: number; totalSpend: number }> {
  const [campaigns, wasted, sqp] = await Promise.all([
    getCampaignPerformance(clientId, dateRange),
    getWastedSpend(clientId, dateRange),
    getSQPInsights(clientId, dateRange),
  ]);

  const findings: AuditFinding[] = [];
  const totalSpend = campaigns.reduce((s, c) => s + c.spend, 0);

  // High ACOS campaigns
  const highAcos = campaigns.filter((c) => c.acos > 40 && c.state === "ENABLED");
  if (highAcos.length > 0) {
    findings.push({
      category: "ACOS",
      severity: "HIGH",
      title: `${highAcos.length} campaigns with ACOS > 40%`,
      description: "These campaigns are spending significantly above target ACOS.",
      impact: `$${highAcos.reduce((s, c) => s + c.spend, 0).toLocaleString()} at risk`,
      recommendation: "Review bids, match types, and negative keyword lists for these campaigns.",
      affectedItems: highAcos.slice(0, 5).map((c) => c.name),
      estimatedWastedSpend: highAcos.reduce((s, c) => s + c.spend * 0.4, 0),
    });
  }

  // Zero conversion campaigns
  const zeroConv = campaigns.filter((c) => c.clicks > 200 && c.orders === 0);
  if (zeroConv.length > 0) {
    findings.push({
      category: "Conversion",
      severity: "HIGH",
      title: `${zeroConv.length} campaigns with clicks but zero orders`,
      description: "Significant click spend with no resulting orders.",
      impact: `$${zeroConv.reduce((s, c) => s + c.spend, 0).toLocaleString()} in non-converting spend`,
      recommendation: "Pause these campaigns and audit product pages for conversion rate issues.",
      affectedItems: zeroConv.map((c) => c.name),
      estimatedWastedSpend: zeroConv.reduce((s, c) => s + c.spend, 0),
    });
  }

  // Low CTR keywords
  const lowCtr = campaigns.filter((c) => c.ctr < 0.2 && c.impressions > 10000);
  if (lowCtr.length > 0) {
    findings.push({
      category: "CTR",
      severity: "MEDIUM",
      title: `${lowCtr.length} campaigns with CTR below 0.2%`,
      description: "Very low click-through rates indicate poor ad relevance or creative.",
      impact: "Missing potential traffic — low Quality Score risk",
      recommendation: "Improve ad copy, main image, and bid strategies. Add negative keywords.",
      affectedItems: lowCtr.slice(0, 5).map((c) => c.name),
    });
  }

  // SQP missed opportunities
  const sqpMissed = sqp.filter((s) => s.action === "SCALE" || s.action === "DEFEND");
  if (sqpMissed.length > 0) {
    findings.push({
      category: "SQP",
      severity: "MEDIUM",
      title: `${sqpMissed.length} high-converting search queries underinvested in PPC`,
      description: "Queries with strong purchase share but low PPC coverage.",
      impact: `Potential $${Math.round(sqpMissed.reduce((s, q) => s + q.ppcSales * 0.5, 0)).toLocaleString()} in missed sales`,
      recommendation: "Create exact match campaigns targeting these high-intent queries.",
      affectedItems: sqpMissed.slice(0, 5).map((s) => s.query),
    });
  }

  // Budget capping
  const budgetCapped = campaigns.filter((c) => c.spend >= c.budget * 0.95 && c.acos < 25);
  if (budgetCapped.length > 0) {
    findings.push({
      category: "Budget",
      severity: "MEDIUM",
      title: `${budgetCapped.length} efficient campaigns may be budget-capped`,
      description: "These campaigns are spending close to their daily budget with good ACOS.",
      impact: `Missing estimated $${Math.round(budgetCapped.reduce((s, c) => s + c.sales * 0.2, 0)).toLocaleString()} in additional sales`,
      recommendation: "Increase daily budgets by 20-30% for these high-performing campaigns.",
      affectedItems: budgetCapped.slice(0, 5).map((c) => c.name),
    });
  }

  // Strong ROAS campaigns (positive finding)
  const strongRoas = campaigns.filter((c) => c.roas > 7 && c.acos < 15);
  if (strongRoas.length > 0) {
    findings.push({
      category: "Opportunity",
      severity: "LOW",
      title: `${strongRoas.length} campaigns with exceptional ROAS (>7x)`,
      description: "These campaigns are generating outsized returns.",
      impact: `$${strongRoas.reduce((s, c) => s + c.sales, 0).toLocaleString()} in high-efficiency sales`,
      recommendation: "Scale budgets aggressively — these are your star campaigns.",
      affectedItems: strongRoas.slice(0, 5).map((c) => c.name),
    });
  }

  return {
    findings,
    wastedSpend: wasted.total,
    totalSpend,
  };
}
