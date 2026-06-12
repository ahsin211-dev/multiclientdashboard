import { SQPAction } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import type { DateRange, SQPInsight } from "./types";

interface ActionRecommendation {
  action: SQPAction;
  reason: string;
}

function recommendSQPAction(metric: {
  impressionShare: number | null;
  clickShare: number | null;
  purchaseShare: number | null;
  ppcSpend: number;
  ppcSales: number;
  ppcAcos: number | null;
}): ActionRecommendation {
  const impressionShare = metric.impressionShare ?? 0;
  const clickShare = metric.clickShare ?? 0;
  const purchaseShare = metric.purchaseShare ?? 0;
  const ppcSpend = metric.ppcSpend;
  const ppcAcos = metric.ppcAcos ?? 0;
  const ppcRoas = ppcSpend > 0 ? metric.ppcSales / ppcSpend : 0;

  // Scale: high purchase share, low PPC spend, strong conversion
  if (purchaseShare >= 15 && ppcSpend < 100 && ppcRoas >= 3) {
    return {
      action: SQPAction.SCALE,
      reason: `High purchase share (${purchaseShare.toFixed(1)}%) with low PPC investment ($${ppcSpend.toFixed(0)}) and strong ROAS (${ppcRoas.toFixed(1)}x)`,
    };
  }

  // Cut: high spend, low purchase share, poor ACOS
  if (ppcSpend >= 200 && purchaseShare < 5 && ppcAcos > 40) {
    return {
      action: SQPAction.CUT,
      reason: `High spend ($${ppcSpend.toFixed(0)}) with low purchase share (${purchaseShare.toFixed(1)}%) and ACOS ${ppcAcos.toFixed(1)}%`,
    };
  }

  // Test: high impression share, low click share
  if (impressionShare >= 20 && clickShare < 5) {
    return {
      action: SQPAction.TEST,
      reason: `High impression share (${impressionShare.toFixed(1)}%) but low click share (${clickShare.toFixed(1)}%) — improve listing/creative`,
    };
  }

  // Defend: strong organic/SQP share, competitors likely bidding
  if (purchaseShare >= 10 && impressionShare >= 15 && ppcSpend < 50) {
    return {
      action: SQPAction.DEFEND,
      reason: `Strong organic position (${purchaseShare.toFixed(1)}% purchase share) — competitors may be bidding; protect with PPC`,
    };
  }

  return {
    action: SQPAction.MONITOR,
    reason: "Performance within normal range — continue monitoring",
  };
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
  });

  // Aggregate by query
  const grouped = new Map<
    string,
    {
      impressionShare: number;
      clickShare: number;
      purchaseShare: number;
      ppcSpend: number;
      ppcSales: number;
      ppcAcos: number;
      count: number;
      id: string;
    }
  >();

  for (const m of metrics) {
    const existing = grouped.get(m.query);
    if (existing) {
      existing.impressionShare += m.impressionShare ?? 0;
      existing.clickShare += m.clickShare ?? 0;
      existing.purchaseShare += m.purchaseShare ?? 0;
      existing.ppcSpend += m.ppcSpend;
      existing.ppcSales += m.ppcSales;
      existing.ppcAcos += m.ppcAcos ?? 0;
      existing.count += 1;
    } else {
      grouped.set(m.query, {
        id: m.id,
        impressionShare: m.impressionShare ?? 0,
        clickShare: m.clickShare ?? 0,
        purchaseShare: m.purchaseShare ?? 0,
        ppcSpend: m.ppcSpend,
        ppcSales: m.ppcSales,
        ppcAcos: m.ppcAcos ?? 0,
        count: 1,
      });
    }
  }

  return Array.from(grouped.entries())
    .map(([query, data]) => {
      const avg = {
        impressionShare: data.impressionShare / data.count,
        clickShare: data.clickShare / data.count,
        purchaseShare: data.purchaseShare / data.count,
        ppcSpend: data.ppcSpend,
        ppcSales: data.ppcSales,
        ppcAcos: data.ppcSpend > 0 && data.ppcSales > 0
          ? (data.ppcSpend / data.ppcSales) * 100
          : data.ppcAcos / data.count,
      };

      const recommendation = recommendSQPAction(avg);

      return {
        id: data.id,
        query,
        impressionShare: avg.impressionShare,
        clickShare: avg.clickShare,
        purchaseShare: avg.purchaseShare,
        ppcSpend: avg.ppcSpend,
        ppcSales: avg.ppcSales,
        ppcAcos: avg.ppcAcos,
        recommendedAction: recommendation.action,
        actionReason: recommendation.reason,
      };
    })
    .sort((a, b) => b.impressionShare - a.impressionShare);
}

export async function updateSQPRecommendations(clientId: string): Promise<void> {
  const metrics = await prisma.sQPMetric.findMany({
    where: { clientId },
  });

  for (const metric of metrics) {
    const recommendation = recommendSQPAction(metric);
    await prisma.sQPMetric.update({
      where: { id: metric.id },
      data: {
        recommendedAction: recommendation.action,
        actionReason: recommendation.reason,
      },
    });
  }
}
