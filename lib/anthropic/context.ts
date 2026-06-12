import { prisma } from "@/lib/db/prisma";
import { getMetricsWithComparison } from "@/lib/analytics/metrics";
import { getSQPInsights } from "@/lib/analytics/sqp";
import {
  getPerformanceSummary,
  getScalingOpportunities,
  getWastedSpend,
} from "@/lib/analytics/insights";
import type { DateRange } from "@/lib/analytics/types";
import { getCampaignPerformance, getSearchTermPerformance } from "@/lib/analytics/metrics";

export async function getClientContext(
  clientId: string,
  dateRange: DateRange
): Promise<string> {
  const client = await prisma.client.findUnique({
    where: { id: clientId },
    include: {
      connections: true,
      adAccounts: true,
    },
  });

  if (!client) {
    return JSON.stringify({ error: "Client not found" });
  }

  const [
    metrics,
    campaigns,
    searchTerms,
    sqpInsights,
    wastedSpend,
    scaling,
    summary,
  ] = await Promise.all([
    getMetricsWithComparison(clientId, dateRange),
    getCampaignPerformance(clientId, dateRange),
    getSearchTermPerformance(clientId, dateRange),
    getSQPInsights(clientId, dateRange),
    getWastedSpend(clientId, dateRange),
    getScalingOpportunities(clientId, dateRange),
    getPerformanceSummary(clientId, dateRange),
  ]);

  const context = {
    client: {
      brandName: client.brandName,
      marketplace: client.marketplace,
      syncStatus: client.syncStatus,
      lastSyncAt: client.lastSyncAt,
      hasAdsConnection: client.connections.some(
        (c) => c.type === "AMAZON_ADS" && c.status === "CONNECTED"
      ),
      hasSpApiConnection: client.connections.some(
        (c) => c.type === "SP_API" && c.status === "CONNECTED"
      ),
    },
    dateRange: {
      from: dateRange.from.toISOString().split("T")[0],
      to: dateRange.to.toISOString().split("T")[0],
    },
    metrics: {
      current: metrics,
      changes: metrics.changes,
    },
    topCampaigns: campaigns.slice(0, 15),
    topSearchTerms: searchTerms.slice(0, 15),
    sqpInsights: sqpInsights.slice(0, 20),
    wastedSpend: wastedSpend.slice(0, 15),
    scalingOpportunities: scaling.slice(0, 15),
    summary,
    dataAvailability: {
      campaigns: campaigns.length,
      searchTerms: searchTerms.length,
      sqpQueries: sqpInsights.length,
      hasSqpData: summary.sqpDataAvailable,
    },
  };

  return JSON.stringify(context, null, 2);
}
