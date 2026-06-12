import { Prisma } from "@prisma/client";

import { prisma } from "@/lib/db/prisma";

function decimalToNumber(value: Prisma.Decimal | number) {
  return typeof value === "number" ? value : value.toNumber();
}

export async function getSQPInsights(clientId: string, limit = 40) {
  const rows = await prisma.sQPMetric.findMany({
    where: { clientId },
    orderBy: [{ date: "desc" }, { ppcSpend: "desc" }],
    take: limit
  });

  return rows.map((row) => ({
    id: row.id,
    query: row.query,
    impressionShare: decimalToNumber(row.impressionShare),
    clickShare: decimalToNumber(row.clickShare),
    purchaseShare: decimalToNumber(row.purchaseShare),
    ppcSpend: decimalToNumber(row.ppcSpend),
    ppcSales: decimalToNumber(row.ppcSales),
    acos: decimalToNumber(row.acos),
    roas: decimalToNumber(row.roas),
    recommendedAction: row.recommendedAction,
    reason: row.actionReason
  }));
}

export async function getWastedSpend(clientId: string) {
  const rows = await prisma.searchTerm.findMany({
    where: {
      clientId,
      acos: { gt: 0.45 }
    },
    orderBy: { spend: "desc" },
    take: 10
  });

  return rows.map((row) => ({
    query: row.query,
    spend: decimalToNumber(row.spend),
    sales: decimalToNumber(row.sales),
    acos: decimalToNumber(row.acos)
  }));
}

export async function getScalingOpportunities(clientId: string) {
  const rows = await prisma.sQPMetric.findMany({
    where: {
      clientId,
      purchaseShare: { gt: 0.08 },
      ppcSpend: { lt: 50 },
      roas: { gt: 2.8 }
    },
    orderBy: [{ purchaseShare: "desc" }, { roas: "desc" }],
    take: 10
  });

  return rows.map((row) => ({
    query: row.query,
    purchaseShare: decimalToNumber(row.purchaseShare),
    ppcSpend: decimalToNumber(row.ppcSpend),
    roas: decimalToNumber(row.roas)
  }));
}
