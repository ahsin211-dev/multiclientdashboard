import Anthropic from "@anthropic-ai/sdk";
import { amazonStrategistSystemPrompt } from "@/lib/anthropic/prompts";
import { env } from "@/lib/env";
import type { ClientContext } from "@/lib/analytics/types";

const encoder = new TextEncoder();

function mockAnswer(question: string, context: ClientContext) {
  const wasted = context.wastedSpend[0];
  const scale = context.scalingOpportunities[0];
  const sqp = context.sqpInsights.find((item) => item.recommendedAction === "Scale");

  return [
    `Using the provided ${context.client.brandName} data only:`,
    "",
    `- Spend is $${Math.round(context.summary.spend).toLocaleString()} and ad sales are $${Math.round(context.summary.sales).toLocaleString()}, producing ${context.summary.acos.toFixed(1)}% ACOS and ${context.summary.roas.toFixed(2)}x ROAS.`,
    wasted
      ? `- Highest wasted-spend risk: "${wasted.query}" spent $${Math.round(wasted.spend).toLocaleString()} with ${wasted.acos.toFixed(1)}% ACOS and ${wasted.orders} orders.`
      : "- No wasted-spend terms are present in the supplied context.",
    scale
      ? `- Best campaign to scale: "${scale.name}" at ${scale.acos.toFixed(1)}% ACOS and ${scale.roas.toFixed(2)}x ROAS.`
      : "- No campaign in the supplied context meets the scale threshold.",
    sqp
      ? `- SQP opportunity: "${sqp.query}" has ${sqp.purchaseShare.toFixed(1)}% purchase share with only $${Math.round(sqp.ppcSpend)} PPC spend.`
      : "- No underfunded SQP scale opportunity is present in the supplied context.",
    "",
    `Recommended next step for "${question}": cut inefficient query spend first, move budget into proven exact campaigns, then launch a controlled SQP test for underfunded high-conversion queries.`,
  ].join("\n");
}

export async function createClaudeStream(question: string, context: ClientContext): Promise<ReadableStream<Uint8Array>> {
  if (!env.ANTHROPIC_API_KEY) {
    const answer = mockAnswer(question, context);
    return new ReadableStream({
      async start(controller) {
        for (const token of answer.split(/(\s+)/)) {
          controller.enqueue(encoder.encode(token));
          await new Promise((resolve) => setTimeout(resolve, 8));
        }
        controller.close();
      },
    });
  }

  const anthropic = new Anthropic({
    apiKey: env.ANTHROPIC_API_KEY,
  });

  const stream = anthropic.messages.stream({
    model: "claude-sonnet-4-5",
    max_tokens: 1400,
    temperature: 0.2,
    system: amazonStrategistSystemPrompt,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "text",
            text: `Client data context:\n${JSON.stringify(context, null, 2)}\n\nQuestion:\n${question}`,
          },
        ],
      },
    ],
  });

  return new ReadableStream({
    async start(controller) {
      try {
        for await (const event of stream as AsyncIterable<{ type: string; text?: string; delta?: { text?: string } }>) {
          const text = event.type === "content_block_delta" ? event.delta?.text : event.text;
          if (text) controller.enqueue(encoder.encode(text));
        }
        controller.close();
      } catch (error) {
        controller.error(error);
      }
    },
  });
}
