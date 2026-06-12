import type { DateRange } from "@/lib/analytics/types";
import { getMetricsWithComparison } from "@/lib/analytics/service";
import { getWastedSpend } from "@/lib/analytics/insights";
import { prisma } from "@/lib/db/prisma";
import { getAnthropic, ANTHROPIC_MODEL } from "@/lib/anthropic/client";
import { REPORT_SYSTEM_PROMPT } from "@/lib/anthropic/prompts";
import { formatPercent } from "@/lib/utils";

/**
 * Generates a client-facing performance report (markdown). Combines KPIs,
 * period-over-period change and the latest audit findings.
 */
export async function generateClientReport(
  clientId: string,
  range: DateRange
): Promise<{ markdown: string; metrics: Awaited<ReturnType<typeof getMetricsWithComparison>> }> {
  const [client, metrics, wasted, latestAudit] = await Promise.all([
    prisma.client.findUnique({ where: { id: clientId } }),
    getMetricsWithComparison(clientId, range),
    getWastedSpend(clientId, range),
    prisma.auditReport.findFirst({
      where: { clientId },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const payload = {
    brand: client?.brandName,
    currency: client?.currency,
    period: {
      from: range.from.toISOString().slice(0, 10),
      to: range.to.toISOString().slice(0, 10),
    },
    metrics: metrics.current,
    changeVsPrevious: Object.fromEntries(
      Object.entries(metrics.delta).map(([k, v]) => [k, formatPercent(v)])
    ),
    wastedSpend: wasted.slice(0, 10),
    auditSummary: latestAudit?.summary ?? null,
  };

  const anthropic = getAnthropic();
  if (!anthropic) {
    return { markdown: deterministicReport(payload, metrics), metrics };
  }
  try {
    const msg = await anthropic.messages.create({
      model: ANTHROPIC_MODEL,
      max_tokens: 1800,
      system: REPORT_SYSTEM_PROMPT,
      messages: [{ role: "user", content: `Report data:\n${JSON.stringify(payload, null, 2)}` }],
    });
    const text = msg.content
      .filter((b): b is { type: "text"; text: string } => b.type === "text")
      .map((b) => b.text)
      .join("\n");
    return { markdown: text || deterministicReport(payload, metrics), metrics };
  } catch {
    return { markdown: deterministicReport(payload, metrics), metrics };
  }
}

function deterministicReport(
  payload: ReturnType<typeof Object> & { brand?: string },
  metrics: Awaited<ReturnType<typeof getMetricsWithComparison>>
): string {
  const c = metrics.current;
  const d = metrics.delta;
  const l: string[] = [];
  l.push(`# Performance Report — ${(payload as any).brand ?? "Client"}`);
  l.push(`Period: ${(payload as any).period.from} → ${(payload as any).period.to}`);

  l.push("\n## Executive Summary");
  l.push(
    `Ad spend $${c.spend.toFixed(0)} (${formatPercent(d.spend)} vs prior) produced $${c.sales.toFixed(
      0
    )} ad sales. ACOS ${(c.acos * 100).toFixed(0)}%, TACOS ${(c.tacos * 100).toFixed(
      0
    )}%, ROAS ${c.roas.toFixed(1)}x.`
  );

  l.push("\n## Key Metrics");
  l.push(`- Spend: $${c.spend.toFixed(0)} (${formatPercent(d.spend)})`);
  l.push(`- Ad Sales: $${c.sales.toFixed(0)} (${formatPercent(d.sales)})`);
  l.push(`- Total Revenue: $${c.revenue.toFixed(0)} (${formatPercent(d.revenue)})`);
  l.push(`- ACOS: ${(c.acos * 100).toFixed(0)}% · TACOS: ${(c.tacos * 100).toFixed(0)}% · ROAS: ${c.roas.toFixed(1)}x`);
  l.push(`- CTR: ${(c.ctr * 100).toFixed(2)}% · CPC: $${c.cpc.toFixed(2)} · CVR: ${(c.cvr * 100).toFixed(1)}%`);

  l.push("\n## Problems Found");
  const wasted = (payload as any).wastedSpend as Array<{ query: string; reason: string }>;
  if (!wasted?.length) l.push("- No major issues this period.");
  for (const w of wasted?.slice(0, 5) ?? []) l.push(`- ${w.query}: ${w.reason}`);

  l.push("\n## Recommended Actions");
  l.push("- Trim wasted spend and reallocate to efficient campaigns.");
  l.push("- Improve listings on low-CTR / low-CVR products.");
  l.push("- Pursue SQP scaling and test opportunities.");

  l.push("\n## Next Steps");
  l.push("- Approve budget reallocation and implement immediate fixes this week.");

  return l.join("\n");
}
