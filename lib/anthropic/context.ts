import { prisma } from "@/lib/db/prisma";
import type { DateRange } from "@/lib/analytics/types";
import {
  getMetricsWithComparison,
  getCampaignPerformance,
  getProductPerformance,
  getSearchTerms,
} from "@/lib/analytics/service";
import {
  getWastedSpend,
  getScalingOpportunities,
  getHighAcosCampaigns,
  getLowCtrKeywords,
  getProductConversionIssues,
} from "@/lib/analytics/insights";
import { analyzeSqp } from "@/lib/sqp/analyzer";
import { formatPercent } from "@/lib/utils";

/**
 * Builds the grounded data context handed to Claude. This is the ONLY source of
 * truth the model is allowed to use. We keep it compact but complete, and we
 * mark sections that have no data so the model can say "data is missing".
 */
export async function getClientContext(clientId: string, range: DateRange) {
  const client = await prisma.client.findUnique({
    where: { id: clientId },
    select: {
      id: true,
      brandName: true,
      marketplace: true,
      currency: true,
      syncStatus: true,
      lastSyncedAt: true,
    },
  });

  if (!client) {
    return { error: "Client not found", clientId };
  }

  const [
    metrics,
    campaigns,
    products,
    searchTerms,
    wastedSpend,
    scaling,
    highAcos,
    lowCtr,
    productIssues,
    sqp,
  ] = await Promise.all([
    getMetricsWithComparison(clientId, range),
    getCampaignPerformance(clientId, range),
    getProductPerformance(clientId, range),
    getSearchTerms(clientId, range, 25),
    getWastedSpend(clientId, range),
    getScalingOpportunities(clientId, range),
    getHighAcosCampaigns(clientId, range),
    getLowCtrKeywords(clientId, range),
    getProductConversionIssues(clientId, range),
    analyzeSqp(clientId, range),
  ]);

  return {
    client: {
      name: client.brandName,
      marketplace: client.marketplace,
      currency: client.currency,
      syncStatus: client.syncStatus,
      lastSyncedAt: client.lastSyncedAt,
    },
    dateRange: {
      from: range.from.toISOString().slice(0, 10),
      to: range.to.toISOString().slice(0, 10),
    },
    dataAvailability: {
      hasCampaigns: campaigns.length > 0,
      hasProducts: products.length > 0,
      hasSearchTerms: searchTerms.length > 0,
      hasSqp: sqp.length > 0,
      hasAdSpend: metrics.current.spend > 0,
    },
    kpis: {
      current: metrics.current,
      previous: metrics.previous,
      changeVsPrevious: Object.fromEntries(
        Object.entries(metrics.delta).map(([k, v]) => [k, formatPercent(v)])
      ),
    },
    topCampaigns: campaigns.slice(0, 15),
    topProducts: products.slice(0, 15),
    topSearchTerms: searchTerms,
    sqpInsights: sqp.slice(0, 25),
    wastedSpend: wastedSpend.slice(0, 20),
    scalingOpportunities: scaling.slice(0, 15),
    highAcosCampaigns: highAcos,
    lowCtrKeywords: lowCtr.slice(0, 15),
    productConversionIssues: productIssues,
  };
}

export type ClientContext = Awaited<ReturnType<typeof getClientContext>>;
