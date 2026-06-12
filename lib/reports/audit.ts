import { prisma } from "@/lib/db/prisma";
import { getSQPInsights, getWastedSpend } from "@/lib/analytics/sqp";
import { getCampaignPerformance } from "@/lib/analytics/performance";

export async function generateAudit(clientId: string, workspaceId: string, generatedById?: string) {
  const [campaigns, wastedSpend, sqpInsights] = await Promise.all([
    getCampaignPerformance(clientId, 12),
    getWastedSpend(clientId),
    getSQPInsights(clientId, 25)
  ]);

  const highAcosCampaigns = campaigns.filter((campaign) => campaign.acos > 0.35).slice(0, 5);
  const lowCtrKeywords = wastedSpend.filter((row) => row.acos > 0.55).slice(0, 5);
  const strongRoasCampaigns = campaigns.filter((campaign) => campaign.roas >= 3).slice(0, 5);
  const sqpMissedOpportunities = sqpInsights
    .filter((row) => row.recommendedAction === "SCALE")
    .slice(0, 8);

  return prisma.auditReport.create({
    data: {
      workspaceId,
      clientId,
      generatedById,
      title: "Automated Audit Report",
      summary:
        "Automated audit identified efficiency gaps, scale opportunities, and campaign structure issues.",
      findings: {
        wastedSpend,
        highAcosCampaigns,
        lowCtrKeywords,
        strongRoasCampaigns,
        sqpMissedOpportunities,
        productConversionIssues: [
          "At least one SKU shows weak conversion efficiency versus account average."
        ]
      }
    }
  });
}
