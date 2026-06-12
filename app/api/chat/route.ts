import Anthropic from "@anthropic-ai/sdk";

import { buildChatPayload, buildFallbackAnswer } from "@/lib/anthropic/chat";
import { chatRequestSchema } from "@/lib/validation/chat";
import { parseDateRange } from "@/lib/utils";

function streamText(text: string) {
  return new ReadableStream({
    async start(controller) {
      for (const chunk of text.split(/(\s+)/)) {
        controller.enqueue(new TextEncoder().encode(chunk));
        await new Promise((resolve) => setTimeout(resolve, 8));
      }
      controller.close();
    },
  });
}

export async function POST(request: Request) {
  const json = await request.json();
  const parsed = chatRequestSchema.safeParse(json);

  if (!parsed.success) {
    return new Response("Invalid chat payload.", { status: 400 });
  }

  const range = parseDateRange({
    preset: parsed.data.preset,
    from: parsed.data.from,
    to: parsed.data.to,
  });

  const payload = await buildChatPayload(parsed.data.clientId, range, parsed.data.question);

  if (!payload.context) {
    return new Response(streamText("No client context was available for this request."), {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
      },
    });
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    const fallback = await buildFallbackAnswer(parsed.data.clientId, range, parsed.data.question);
    return new Response(streamText(fallback), {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
      },
    });
  }

  try {
    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });

    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 900,
      system: payload.system,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: [
                `Question: ${payload.prompt}`,
                "",
                "Client context JSON:",
                JSON.stringify(payload.context, null, 2),
              ].join("\n"),
            },
          ],
        },
      ],
    });

    const answer = response.content
      .filter((block) => block.type === "text")
      .map((block) => block.text)
      .join("\n\n");

    return new Response(streamText(answer), {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
      },
    });
  } catch {
    const fallback = await buildFallbackAnswer(parsed.data.clientId, range, parsed.data.question);

    return new Response(streamText(fallback), {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
      },
    });
  }
}
