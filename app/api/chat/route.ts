import { ChatRole } from "@prisma/client";
import { NextResponse } from "next/server";
import { z } from "zod";

import { getClientContext } from "@/lib/analytics/context";
import { getAnthropicClient } from "@/lib/anthropic/client";
import { AMAZON_STRATEGIST_SYSTEM_PROMPT } from "@/lib/anthropic/prompt";
import { prisma } from "@/lib/db/prisma";

const requestSchema = z.object({
  clientId: z.string().min(1),
  message: z.string().min(1),
  chatSessionId: z.string().optional(),
  datePreset: z.enum(["last7", "last30"]).default("last30")
});

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = requestSchema.parse(await request.json());
    const context = await getClientContext(body.clientId, body.datePreset);

    if (!context) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }

    const clientRecord = await prisma.client.findUnique({
      where: { id: body.clientId },
      select: { workspaceId: true }
    });

    if (!clientRecord) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }

    const session = body.chatSessionId
      ? await prisma.chatSession.findUnique({
          where: { id: body.chatSessionId }
        })
      : null;

    const chatSession =
      session ??
      (await prisma.chatSession.create({
        data: {
          title: "Strategy Chat",
          workspaceId: clientRecord.workspaceId,
          clientId: body.clientId
        }
      }));

    await prisma.chatMessage.create({
      data: {
        chatSessionId: chatSession.id,
        role: ChatRole.USER,
        content: body.message
      }
    });

    const anthropic = getAnthropicClient();
    const encoder = new TextEncoder();
    let assistantMessage = "";

    const stream = new ReadableStream({
      async start(controller) {
        const fallbackResponse = [
          "Claude API key is not configured, so this is a deterministic fallback response.",
          "I can only use data currently available in your client context.",
          `Current spend: ${context.summary.spend.current.toFixed(2)}, sales: ${context.summary.sales.current.toFixed(2)}, ACOS: ${(context.summary.acos.current * 100).toFixed(1)}%.`,
          context.wastedSpend.length
            ? `Top wasted spend query: ${context.wastedSpend[0].query} (${(context.wastedSpend[0].acos * 100).toFixed(1)}% ACOS).`
            : "No wasted spend data was found for the selected range.",
          context.scaling.length
            ? `Top scaling opportunity: ${context.scaling[0].query} (ROAS ${context.scaling[0].roas.toFixed(2)}).`
            : "No clear scaling opportunities were found in SQP data."
        ].join(" ");

        try {
          if (!anthropic) {
            const chunks = fallbackResponse.split(" ");
            for (const chunk of chunks) {
              const token = `${chunk} `;
              assistantMessage += token;
              controller.enqueue(encoder.encode(token));
              await new Promise((resolve) => setTimeout(resolve, 25));
            }
            controller.close();
            return;
          }

          const prompt = `
Client data:
${JSON.stringify(context, null, 2)}

User question:
${body.message}
          `.trim();

          const response = await anthropic.messages.create({
            model: "claude-sonnet-4-5",
            max_tokens: 1800,
            temperature: 0.2,
            stream: true,
            system: AMAZON_STRATEGIST_SYSTEM_PROMPT,
            messages: [{ role: "user", content: prompt }]
          });

          for await (const event of response) {
            if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
              assistantMessage += event.delta.text;
              controller.enqueue(encoder.encode(event.delta.text));
            }
          }
          controller.close();
        } catch (error) {
          const message =
            error instanceof Error ? error.message : "Unable to generate AI response right now.";
          controller.enqueue(encoder.encode(`\n\n[Error] ${message}`));
          controller.close();
        }
      },
      async cancel() {
        // No-op.
      }
    });

    const response = new Response(stream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-cache"
      }
    });

    response.headers.set("x-chat-session-id", chatSession.id);

    queueMicrotask(async () => {
      if (!assistantMessage.trim()) return;
      await prisma.chatMessage.create({
        data: {
          chatSessionId: chatSession.id,
          role: ChatRole.ASSISTANT,
          content: assistantMessage
        }
      });
    });

    return response;
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.flatten() }, { status: 400 });
    }
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unexpected error" },
      { status: 500 }
    );
  }
}
