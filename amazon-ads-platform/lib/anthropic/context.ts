import { ClientContext, DateRange } from "@/lib/types";
import { getClientMetrics, getCampaignPerformance, getProductPerformance, getWastedSpend, getScalingOpportunities } from "@/lib/analytics/metrics";
import { getSQPInsights } from "@/lib/analytics/sqp";
import { db } from "@/lib/db";

export async function getClientContext(
  clientId: string,
  dateRange: DateRange
): Promise<ClientContext> {
  const [client, metrics, campaigns, products, sqp, wasted, scaling] =
    await Promise.all([
      db.client.findUnique({ where: { id: clientId } }),
      getClientMetrics(clientId, dateRange),
      getCampaignPerformance(clientId, dateRange),
      getProductPerformance(clientId, dateRange),
      getSQPInsights(clientId, dateRange),
      getWastedSpend(clientId, dateRange),
      getScalingOpportunities(clientId, dateRange),
    ]);

  if (!client) throw new Error(`Client ${clientId} not found`);

  return {
    client: {
      id: client.id,
      name: client.name,
      brandName: client.brandName,
      marketplace: client.marketplace,
    },
    dateRange,
    metrics,
    campaigns: campaigns.slice(0, 20),
    topProducts: products.slice(0, 10),
    sqpInsights: sqp.slice(0, 20),
    wastedSpend: wasted.total,
    scalingOpportunities: scaling,
  };
}

export function buildContextPrompt(context: ClientContext): string {
  const { client, metrics, campaigns, topProducts, sqpInsights, wastedSpend } = context;
  const fromDate = context.dateRange.from.toISOString().split("T")[0];
  const toDate = context.dateRange.to.toISOString().split("T")[0];

  return `## CLIENT CONTEXT

**Client:** ${client.brandName} (${client.name})
**Marketplace:** Amazon ${client.marketplace}
**Date Range:** ${fromDate} to ${toDate}

---

## AGGREGATE METRICS (${fromDate} → ${toDate})

| Metric | Value | vs Prior Period |
|--------|-------|-----------------|
| Total Ad Spend | $${metrics.spend.toLocaleString()} | ${metrics.spendChange !== undefined ? (metrics.spendChange > 0 ? "+" : "") + metrics.spendChange + "%" : "N/A"} |
| Ad Sales | $${metrics.sales.toLocaleString()} | ${metrics.salesChange !== undefined ? (metrics.salesChange > 0 ? "+" : "") + metrics.salesChange + "%" : "N/A"} |
| Total Revenue | $${metrics.revenue.toLocaleString()} | N/A |
| ACOS | ${metrics.acos}% | ${metrics.acosChange !== undefined ? (metrics.acosChange > 0 ? "+" : "") + metrics.acosChange.toFixed(1) + "pp" : "N/A"} |
| TACOS | ${metrics.tacos}% | N/A |
| ROAS | ${metrics.roas}x | N/A |
| Impressions | ${metrics.impressions.toLocaleString()} | ${metrics.impressionsChange !== undefined ? (metrics.impressionsChange > 0 ? "+" : "") + metrics.impressionsChange + "%" : "N/A"} |
| Clicks | ${metrics.clicks.toLocaleString()} | ${metrics.clicksChange !== undefined ? (metrics.clicksChange > 0 ? "+" : "") + metrics.clicksChange + "%" : "N/A"} |
| CTR | ${metrics.ctr}% | N/A |
| CPC | $${metrics.cpc} | N/A |
| CVR | ${metrics.cvr}% | N/A |
| Orders | ${metrics.orders.toLocaleString()} | ${metrics.ordersChange !== undefined ? (metrics.ordersChange > 0 ? "+" : "") + metrics.ordersChange + "%" : "N/A"} |

**Estimated Wasted Spend:** $${wastedSpend.toLocaleString()}

---

## TOP CAMPAIGNS (by spend)

${campaigns
  .sort((a, b) => b.spend - a.spend)
  .slice(0, 10)
  .map(
    (c) =>
      `- **${c.name}** | Type: ${c.type} | State: ${c.state} | Spend: $${c.spend.toLocaleString()} | Sales: $${c.sales.toLocaleString()} | ACOS: ${c.acos}% | ROAS: ${c.roas}x | CTR: ${c.ctr}% | CVR: ${c.cvr}%`
  )
  .join("\n")}

---

## TOP PRODUCTS (by revenue)

${topProducts
  .sort((a, b) => b.revenue - a.revenue)
  .slice(0, 8)
  .map(
    (p) =>
      `- **${p.asin}** ${p.title.slice(0, 50)}... | Revenue: $${p.revenue.toLocaleString()} | Units: ${p.units} | CVR: ${p.cvr}% | Ad Spend: $${p.adSpend.toLocaleString()} | ACOS: ${p.acos}% | TACOS: ${p.tacos}%`
  )
  .join("\n")}

---

## SEARCH QUERY PERFORMANCE (SQP)

${sqpInsights
  .slice(0, 10)
  .map(
    (s) =>
      `- Query: "${s.query}" | Imp Share: ${s.impressionShare}% | Click Share: ${s.clickShare}% | Purchase Share: ${s.purchaseShare}% | PPC Spend: $${s.ppcSpend} | ACOS: ${s.acos}% | Action: **${s.action}**`
  )
  .join("\n")}

---

Use only this data to answer the question. If you need data not provided above, say so explicitly.`;
}
