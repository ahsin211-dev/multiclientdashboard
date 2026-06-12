import { getDashboardData } from "@/lib/analytics/dashboard";
import type {
  CampaignPerformance,
  ClientContext,
  DateRangeKey,
  MetricComparison,
  SearchTermPerformance,
  SqpInsight,
} from "@/lib/analytics/types";

export async function getPerformanceSummary(clientId: string, range: DateRangeKey = "30d"): Promise<MetricComparison> {
  const data = await getDashboardData(clientId, range);
  return data.summary;
}

export async function getSQPInsights(clientId: string, range: DateRangeKey = "30d"): Promise<SqpInsight[]> {
  const data = await getDashboardData(clientId, range);
  return data.sqpInsights;
}

export async function getWastedSpend(clientId: string, range: DateRangeKey = "30d"): Promise<SearchTermPerformance[]> {
  const data = await getDashboardData(clientId, range);
  return data.searchTerms
    .filter((term) => term.spend > 250 && (term.acos > 45 || term.orders < 5))
    .sort((a, b) => b.spend - a.spend)
    .slice(0, 10);
}

export async function getScalingOpportunities(clientId: string, range: DateRangeKey = "30d"): Promise<CampaignPerformance[]> {
  const data = await getDashboardData(clientId, range);
  return data.campaigns
    .filter((campaign) => campaign.roas >= 4 && campaign.acos <= 25)
    .sort((a, b) => b.roas - a.roas)
    .slice(0, 10);
}

export async function getClientContext(clientId: string, range: DateRangeKey = "30d"): Promise<ClientContext> {
  const data = await getDashboardData(clientId, range);
  return {
    client: data.client,
    summary: data.summary,
    campaigns: data.campaigns,
    products: data.products,
    sqpInsights: data.sqpInsights,
    wastedSpend: await getWastedSpend(clientId, range),
    scalingOpportunities: await getScalingOpportunities(clientId, range),
    dateRange: {
      from: data.range.from.toISOString(),
      to: data.range.to.toISOString(),
    },
  };
}
