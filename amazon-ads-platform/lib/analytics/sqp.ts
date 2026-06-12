import { db } from "@/lib/db";
import { DateRange, SQPRow } from "@/lib/types";
import { generateSQPData } from "@/lib/mock-data";

function classifyAction(row: {
  purchaseShare: number;
  clickShare: number;
  impressionShare: number;
  ppcSpend: number;
  acos: number;
}): { action: SQPRow["action"]; reason: string } {
  if (row.purchaseShare > 8 && row.ppcSpend < 500) {
    return {
      action: "SCALE",
      reason: "High purchase share with low PPC investment — scale budgets to capture more volume.",
    };
  }
  if (row.acos > 50 && row.purchaseShare < 3) {
    return {
      action: "CUT",
      reason: "High ACOS with minimal purchase share — pause or reduce bids to stop budget drain.",
    };
  }
  if (row.impressionShare > 20 && row.clickShare < 5) {
    return {
      action: "TEST",
      reason: "High impressions but low CTR — improve title, main image, or price to increase clicks.",
    };
  }
  if (row.purchaseShare > 6 && row.ppcSpend < 300) {
    return {
      action: "DEFEND",
      reason: "Strong organic purchase share — increase PPC coverage to defend against competitors.",
    };
  }
  return {
    action: "MONITOR",
    reason: "Moderate performance — track for 2 more weeks before taking action.",
  };
}

export async function getSQPInsights(
  clientId: string,
  dateRange: DateRange
): Promise<SQPRow[]> {
  const dbMetrics = await db.sQPMetric.findMany({
    where: {
      clientId,
      date: { gte: dateRange.from, lte: dateRange.to },
    },
    orderBy: { ppcSpend: "desc" },
    take: 100,
  });

  if (dbMetrics.length > 0) {
    return dbMetrics.map((m) => {
      const { action, reason } = classifyAction({
        purchaseShare: m.purchaseShare ?? 0,
        clickShare: m.clickShare ?? 0,
        impressionShare: m.impressionShare ?? 0,
        ppcSpend: m.ppcSpend,
        acos: m.acos ?? 0,
      });
      return {
        id: m.id,
        query: m.query,
        impressionShare: m.impressionShare ?? 0,
        clickShare: m.clickShare ?? 0,
        cartAddShare: m.cartAddShare ?? 0,
        purchaseShare: m.purchaseShare ?? 0,
        ppcSpend: m.ppcSpend,
        ppcSales: m.ppcSales,
        ppcClicks: m.ppcClicks,
        ppcOrders: m.ppcOrders,
        acos: m.acos ?? 0,
        roas: m.roas ?? 0,
        action,
        reason,
      };
    });
  }

  return generateSQPData();
}
