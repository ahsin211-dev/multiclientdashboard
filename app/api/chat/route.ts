import { NextResponse } from "next/server";
import { z } from "zod";
import { createClaudeStream } from "@/lib/anthropic/client";
import { getClientContext } from "@/lib/analytics/client-context";

const chatSchema = z.object({
  clientId: z.string().min(1),
  message: z.string().min(1).max(4000),
  range: z.enum(["7d", "30d"]).default("30d"),
});

export async function POST(request: Request) {
  const body = chatSchema.safeParse(await request.json());
  if (!body.success) {
    return NextResponse.json({ error: "Invalid chat payload", issues: body.error.flatten() }, { status: 400 });
  }

  const context = await getClientContext(body.data.clientId, body.data.range);
  const stream = await createClaudeStream(body.data.message, context);

  return new Response(stream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      "X-Accel-Buffering": "no",
    },
  });
}
