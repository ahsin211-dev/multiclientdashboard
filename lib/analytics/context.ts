import { prisma } from "@/lib/db/prisma";
import type { ClientContext, DateRange } from "@/lib/types";
import {
  getCampaignPerformance,
  getDashboardMetrics,
  getProductPerformance,
  getSearchTermPerformance,
} from "./metrics";
import { getScalingOpportunities, getSQPInsights, getWastedSpend } from "./sqp";

export async function getClientContext(
  clientId: string,
  dateRange: DateRange
): Promise<ClientContext> {
  const days =
    Math.ceil((dateRange.to.getTime() - dateRange.from.getTime()) / 86400000) + 1;
  const previousFrom = new Date(dateRange.from);
  previousFrom.setDate(previousFrom.getDate() - days);
  const previousTo = new Date(dateRange.from);
  previousTo.setDate(previousTo.getDate() - 1);

  const client = await prisma.client.findUniqueOrThrow({
    where: { id: clientId },
    include: {
      connections: true,
      _count: {
        select: {
          campaigns: true,
          products: true,
          sqpMetrics: true,
          adMetrics: true,
        },
      },
    },
  });

  const dataGaps: string[] = [];
  if (client._count.campaigns === 0) dataGaps.push("No campaign data synced");
  if (client._count.products === 0) dataGaps.push("No product catalog data");
  if (client._count.sqpMetrics === 0) dataGaps.push("No Search Query Performance data");
  if (!client.connections.some((c) => c.status === "CONNECTED")) {
    dataGaps.push("Amazon account not fully connected");
  }

  const [
    metrics,
    campaigns,
    products,
    searchTerms,
    sqpInsights,
    wastedSpend,
    scalingOpportunities,
  ] = await Promise.all([
    getDashboardMetrics(clientId, dateRange, { from: previousFrom, to: previousTo }),
    getCampaignPerformance(clientId, dateRange),
    getProductPerformance(clientId, dateRange),
    getSearchTermPerformance(clientId, dateRange),
    getSQPInsights(clientId, dateRange),
    getWastedSpend(clientId, dateRange),
    getScalingOpportunities(clientId, dateRange),
  ]);

  return {
    client: {
      id: client.id,
      brandName: client.brandName,
      marketplace: client.marketplace,
      lastSyncAt: client.lastSyncAt?.toISOString() ?? null,
    },
    dateRange: {
      from: dateRange.from.toISOString().split("T")[0],
      to: dateRange.to.toISOString().split("T")[0],
    },
    metrics,
    campaigns,
    products,
    searchTerms,
    sqpInsights: sqpInsights.slice(0, 20),
    wastedSpend: wastedSpend.slice(0, 15),
    scalingOpportunities: scalingOpportunities.slice(0, 15),
    dataGaps,
  };
}
