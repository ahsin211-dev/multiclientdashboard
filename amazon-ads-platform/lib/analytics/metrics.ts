import { db } from "@/lib/db";
import { DateRange, MetricSummary, CampaignPerformance, ProductPerformance } from "@/lib/types";
import { generateMetricSummary, generateCampaigns, generateProducts, generateChartData } from "@/lib/mock-data";

export async function getClientMetrics(
  clientId: string,
  dateRange: DateRange
): Promise<MetricSummary> {
  // When real Amazon data is available, query AdMetric and SalesMetric tables.
  // For MVP, return mock data enriched with real DB structure awareness.
  return generateMetricSummary();
}

export async function getCampaignPerformance(
  clientId: string,
  dateRange: DateRange
): Promise<CampaignPerformance[]> {
  // Production: aggregate AdMetric grouped by campaignId
  const dbCampaigns = await db.campaign.findMany({
    where: { clientId },
    take: 20,
    orderBy: { createdAt: "desc" },
  });

  if (dbCampaigns.length > 0) {
    // Return real campaigns with mock metric overlay until sync runs
    return dbCampaigns.map((c, i) => {
      const mock = generateCampaigns()[i % 12];
      return {
        ...mock,
        id: c.id,
        name: c.name,
        type: c.campaignType,
        state: c.state,
        budget: c.dailyBudget,
      };
    });
  }

  return generateCampaigns();
}

export async function getProductPerformance(
  clientId: string,
  dateRange: DateRange
): Promise<ProductPerformance[]> {
  // Production: join Product + SalesMetric + AdMetric
  const dbProducts = await db.product.findMany({
    where: { clientId },
    take: 10,
  });

  if (dbProducts.length > 0) {
    return dbProducts.map((p, i) => {
      const mock = generateProducts()[i % 8];
      return { ...mock, asin: p.asin, title: p.title ?? mock.title };
    });
  }

  return generateProducts();
}

export async function getDailyChartData(clientId: string, days = 30) {
  // Production: group AdMetric by date
  return generateChartData(days);
}

export async function getWastedSpend(clientId: string, dateRange: DateRange) {
  const campaigns = await getCampaignPerformance(clientId, dateRange);
  const wasted = campaigns
    .filter((c) => c.acos > 40 || (c.clicks > 100 && c.orders === 0))
    .reduce((sum, c) => sum + c.spend, 0);

  return {
    total: wasted,
    campaigns: campaigns
      .filter((c) => c.acos > 40)
      .map((c) => ({
        name: c.name,
        spend: c.spend,
        acos: c.acos,
        reason: `ACOS ${c.acos}% exceeds 40% target`,
      })),
  };
}

export async function getScalingOpportunities(clientId: string, dateRange: DateRange) {
  const campaigns = await getCampaignPerformance(clientId, dateRange);
  return campaigns
    .filter((c) => c.acos < 15 && c.roas > 6 && c.spend < c.budget * 0.8)
    .map((c) => ({
      type: "campaign",
      name: c.name,
      recommendation: `Increase daily budget by 30% — ACOS is ${c.acos}%, ROAS ${c.roas}x`,
      potentialImpact: `+$${Math.round(c.sales * 0.3)}/mo estimated additional sales`,
    }));
}
