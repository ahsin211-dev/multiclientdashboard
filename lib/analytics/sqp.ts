import { prisma } from "@/lib/db/prisma";
import type { DateRange, SQPInsight } from "@/lib/types";
import { SQPAction } from "@prisma/client";

function determineAction(metric: {
  impressionShare: number;
  clickShare: number;
  purchaseShare: number;
  ppcSpend: number;
  acos: number;
  roas: number;
}): { action: SQPAction; reason: string } {
  const { impressionShare, clickShare, purchaseShare, ppcSpend, acos, roas } = metric;

  if (purchaseShare >= 15 && ppcSpend < 50 && roas > 3) {
    return {
      action: SQPAction.SCALE,
      reason: "High purchase share with low PPC investment and strong ROAS",
    };
  }

  if (ppcSpend > 200 && purchaseShare < 5 && acos > 40) {
    return {
      action: SQPAction.CUT,
      reason: "High spend with low purchase share and poor ACOS",
    };
  }

  if (impressionShare > 20 && clickShare < 5) {
    return {
      action: SQPAction.TEST,
      reason: "High impression share but low click share — optimize listing/creative",
    };
  }

  if (purchaseShare > 10 && impressionShare > 15 && ppcSpend < 100) {
    return {
      action: SQPAction.DEFEND,
      reason: "Strong organic share — competitors likely bidding, protect position",
    };
  }

  return { action: SQPAction.MONITOR, reason: "Performance within normal range" };
}

export async function getSQPInsights(
  clientId: string,
  range: DateRange
): Promise<SQPInsight[]> {
  const metrics = await prisma.sQPMetric.findMany({
    where: {
      clientId,
      date: { gte: range.from, lte: range.to },
    },
    orderBy: { impressionShare: "desc" },
    take: 100,
  });

  const grouped = new Map<string, typeof metrics>();
  for (const m of metrics) {
    const existing = grouped.get(m.query) ?? [];
    existing.push(m);
    grouped.set(m.query, existing);
  }

  const insights: SQPInsight[] = [];

  for (const [query, rows] of grouped) {
    const avg = rows.reduce(
      (acc, r) => ({
        impressionShare: acc.impressionShare + r.impressionShare,
        clickShare: acc.clickShare + r.clickShare,
        purchaseShare: acc.purchaseShare + r.purchaseShare,
        ppcSpend: acc.ppcSpend + r.ppcSpend,
        ppcSales: acc.ppcSales + r.ppcSales,
        acos: acc.acos + r.acos,
        roas: acc.roas + r.roas,
      }),
      {
        impressionShare: 0,
        clickShare: 0,
        purchaseShare: 0,
        ppcSpend: 0,
        ppcSales: 0,
        acos: 0,
        roas: 0,
      }
    );

    const count = rows.length;
    const aggregated = {
      impressionShare: avg.impressionShare / count,
      clickShare: avg.clickShare / count,
      purchaseShare: avg.purchaseShare / count,
      ppcSpend: avg.ppcSpend,
      ppcSales: avg.ppcSales,
      acos: avg.acos / count,
      roas: avg.roas / count,
    };

    const { action, reason } = determineAction(aggregated);

    insights.push({
      query,
      impressionShare: aggregated.impressionShare,
      clickShare: aggregated.clickShare,
      purchaseShare: aggregated.purchaseShare,
      ppcSpend: aggregated.ppcSpend,
      ppcSales: aggregated.ppcSales,
      acos: aggregated.acos,
      recommendedAction: action,
      reason,
    });
  }

  return insights.sort((a, b) => b.impressionShare - a.impressionShare);
}

export async function getWastedSpend(clientId: string, range: DateRange) {
  const terms = await getSQPInsights(clientId, range);
  return terms
    .filter((t) => t.recommendedAction === "CUT" || (t.ppcSpend > 100 && t.acos > 35))
    .map((t) => ({
      query: t.query,
      spend: t.ppcSpend,
      sales: t.ppcSales,
      acos: t.acos,
    }))
    .sort((a, b) => b.spend - a.spend);
}

export async function getScalingOpportunities(clientId: string, range: DateRange) {
  const terms = await getSQPInsights(clientId, range);
  return terms.filter(
    (t) => t.recommendedAction === "SCALE" || t.recommendedAction === "DEFEND"
  );
}
