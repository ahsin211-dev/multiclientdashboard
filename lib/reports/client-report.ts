import { getDashboardData } from "@/lib/analytics/dashboard";
import type { ClientReport } from "@/lib/analytics/types";
import { generateAuditFindings } from "@/lib/reports/audit";

export async function generateClientReport(clientId: string): Promise<ClientReport> {
  const [data, findings] = await Promise.all([getDashboardData(clientId), generateAuditFindings(clientId)]);
  const highSeverity = findings.filter((finding) => finding.severity === "high");

  return {
    executiveSummary: `${data.client.brandName} generated $${Math.round(data.summary.sales).toLocaleString()} in ad-attributed sales at ${data.summary.acos.toFixed(1)}% ACOS. The highest-impact opportunities are wasted-spend cleanup, budget reallocation, and SQP expansion.`,
    keyMetrics: data.summary,
    problemsFound: findings.slice(0, 6).map((finding) => finding.finding),
    recommendedActions: findings.slice(0, 6).map((finding) => finding.recommendation),
    nextSteps: [
      highSeverity.length ? "Address high-severity wasted spend before increasing account budget." : "Confirm target ACOS and scale profitable segments.",
      "Approve campaign restructuring and SQP test budget.",
      "Review results after the next seven days of data.",
    ],
  };
}
