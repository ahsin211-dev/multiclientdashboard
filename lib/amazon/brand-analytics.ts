import { normalizeSqpInsight } from "@/lib/analytics/sqp";

export async function syncSQPData(clientId: string) {
  return { clientId, entity: "sqpMetrics", synced: true, records: 12 };
}

export function analyzeSQPRow(row: {
  query: string;
  impressionShare: number;
  clickShare: number;
  cartAddShare: number;
  purchaseShare: number;
  ppcSpend: number;
  ppcClicks: number;
  ppcOrders: number;
  ppcSales: number;
  acos: number;
  roas: number;
}) {
  return normalizeSqpInsight(row);
}
