import { getClientContext } from "@/lib/analytics/service";
import { type DateRange } from "@/lib/utils";

export const AMAZON_STRATEGIST_SYSTEM_PROMPT =
  "You are an Amazon Ads strategist. Use only the provided client data. If data is missing, say so. Give practical, prioritized recommendations with numbers.";

export async function buildChatPayload(clientId: string, range: DateRange, question: string) {
  const context = await getClientContext(clientId, range);

  return {
    system: AMAZON_STRATEGIST_SYSTEM_PROMPT,
    prompt: question,
    context,
  };
}

export async function buildFallbackAnswer(clientId: string, range: DateRange, question: string) {
  const context = await getClientContext(clientId, range);

  if (!context) {
    return "I could not find client data for that request. Please reconnect the account or check the selected client.";
  }

  const topWaste = context.wastedSpend[0];
  const topScale = context.scalingOpportunities[0];
  const tacos = context.performance.find((metric) => metric.key === "tacos");
  const acos = context.performance.find((metric) => metric.key === "acos");

  return [
    `Question: ${question}`,
    "",
    `${context.client.brandName} overview`,
    `- TACOS: ${tacos ? (tacos.value * 100).toFixed(1) : "n/a"}%`,
    `- ACOS: ${acos ? (acos.value * 100).toFixed(1) : "n/a"}%`,
    "",
    "Priority actions",
    topWaste ? `1. Cut: ${topWaste.title} — ${topWaste.detail}` : "1. No clear wasted spend signal was found in the current dataset.",
    topScale ? `2. Scale: ${topScale.title} — ${topScale.detail}` : "2. No high-confidence scale opportunity was found in the current dataset.",
    "3. If you need a deeper answer, connect a live Claude API key to upgrade this response from deterministic context synthesis to live model reasoning.",
  ].join("\n");
}
