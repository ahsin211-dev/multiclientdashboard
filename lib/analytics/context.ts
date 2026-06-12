import { prisma } from "@/lib/db/prisma";
import { getPerformanceSummary } from "@/lib/analytics/performance";
import { getSQPInsights, getScalingOpportunities, getWastedSpend } from "@/lib/analytics/sqp";

export async function getClientContext(clientId: string, preset: "last7" | "last30" = "last30") {
  const [client, summary, sqpInsights, wastedSpend, scaling] = await Promise.all([
    prisma.client.findUnique({
      where: { id: clientId },
      include: {
        campaigns: true,
        products: true
      }
    }),
    getPerformanceSummary(clientId, preset),
    getSQPInsights(clientId, 25),
    getWastedSpend(clientId),
    getScalingOpportunities(clientId)
  ]);

  if (!client) {
    return null;
  }

  return {
    client: {
      id: client.id,
      brandName: client.brandName,
      marketplace: client.marketplace,
      syncStatus: client.syncStatus,
      lastSyncDate: client.lastSyncDate,
      campaignCount: client.campaigns.length,
      productCount: client.products.length
    },
    summary,
    sqpInsights,
    wastedSpend,
    scaling
  };
}
