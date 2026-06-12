import { prisma } from "@/lib/db/prisma";

/**
 * Recalculate derived metrics (ACOS, ROAS, CTR, CPC, CVR) on ad metrics
 * after raw data sync from Amazon APIs.
 */
export async function normalizeMetrics(clientId: string): Promise<void> {
  const adMetrics = await prisma.adMetric.findMany({
    where: { clientId },
  });

  for (const metric of adMetrics) {
    const acos = metric.sales > 0 ? (metric.spend / metric.sales) * 100 : null;
    const roas = metric.spend > 0 ? metric.sales / metric.spend : null;
    const ctr =
      metric.impressions > 0
        ? (metric.clicks / metric.impressions) * 100
        : null;
    const cpc = metric.clicks > 0 ? metric.spend / metric.clicks : null;
    const cvr =
      metric.clicks > 0 ? (metric.orders / metric.clicks) * 100 : null;

    await prisma.adMetric.update({
      where: { id: metric.id },
      data: { acos, roas, ctr, cpc, cvr },
    });
  }

  const salesMetrics = await prisma.salesMetric.findMany({
    where: { clientId },
  });

  for (const metric of salesMetrics) {
    const conversionRate =
      metric.sessions > 0 ? (metric.orders / metric.sessions) * 100 : null;

    await prisma.salesMetric.update({
      where: { id: metric.id },
      data: { conversionRate },
    });
  }
}
