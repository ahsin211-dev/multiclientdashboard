import { requireSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { getClientContext } from "@/lib/analytics/context";
import { parseDateRange } from "@/lib/analytics/date-ranges";
import { streamChatResponse } from "@/lib/anthropic/client";
import { chatMessageSchema } from "@/lib/validations";

export async function POST(request: Request) {
  try {
    const session = await requireSession();
    const body = await request.json();
    const { clientId, message, sessionId, dateRange } = chatMessageSchema.parse(body);

    const client = await prisma.client.findFirst({
      where: { id: clientId, workspaceId: session.workspaceId },
    });

    if (!client) {
      return new Response(JSON.stringify({ error: "Client not found" }), { status: 404 });
    }

    const range = dateRange
      ? parseDateRange(dateRange.from, dateRange.to)
      : parseDateRange();

    const context = await getClientContext(clientId, range);

    let chatSession = sessionId
      ? await prisma.chatSession.findFirst({
          where: { id: sessionId, clientId, userId: session.userId },
          include: { messages: { orderBy: { createdAt: "asc" }, take: 20 } },
        })
      : null;

    if (!chatSession) {
      chatSession = await prisma.chatSession.create({
        data: {
          clientId,
          userId: session.userId,
          title: message.slice(0, 50),
        },
        include: { messages: true },
      });
    }

    await prisma.chatMessage.create({
      data: { sessionId: chatSession.id, role: "USER", content: message },
    });

    const history = chatSession.messages.map((m) => ({
      role: m.role.toLowerCase() as "user" | "assistant",
      content: m.content,
    }));

    history.push({ role: "user", content: message });

    let fullResponse = "";

    try {
      const stream = await streamChatResponse(context, history);

      const encoder = new TextEncoder();
      const readable = new ReadableStream({
        async start(controller) {
          try {
            for await (const event of stream) {
              if (
                event.type === "content_block_delta" &&
                event.delta.type === "text_delta"
              ) {
                fullResponse += event.delta.text;
                controller.enqueue(encoder.encode(event.delta.text));
              }
            }

            await prisma.chatMessage.create({
              data: {
                sessionId: chatSession!.id,
                role: "ASSISTANT",
                content: fullResponse,
              },
            });

            controller.close();
          } catch (err) {
            controller.error(err);
          }
        },
      });

      return new Response(readable, {
        headers: {
          "Content-Type": "text/plain; charset=utf-8",
          "Transfer-Encoding": "chunked",
        },
      });
    } catch {
      // Fallback when Anthropic API key not configured
      const fallback = generateFallbackResponse(context, message);
      fullResponse = fallback;

      await prisma.chatMessage.create({
        data: {
          sessionId: chatSession.id,
          role: "ASSISTANT",
          content: fullResponse,
        },
      });

      return new Response(fallback, {
        headers: { "Content-Type": "text/plain; charset=utf-8" },
      });
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Chat failed";
    return new Response(JSON.stringify({ error: message }), { status: 400 });
  }
}

function generateFallbackResponse(
  context: Awaited<ReturnType<typeof getClientContext>>,
  question: string
): string {
  const q = question.toLowerCase();

  if (q.includes("acos")) {
    return `Based on your data (${context.dateRange.from} to ${context.dateRange.to}):

**ACOS Analysis for ${context.client.brandName}**
- Current ACOS: ${context.metrics.acos.value.toFixed(1)}% (${context.metrics.acos.delta?.toFixed(1)}% vs prior period)
- Ad Spend: $${context.metrics.adSpend.value.toFixed(0)}
- Attributed Sales: $${context.metrics.sales.value.toFixed(0)}

${context.metrics.acos.delta && context.metrics.acos.delta > 0 ? "ACOS increased — review high-ACOS campaigns and wasted spend queries." : "ACOS is stable or improving."}

Top wasted spend:
${context.wastedSpend.slice(0, 3).map((w) => `- "${w.query}": $${w.spend.toFixed(0)} at ${w.acos.toFixed(0)}% ACOS`).join("\n") || "None identified"}

${context.dataGaps.length ? `\nNote: Missing data — ${context.dataGaps.join(", ")}` : ""}`;
  }

  if (q.includes("wasted") || q.includes("cut")) {
    return `**Wasted Spend Analysis**

${context.wastedSpend.length ? context.wastedSpend.map((w, i) => `${i + 1}. "${w.query}" — $${w.spend.toFixed(0)} spend, ${w.acos.toFixed(0)}% ACOS, $${w.sales.toFixed(0)} sales`).join("\n") : "No significant wasted spend detected in current data."}

**Campaigns to review:**
${context.campaigns.filter((c) => c.acos > 35).slice(0, 3).map((c) => `- ${c.name}: ${c.acos.toFixed(1)}% ACOS`).join("\n") || "No high-ACOS campaigns above threshold."}`;
  }

  if (q.includes("scale") || q.includes("keyword")) {
    return `**Scaling Opportunities**

${context.scalingOpportunities.length ? context.scalingOpportunities.map((s, i) => `${i + 1}. "${s.query}" — ${s.recommendedAction}: ${s.reason}`).join("\n") : "No scaling opportunities identified."}

**Strong ROAS campaigns:**
${context.campaigns.filter((c) => c.roas > 3).slice(0, 3).map((c) => `- ${c.name}: ${c.roas.toFixed(1)}x ROAS, $${c.spend.toFixed(0)} spend`).join("\n")}`;
  }

  return `**${context.client.brandName} Performance Summary** (${context.dateRange.from} to ${context.dateRange.to})

- Ad Spend: $${context.metrics.adSpend.value.toFixed(0)}
- Revenue: $${context.metrics.revenue.value.toFixed(0)}
- ACOS: ${context.metrics.acos.value.toFixed(1)}%
- TACOS: ${context.metrics.tacos.value.toFixed(1)}%
- ROAS: ${context.metrics.roas.value.toFixed(2)}x
- Orders: ${context.metrics.orders.value}

Ask me about ACOS changes, wasted spend, scaling opportunities, or SQP insights.

${context.dataGaps.length ? `Data gaps: ${context.dataGaps.join(", ")}` : ""}

_Note: Configure ANTHROPIC_API_KEY for full AI-powered responses._`;
}
