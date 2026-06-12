import { NextRequest } from "next/server";
import { getAnthropicClient, AMAZON_ADS_SYSTEM_PROMPT } from "@/lib/anthropic/client";
import { getClientContext, buildContextPrompt } from "@/lib/anthropic/context";
import { z } from "zod";

const requestSchema = z.object({
  clientId: z.string(),
  message: z.string().min(1).max(2000),
  history: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string(),
      })
    )
    .max(20)
    .optional()
    .default([]),
  dateRange: z
    .object({ from: z.string(), to: z.string() })
    .optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { clientId, message, history, dateRange } = requestSchema.parse(body);

    const now = new Date();
    const from = dateRange
      ? new Date(dateRange.from)
      : new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const to = dateRange ? new Date(dateRange.to) : now;

    let contextPrompt = "";
    try {
      const context = await getClientContext(clientId, { from, to });
      contextPrompt = buildContextPrompt(context);
    } catch {
      contextPrompt = `[Client context unavailable — clientId: ${clientId}. Proceed with general Amazon Ads knowledge and note that specific data is not available.]`;
    }

    const anthropic = getAnthropicClient();

    const systemPrompt = `${AMAZON_ADS_SYSTEM_PROMPT}

${contextPrompt}`;

    const messages = [
      ...history.map((h) => ({
        role: h.role as "user" | "assistant",
        content: h.content,
      })),
      { role: "user" as const, content: message },
    ];

    const stream = anthropic.messages.stream({
      model: "claude-opus-4-5",
      max_tokens: 2048,
      system: systemPrompt,
      messages,
    });

    const encoder = new TextEncoder();
    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const event of stream) {
            if (
              event.type === "content_block_delta" &&
              event.delta.type === "text_delta"
            ) {
              const data = JSON.stringify({ text: event.delta.text });
              controller.enqueue(encoder.encode(`data: ${data}\n\n`));
            }
          }
          controller.enqueue(encoder.encode("data: [DONE]\n\n"));
          controller.close();
        } catch (err) {
          const errMsg = err instanceof Error ? err.message : "Stream error";
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ error: errMsg })}\n\n`)
          );
          controller.close();
        }
      },
    });

    return new Response(readable, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return Response.json({ error: "Invalid request", details: err.issues }, { status: 400 });
    }
    const message = err instanceof Error ? err.message : "Internal server error";
    return Response.json({ error: message }, { status: 500 });
  }
}
