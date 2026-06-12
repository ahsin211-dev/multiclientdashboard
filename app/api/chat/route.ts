import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { getClientContext } from "@/lib/anthropic/context";
import { getAnthropicClient, SYSTEM_PROMPT } from "@/lib/anthropic/client";
import { getPresetDateRange } from "@/lib/analytics/date-ranges";
import { z } from "zod";

const chatSchema = z.object({
  clientId: z.string(),
  sessionId: z.string().optional(),
  message: z.string().min(1),
});

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    return new Response("Unauthorized", { status: 401 });
  }

  try {
    const body = await request.json();
    const { clientId, sessionId, message } = chatSchema.parse(body);

    const client = await prisma.client.findFirst({
      where: { id: clientId, workspaceId: session.workspaceId },
    });
    if (!client) {
      return new Response("Client not found", { status: 404 });
    }

    const dateRange = getPresetDateRange("30d").current;
    const context = await getClientContext(clientId, dateRange);

    let chatSession = sessionId
      ? await prisma.chatSession.findFirst({
          where: { id: sessionId, clientId, userId: session.userId },
        })
      : null;

    if (!chatSession) {
      chatSession = await prisma.chatSession.create({
        data: {
          clientId,
          userId: session.userId,
          title: message.slice(0, 80),
        },
      });
    }

    await prisma.chatMessage.create({
      data: { sessionId: chatSession.id, role: "user", content: message },
    });

    const previousMessages = await prisma.chatMessage.findMany({
      where: { sessionId: chatSession.id },
      orderBy: { createdAt: "asc" },
      take: 20,
    });

    const messages = previousMessages.map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    }));

    const hasApiKey = Boolean(process.env.ANTHROPIC_API_KEY);

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        const send = (data: object) => {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify(data)}\n\n`)
          );
        };

        send({ sessionId: chatSession!.id });

        let fullResponse = "";

        if (!hasApiKey) {
          fullResponse = generateMockResponse(message, context);
          send({ text: fullResponse });
        } else {
          try {
            const anthropic = getAnthropicClient();
            const response = await anthropic.messages.create({
              model: "claude-sonnet-4-20250514",
              max_tokens: 2048,
              system: `${SYSTEM_PROMPT}\n\nClient Data Context:\n${context}`,
              messages,
              stream: true,
            });

            for await (const event of response) {
              if (
                event.type === "content_block_delta" &&
                event.delta.type === "text_delta"
              ) {
                fullResponse += event.delta.text;
                send({ text: event.delta.text });
              }
            }
          } catch (err) {
            const errMsg =
              err instanceof Error ? err.message : "Claude API error";
            fullResponse = `Error calling Claude API: ${errMsg}. Here's analysis based on available data:\n\n${generateMockResponse(message, context)}`;
            send({ text: fullResponse });
          }
        }

        await prisma.chatMessage.create({
          data: {
            sessionId: chatSession!.id,
            role: "assistant",
            content: fullResponse,
          },
        });

        controller.enqueue(encoder.encode("data: [DONE]\n\n"));
        controller.close();
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    console.error("Chat error:", error);
    return new Response("Internal server error", { status: 500 });
  }
}

function generateMockResponse(message: string, context: string): string {
  try {
    const data = JSON.parse(context);
    const m = data.metrics?.current;
    if (!m) return "No client data available. Please run a sync first.";

    const lower = message.toLowerCase();

    if (lower.includes("acos")) {
      return `Based on your data, ACOS is currently ${m.acos?.toFixed(1)}% (${data.metrics.changes?.acos > 0 ? "up" : "down"} ${Math.abs(data.metrics.changes?.acos || 0).toFixed(1)}pp vs prior period).\n\nTop campaigns by spend:\n${(data.topCampaigns || []).slice(0, 3).map((c: { name: string; acos: number; spend: number }) => `- ${c.name}: ${c.acos.toFixed(1)}% ACOS, $${c.spend.toFixed(0)} spend`).join("\n")}\n\nRecommendation: Review campaigns above 40% ACOS for bid reductions or pausing.`;
    }

    if (lower.includes("wasted") || lower.includes("cut")) {
      const wasted = data.wastedSpend || [];
      if (wasted.length === 0) return "No significant wasted spend identified in the current data.";
      return `Found ${wasted.length} items with wasted spend (total: $${data.summary?.wastedSpendTotal?.toFixed(0) || 0}):\n\n${wasted.slice(0, 5).map((w: { name: string; spend: number; reason: string }) => `- ${w.name}: $${w.spend.toFixed(0)} — ${w.reason}`).join("\n")}\n\nRecommendation: Pause or add as negatives starting with highest spend items.`;
    }

    if (lower.includes("scale") || lower.includes("keyword")) {
      const scaling = data.scalingOpportunities || [];
      if (scaling.length === 0) return "No scaling opportunities identified. Ensure sync data is current.";
      return `Top scaling opportunities:\n\n${scaling.slice(0, 5).map((s: { name: string; roas: number; reason: string }) => `- ${s.name}: ${s.roas.toFixed(1)}x ROAS — ${s.reason}`).join("\n")}`;
    }

    if (lower.includes("sqp") || lower.includes("impression share")) {
      const sqp = data.sqpInsights || [];
      const targets = sqp.filter((s: { recommendedAction: string }) => s.recommendedAction === "SCALE");
      if (targets.length === 0) return "No SQP scale opportunities found. SQP data may be limited.";
      return `SQP queries with high impression share but low PPC investment:\n\n${targets.slice(0, 5).map((s: { query: string; impressionShare: number; ppcSpend: number; actionReason: string }) => `- "${s.query}": ${s.impressionShare.toFixed(1)}% imp. share, $${s.ppcSpend.toFixed(0)} spend — ${s.actionReason}`).join("\n")}`;
    }

    if (lower.includes("report")) {
      return `Weekly Client Report — ${data.client?.brandName}\n\n**Key Metrics (last 30 days)**\n- Ad Spend: $${m.spend?.toFixed(0)}\n- Sales: $${m.sales?.toFixed(0)}\n- Revenue: $${m.revenue?.toFixed(0)}\n- ACOS: ${m.acos?.toFixed(1)}%\n- ROAS: ${m.roas?.toFixed(1)}x\n- TACOS: ${m.tacos?.toFixed(1)}%\n\n**Issues**: ${data.summary?.wastedSpendItems?.length || 0} wasted spend items\n**Opportunities**: ${data.scalingOpportunities?.length || 0} scaling targets`;
    }

    return `Current performance for ${data.client?.brandName}:\n- Spend: $${m.spend?.toFixed(0)}\n- ACOS: ${m.acos?.toFixed(1)}%\n- ROAS: ${m.roas?.toFixed(1)}x\n- Orders: ${m.orders}\n\nAsk me about ACOS changes, wasted spend, scaling keywords, SQP opportunities, or request a client report.`;
  } catch {
    return "Unable to parse client data. Please ensure the database is seeded and synced.";
  }
}
