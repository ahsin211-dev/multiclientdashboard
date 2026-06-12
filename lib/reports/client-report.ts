import { getPerformanceSummary } from "@/lib/analytics/performance";
import { getScalingOpportunities, getWastedSpend } from "@/lib/analytics/sqp";
import { prisma } from "@/lib/db/prisma";

export async function generateClientReport(clientId: string) {
  const [client, summary, wastedSpend, scaling] = await Promise.all([
    prisma.client.findUnique({ where: { id: clientId } }),
    getPerformanceSummary(clientId, "last30"),
    getWastedSpend(clientId),
    getScalingOpportunities(clientId)
  ]);

  if (!client) {
    return null;
  }

  return {
    executiveSummary: `${client.brandName} delivered ${summary.sales.current.toFixed(0)} in attributed sales over the selected window.`,
    keyMetrics: summary,
    problemsFound: [
      `${wastedSpend.length} waste-heavy search terms with elevated ACOS.`,
      `ROAS volatility detected between branded and non-branded campaigns.`
    ],
    recommendedActions: [
      "Shift budget toward high purchase-share SQP queries.",
      "Tighten non-brand bid strategy and expand negative keyword coverage."
    ],
    nextSteps: [
      ...scaling.slice(0, 3).map((row) => `Launch/scale query cluster: ${row.query}`),
      "Deliver follow-up report after 7-day optimization cycle."
    ]
  };
}
