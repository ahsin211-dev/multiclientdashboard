import { AuditFindingType } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import type { DateRange } from "@/lib/analytics/types";
import {
  getCampaignPerformance,
  getMetricsWithComparison,
  getSearchTermPerformance,
} from "@/lib/analytics/metrics";
import { getSQPInsights } from "@/lib/analytics/sqp";
import { getWastedSpend } from "@/lib/analytics/insights";

export interface AuditFinding {
  type: AuditFindingType;
  title: string;
  description: string;
  severity: "critical" | "warning" | "info" | "positive";
  metric?: string;
  entity?: string;
  recommendation: string;
}

export async function generateAuditFindings(
  clientId: string,
  range: DateRange
): Promise<AuditFinding[]> {
  const findings: AuditFinding[] = [];

  const [metrics, campaigns, searchTerms, sqpInsights, wastedSpend] =
    await Promise.all([
      getMetricsWithComparison(clientId, range),
      getCampaignPerformance(clientId, range),
      getSearchTermPerformance(clientId, range),
      getSQPInsights(clientId, range),
      getWastedSpend(clientId, range),
    ]);

  // Wasted spend
  const totalWasted = wastedSpend.reduce((s, w) => s + w.spend, 0);
  if (totalWasted > 0) {
    findings.push({
      type: AuditFindingType.WASTED_SPEND,
      title: `$${totalWasted.toFixed(0)} in wasted ad spend identified`,
      description: `${wastedSpend.length} campaigns/keywords/search terms with high ACOS or zero sales`,
      severity: totalWasted > 500 ? "critical" : "warning",
      metric: `$${totalWasted.toFixed(0)}`,
      recommendation: "Pause or reduce bids on underperforming targets. Review top wasted spend items first.",
    });
  }

  // High ACOS campaigns
  const highAcos = campaigns.filter((c) => c.acos > 40 && c.spend > 50);
  for (const c of highAcos.slice(0, 5)) {
    findings.push({
      type: AuditFindingType.HIGH_ACOS,
      title: `High ACOS: ${c.name}`,
      description: `Campaign spending $${c.spend.toFixed(0)} at ${c.acos.toFixed(1)}% ACOS`,
      severity: c.acos > 60 ? "critical" : "warning",
      metric: `${c.acos.toFixed(1)}%`,
      entity: c.name,
      recommendation: "Reduce budget, lower bids, or add negative keywords",
    });
  }

  // Low CTR keywords/search terms
  const lowCtr = searchTerms.filter(
    (t) => t.impressions > 500 && t.clicks / t.impressions < 0.003
  );
  for (const t of lowCtr.slice(0, 5)) {
    findings.push({
      type: AuditFindingType.LOW_CTR,
      title: `Low CTR: "${t.query}"`,
      description: `${t.impressions} impressions but only ${((t.clicks / t.impressions) * 100).toFixed(2)}% CTR`,
      severity: "warning",
      entity: t.query,
      recommendation: "Review ad copy, main image, and price competitiveness for this query",
    });
  }

  // Strong ROAS campaigns
  const strongRoas = campaigns.filter((c) => c.roas >= 4 && c.spend > 30);
  for (const c of strongRoas.slice(0, 5)) {
    findings.push({
      type: AuditFindingType.STRONG_ROAS,
      title: `Scale opportunity: ${c.name}`,
      description: `ROAS ${c.roas.toFixed(1)}x at ${c.acos.toFixed(1)}% ACOS with $${c.spend.toFixed(0)} spend`,
      severity: "positive",
      metric: `${c.roas.toFixed(1)}x ROAS`,
      entity: c.name,
      recommendation: "Increase daily budget and test bid increases by 10-20%",
    });
  }

  // SQP missed opportunities
  const sqpScale = sqpInsights.filter((s) => s.recommendedAction === "SCALE");
  for (const s of sqpScale.slice(0, 5)) {
    findings.push({
      type: AuditFindingType.SQP_MISSED_OPPORTUNITY,
      title: `SQP scale: "${s.query}"`,
      description: s.actionReason,
      severity: "info",
      entity: s.query,
      recommendation: "Create or increase PPC investment for this high-converting search query",
    });
  }

  // Product conversion issues
  if (metrics.cvr < 5 && metrics.clicks > 100) {
    findings.push({
      type: AuditFindingType.PRODUCT_CONVERSION,
      title: "Low overall conversion rate",
      description: `CVR is ${metrics.cvr.toFixed(1)}% across ${metrics.clicks} clicks`,
      severity: "warning",
      metric: `${metrics.cvr.toFixed(1)}%`,
      recommendation: "Audit listing quality: images, A+ content, reviews, price, and Buy Box status",
    });
  }

  return findings;
}

export async function createAuditReport(
  clientId: string,
  range: DateRange
) {
  const findings = await generateAuditFindings(clientId, range);
  const criticalCount = findings.filter((f) => f.severity === "critical").length;
  const warningCount = findings.filter((f) => f.severity === "warning").length;
  const positiveCount = findings.filter((f) => f.severity === "positive").length;

  const score = Math.max(
    0,
    Math.min(100, 70 - criticalCount * 15 - warningCount * 5 + positiveCount * 5)
  );

  const client = await prisma.client.findUnique({ where: { id: clientId } });

  return prisma.auditReport.create({
    data: {
      clientId,
      title: `Account Audit — ${client?.brandName ?? "Client"}`,
      summary: `Found ${findings.length} findings: ${criticalCount} critical, ${warningCount} warnings, ${positiveCount} opportunities.`,
      findings: findings as unknown as object,
      score,
      dateRange: {
        from: range.from.toISOString(),
        to: range.to.toISOString(),
      },
    },
  });
}
