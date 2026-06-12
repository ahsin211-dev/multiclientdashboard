import Anthropic from "@anthropic-ai/sdk";
import type { ClientContext } from "@/lib/types";

const SYSTEM_PROMPT = `You are an Amazon Ads strategist. Use only the provided client data. If data is missing, say so. Give practical, prioritized recommendations with numbers.

Rules:
- Never invent metrics, campaigns, keywords, or products not in the context
- Cite specific numbers from the data when making recommendations
- If dataGaps array has items, mention what data is unavailable
- Prioritize recommendations by impact (high spend issues first)
- Format responses with clear sections and bullet points
- For ACOS/TACOS/ROAS questions, use the exact values provided`;

export function getAnthropicClient() {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error("ANTHROPIC_API_KEY is not configured");
  }
  return new Anthropic({ apiKey });
}

export function buildContextMessage(context: ClientContext): string {
  return `CLIENT DATA CONTEXT (use only this data):

Brand: ${context.client.brandName}
Marketplace: ${context.client.marketplace}
Date Range: ${context.dateRange.from} to ${context.dateRange.to}
Last Sync: ${context.client.lastSyncAt ?? "Never"}

METRICS:
- Ad Spend: $${context.metrics.adSpend.value.toFixed(2)} (${context.metrics.adSpend.delta?.toFixed(1)}% vs prior)
- Revenue: $${context.metrics.revenue.value.toFixed(2)}
- ACOS: ${context.metrics.acos.value.toFixed(1)}%
- TACOS: ${context.metrics.tacos.value.toFixed(1)}%
- ROAS: ${context.metrics.roas.value.toFixed(2)}x
- Impressions: ${context.metrics.impressions.value}
- Clicks: ${context.metrics.clicks.value}
- CTR: ${context.metrics.ctr.value.toFixed(2)}%
- CPC: $${context.metrics.cpc.value.toFixed(2)}
- CVR: ${context.metrics.cvr.value.toFixed(2)}%
- Orders: ${context.metrics.orders.value}

TOP CAMPAIGNS:
${context.campaigns.slice(0, 10).map((c) => `- ${c.name}: $${c.spend.toFixed(0)} spend, ${c.acos.toFixed(1)}% ACOS, ${c.roas.toFixed(2)}x ROAS`).join("\n")}

WASTED SPEND:
${context.wastedSpend.length ? context.wastedSpend.map((w) => `- "${w.query}": $${w.spend.toFixed(0)} spend, ${w.acos.toFixed(1)}% ACOS`).join("\n") : "No wasted spend data"}

SCALING OPPORTUNITIES:
${context.scalingOpportunities.length ? context.scalingOpportunities.map((s) => `- "${s.query}": ${s.recommendedAction} — ${s.reason}`).join("\n") : "No scaling opportunities identified"}

SQP INSIGHTS:
${context.sqpInsights.slice(0, 10).map((s) => `- "${s.query}": ${s.impressionShare.toFixed(1)}% imp share, ${s.purchaseShare.toFixed(1)}% purchase share, action: ${s.recommendedAction}`).join("\n")}

DATA GAPS: ${context.dataGaps.length ? context.dataGaps.join(", ") : "None"}`;
}

export async function streamChatResponse(
  context: ClientContext,
  messages: { role: "user" | "assistant"; content: string }[]
) {
  const client = getAnthropicClient();

  return client.messages.stream({
    model: "claude-sonnet-4-20250514",
    max_tokens: 4096,
    system: SYSTEM_PROMPT,
    messages: [
      { role: "user", content: buildContextMessage(context) },
      { role: "assistant", content: "I have reviewed the client data. How can I help?" },
      ...messages.map((m) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      })),
    ],
  });
}
