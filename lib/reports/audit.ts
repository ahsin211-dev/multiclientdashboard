import { getDashboardData } from "@/lib/analytics/dashboard";
import type { AuditFinding } from "@/lib/analytics/types";

export async function generateAuditFindings(clientId: string): Promise<AuditFinding[]> {
  const data = await getDashboardData(clientId);
  const findings: AuditFinding[] = [];

  for (const term of data.searchTerms.filter((item) => item.spend > 250 && item.acos > 45)) {
    findings.push({
      category: "Wasted spend",
      severity: "high",
      finding: `${term.query} spent $${Math.round(term.spend)} at ${term.acos.toFixed(1)}% ACOS.`,
      recommendation: "Reduce bids, add negatives where irrelevant, and isolate only converting variants.",
      impact: "Protects budget from terms that are consuming spend without profitable revenue.",
    });
  }

  for (const campaign of data.campaigns.filter((item) => item.acos > 30)) {
    findings.push({
      category: "High ACOS campaign",
      severity: "medium",
      finding: `${campaign.name} is running at ${campaign.acos.toFixed(1)}% ACOS.`,
      recommendation: "Split winners into exact campaigns and cap broad/auto bids until conversion improves.",
      impact: "Improves efficiency without stopping discovery completely.",
    });
  }

  for (const sqp of data.sqpInsights.filter((item) => item.recommendedAction === "Scale")) {
    findings.push({
      category: "SQP missed opportunity",
      severity: "medium",
      finding: `${sqp.query} has ${sqp.purchaseShare.toFixed(1)}% purchase share but only $${Math.round(sqp.ppcSpend)} PPC spend.`,
      recommendation: "Launch exact and phrase campaigns with controlled budget increases.",
      impact: "Captures profitable demand where organic conversion signals are already strong.",
    });
  }

  return findings;
}
