import { NextRequest } from "next/server";
import { chatRequestSchema } from "@/lib/validation";
import { getClientContext } from "@/lib/anthropic/context";
import { streamChatResponse } from "@/lib/anthropic/chat";
import { parseRange } from "@/lib/analytics/date-ranges";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Streaming AI co-pilot endpoint. Builds a grounded data context for the client
 * and streams Claude's response (or a deterministic data-grounded fallback when
 * no ANTHROPIC_API_KEY is set).
 */
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = chatRequestSchema.safeParse(body);
  if (!parsed.success) {
    return new Response(JSON.stringify({ error: parsed.error.flatten() }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const { clientId, messages, period, from, to } = parsed.data;
  const range = parseRange(from, to, (period as any) ?? "30d");
  const context = await getClientContext(clientId, range);

  const stream = streamChatResponse(messages, context);

  return new Response(stream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      "X-Accel-Buffering": "no",
    },
  });
}
