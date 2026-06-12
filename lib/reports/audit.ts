import { prisma } from "@/lib/db/prisma";
import type { AuditFinding, DateRange } from "@/lib/types";
import {
  getCampaignPerformance,
  getDashboardMetrics,
  getSearchTermPerformance,
} from "@/lib/analytics/metrics";
import { getSQPInsights, getWastedSpend } from "@/lib/analytics/sqp";

export async function generateAuditFindings(
  clientId: string,
  range: DateRange
): Promise<AuditFinding[]> {
  const days =
    Math.ceil((range.to.getTime() - range.from.getTime()) / 86400000) + 1;
  const previousFrom = new Date(range.from);
  previousFrom.setDate(previousFrom.getDate() - days);
  const previousTo = new Date(range.from);
  previousTo.setDate(previousTo.getDate() - 1);

  const [metrics, campaigns, searchTerms, sqpInsights, wastedSpend] =
    await Promise.all([
      getDashboardMetrics(clientId, range, { from: previousFrom, to: previousTo }),
      getCampaignPerformance(clientId, range),
      getSearchTermPerformance(clientId, range),
      getSQPInsights(clientId, range),
      getWastedSpend(clientId, range),
    ]);

  const findings: AuditFinding[] = [];

  const totalWasted = wastedSpend.reduce((s, w) => s + w.spend, 0);
  if (totalWasted > 0) {
    findings.push({
      type: "WASTED_SPEND",
      title: "Wasted Ad Spend Detected",
      description: `$${totalWasted.toFixed(0)} in spend across ${wastedSpend.length} queries with poor performance`,
      impact: totalWasted > 1000 ? "high" : "medium",
      metric: "wasted_spend",
      value: totalWasted,
    });
  }

  const highAcosCampaigns = campaigns.filter((c) => c.acos > 35 && c.spend > 200);
  for (const c of highAcosCampaigns.slice(0, 3)) {
    findings.push({
      type: "HIGH_ACOS",
      title: `High ACOS: ${c.name}`,
      description: `ACOS at ${c.acos.toFixed(1)}% with $${c.spend.toFixed(0)} spend`,
      impact: c.spend > 1000 ? "high" : "medium",
      metric: "acos",
      value: c.acos,
    });
  }

  const lowCtrTerms = searchTerms.filter(
    (t) => t.impressions > 1000 && t.clicks / t.impressions < 0.003
  );
  if (lowCtrTerms.length > 0) {
    findings.push({
      type: "LOW_CTR",
      title: "Low CTR Keywords",
      description: `${lowCtrTerms.length} search terms with CTR below 0.3%`,
      impact: "medium",
    });
  }

  const strongRoas = campaigns.filter((c) => c.roas > 4 && c.spend > 100);
  for (const c of strongRoas.slice(0, 3)) {
    findings.push({
      type: "STRONG_ROAS",
      title: `Scale Opportunity: ${c.name}`,
      description: `${c.roas.toFixed(1)}x ROAS — consider increasing budget`,
      impact: "high",
      metric: "roas",
      value: c.roas,
    });
  }

  const sqpMissed = sqpInsights.filter((s) => s.recommendedAction === "SCALE");
  if (sqpMissed.length > 0) {
    findings.push({
      type: "SQP_MISSED_OPPORTUNITY",
      title: "SQP Missed Opportunities",
      description: `${sqpMissed.length} queries with high purchase share but low PPC investment`,
      impact: "high",
    });
  }

  if (metrics.cvr.value < 8 && metrics.clicks.value > 500) {
    findings.push({
      type: "PRODUCT_CONVERSION",
      title: "Low Conversion Rate",
      description: `CVR at ${metrics.cvr.value.toFixed(1)}% — review listing quality and pricing`,
      impact: "medium",
      metric: "cvr",
      value: metrics.cvr.value,
    });
  }

  return findings;
}

export async function createAuditReport(clientId: string, range: DateRange) {
  const client = await prisma.client.findUniqueOrThrow({ where: { id: clientId } });
  const findings = await generateAuditFindings(clientId, range);

  const highImpact = findings.filter((f) => f.impact === "high").length;
  const score = Math.max(0, 100 - highImpact * 15 - findings.length * 3);

  const summary = `Audit for ${client.brandName}: Found ${findings.length} issues (${highImpact} high impact). Health score: ${score}/100.`;

  return prisma.auditReport.create({
    data: {
      clientId,
      title: `Account Audit — ${range.from.toISOString().split("T")[0]}`,
      summary,
      findings: findings as unknown as object,
      score,
      dateRange: {
        from: range.from.toISOString(),
        to: range.to.toISOString(),
      },
    },
  });
}
