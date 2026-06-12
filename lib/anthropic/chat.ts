import { getAnthropic, ANTHROPIC_MODEL, isAnthropicConfigured } from "./client";
import { COPILOT_SYSTEM_PROMPT } from "./prompts";
import type { ClientContext } from "./context";

export interface ChatTurn {
  role: "user" | "assistant";
  content: string;
}

/**
 * Returns a ReadableStream of UTF-8 text chunks for the assistant's reply.
 * The grounded client data context is injected into the latest user turn so the
 * model can only reason over real numbers.
 *
 * When no ANTHROPIC_API_KEY is configured, falls back to a deterministic,
 * data-grounded answer so the feature is demonstrable offline.
 */
export function streamChatResponse(
  history: ChatTurn[],
  context: ClientContext
): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();
  const anthropic = getAnthropic();

  if (!anthropic || !isAnthropicConfigured()) {
    const fallback = buildFallbackAnswer(history, context);
    return new ReadableStream({
      start(controller) {
        // Stream word-by-word to mimic a real streaming UX.
        const words = fallback.split(" ");
        let i = 0;
        const tick = () => {
          if (i >= words.length) {
            controller.close();
            return;
          }
          controller.enqueue(encoder.encode(words[i] + " "));
          i++;
          setTimeout(tick, 8);
        };
        tick();
      },
    });
  }

  const messages = buildMessages(history, context);

  return new ReadableStream({
    async start(controller) {
      try {
        const stream = await anthropic.messages.create({
          model: ANTHROPIC_MODEL,
          max_tokens: 1800,
          system: COPILOT_SYSTEM_PROMPT,
          messages,
          stream: true,
        });
        for await (const event of stream) {
          if (
            event.type === "content_block_delta" &&
            event.delta.type === "text_delta"
          ) {
            controller.enqueue(encoder.encode(event.delta.text));
          }
        }
        controller.close();
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Unknown error";
        controller.enqueue(encoder.encode(`\n\n[AI error: ${msg}]`));
        controller.close();
      }
    },
  });
}

function buildMessages(history: ChatTurn[], context: ClientContext) {
  const msgs = history.map((t) => ({ role: t.role, content: t.content }));
  // Inject context into the last user turn.
  const lastUserIdx = [...msgs].reverse().findIndex((m) => m.role === "user");
  if (lastUserIdx >= 0) {
    const idx = msgs.length - 1 - lastUserIdx;
    msgs[idx] = {
      role: "user",
      content: `${msgs[idx].content}\n\n---\nCLIENT DATA CONTEXT (use only this):\n${JSON.stringify(
        context,
        null,
        2
      )}`,
    };
  }
  return msgs;
}

/** Deterministic grounded answer used when Claude is not configured. */
function buildFallbackAnswer(history: ChatTurn[], context: ClientContext): string {
  if ("error" in context) {
    return "I don't have data for this client yet. Please run a sync first.";
  }
  const ctx = context as Exclude<ClientContext, { error: string }>;
  const q = history.filter((h) => h.role === "user").at(-1)?.content.toLowerCase() ?? "";
  const k = ctx.kpis.current;

  const lines: string[] = [];
  lines.push(
    `**(Demo mode — set ANTHROPIC_API_KEY for full AI responses. Answer below uses only ${ctx.client.name}'s real data.)**\n`
  );

  if (q.includes("acos") || q.includes("why")) {
    lines.push(
      `ACOS is ${(k.acos * 100).toFixed(0)}% (spend $${k.spend.toFixed(
        0
      )} / ad sales $${k.sales.toFixed(0)}), changed ${ctx.kpis.changeVsPrevious.acos} vs the prior period.`
    );
    if (ctx.highAcosCampaigns.length) {
      lines.push(`Top ACOS drivers:`);
      for (const c of ctx.highAcosCampaigns.slice(0, 3))
        lines.push(`- ${c.name}: ${(c.acos * 100).toFixed(0)}% ACOS on $${c.spend.toFixed(0)}.`);
    } else {
      lines.push("No individual campaigns are flagged as high-ACOS this period.");
    }
  } else if (q.includes("cut") || q.includes("wasted") || q.includes("waste")) {
    if (ctx.wastedSpend.length) {
      lines.push(`Wasted spend candidates (cut/negate):`);
      for (const w of ctx.wastedSpend.slice(0, 6)) lines.push(`- ${w.query}: ${w.reason}`);
    } else lines.push("I don't see meaningful wasted spend this period.");
  } else if (q.includes("scale") || q.includes("grow")) {
    if (ctx.scalingOpportunities.length) {
      lines.push(`Scaling opportunities:`);
      for (const s of ctx.scalingOpportunities.slice(0, 6)) lines.push(`- ${s.label}: ${s.reason}`);
    } else lines.push("No clear scaling opportunities detected with current data.");
  } else if (q.includes("sqp") || q.includes("query") || q.includes("search query")) {
    const test = ctx.sqpInsights.filter((s) => s.action === "TEST").slice(0, 5);
    if (test.length) {
      lines.push("High impression share / low click share (test creative/title/price):");
      for (const s of test) lines.push(`- ${s.query}: ${s.reason}`);
    } else lines.push("No SQP test opportunities surfaced this period.");
  } else {
    lines.push(
      `Snapshot for ${ctx.client.name}: spend $${k.spend.toFixed(0)}, ad sales $${k.sales.toFixed(
        0
      )}, revenue $${k.revenue.toFixed(0)}, ACOS ${(k.acos * 100).toFixed(
        0
      )}%, TACOS ${(k.tacos * 100).toFixed(0)}%, ROAS ${k.roas.toFixed(1)}x.`
    );
    lines.push(
      `Ask me about wasted spend, scaling opportunities, ACOS drivers, or SQP queries.`
    );
  }

  return lines.join("\n");
}
