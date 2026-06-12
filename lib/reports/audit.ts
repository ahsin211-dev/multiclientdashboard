import { prisma } from "@/lib/db/prisma";
import type { DateRange } from "@/lib/analytics/types";
import { getMetricsWithComparison } from "@/lib/analytics/service";
import {
  getWastedSpend,
  getScalingOpportunities,
  getHighAcosCampaigns,
  getLowCtrKeywords,
  getProductConversionIssues,
} from "@/lib/analytics/insights";
import { analyzeSqp } from "@/lib/sqp/analyzer";
import { getAnthropic, ANTHROPIC_MODEL } from "@/lib/anthropic/client";
import { AUDIT_SYSTEM_PROMPT } from "@/lib/anthropic/prompts";

export interface AuditFindings {
  wastedSpend: Awaited<ReturnType<typeof getWastedSpend>>;
  highAcosCampaigns: Awaited<ReturnType<typeof getHighAcosCampaigns>>;
  lowCtrKeywords: Awaited<ReturnType<typeof getLowCtrKeywords>>;
  strongCampaigns: Awaited<ReturnType<typeof getScalingOpportunities>>;
  sqpOpportunities: Array<{ query: string; action: string; reason: string }>;
  productConversionIssues: Awaited<ReturnType<typeof getProductConversionIssues>>;
  totals: {
    estimatedWastedSpend: number;
    wastedSpendItems: number;
    highAcosCampaigns: number;
  };
}

/**
 * Runs the deterministic analytics audit and (optionally) augments it with a
 * Claude-written narrative summary. Persists an AuditReport row.
 */
export async function generateAudit(
  clientId: string,
  range: DateRange,
  opts: { title?: string; targetAcos?: number } = {}
) {
  const targetAcos = opts.targetAcos ?? 0.3;

  const [wasted, scaling, highAcos, lowCtr, productIssues, sqp, metrics] =
    await Promise.all([
      getWastedSpend(clientId, range, { targetAcos }),
      getScalingOpportunities(clientId, range, { targetAcos }),
      getHighAcosCampaigns(clientId, range, { targetAcos }),
      getLowCtrKeywords(clientId, range),
      getProductConversionIssues(clientId, range),
      analyzeSqp(clientId, range, { targetAcos }),
      getMetricsWithComparison(clientId, range),
    ]);

  const findings: AuditFindings = {
    wastedSpend: wasted,
    highAcosCampaigns: highAcos,
    lowCtrKeywords: lowCtr,
    strongCampaigns: scaling,
    sqpOpportunities: sqp
      .filter((s) => s.action !== "MAINTAIN")
      .slice(0, 20)
      .map((s) => ({ query: s.query, action: s.action, reason: s.reason })),
    productConversionIssues: productIssues,
    totals: {
      estimatedWastedSpend: round(
        wasted.reduce((sum, w) => sum + w.spend, 0)
      ),
      wastedSpendItems: wasted.length,
      highAcosCampaigns: highAcos.length,
    },
  };

  const summary = await writeAuditSummary(findings, metrics);

  const report = await prisma.auditReport.create({
    data: {
      clientId,
      title: opts.title ?? `Audit ${range.from.toISOString().slice(0, 10)} → ${range.to.toISOString().slice(0, 10)}`,
      status: "COMPLETED",
      periodStart: range.from,
      periodEnd: range.to,
      findings: findings as unknown as object,
      summary,
    },
  });

  return report;
}

async function writeAuditSummary(
  findings: AuditFindings,
  metrics: Awaited<ReturnType<typeof getMetricsWithComparison>>
): Promise<string> {
  const anthropic = getAnthropic();
  if (!anthropic) {
    return deterministicAuditSummary(findings, metrics);
  }
  try {
    const msg = await anthropic.messages.create({
      model: ANTHROPIC_MODEL,
      max_tokens: 1500,
      system: AUDIT_SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: `Findings JSON:\n${JSON.stringify(
            { metrics: metrics.current, change: metrics.delta, findings },
            null,
            2
          )}`,
        },
      ],
    });
    const text = msg.content
      .filter((b): b is { type: "text"; text: string } => b.type === "text")
      .map((b) => b.text)
      .join("\n");
    return text || deterministicAuditSummary(findings, metrics);
  } catch {
    return deterministicAuditSummary(findings, metrics);
  }
}

/** Fallback narrative when no Claude key is configured. */
function deterministicAuditSummary(
  findings: AuditFindings,
  metrics: Awaited<ReturnType<typeof getMetricsWithComparison>>
): string {
  const c = metrics.current;
  const lines: string[] = [];
  lines.push("## Executive Summary");
  lines.push(
    `Over the period, ad spend was $${c.spend.toFixed(0)} driving $${c.sales.toFixed(
      0
    )} in ad sales (ACOS ${(c.acos * 100).toFixed(0)}%, ROAS ${c.roas.toFixed(
      1
    )}x, TACOS ${(c.tacos * 100).toFixed(0)}%). We identified $${findings.totals.estimatedWastedSpend.toFixed(
      0
    )} of potentially wasted spend across ${findings.totals.wastedSpendItems} search terms.`
  );

  lines.push("\n## Key Problems");
  if (findings.wastedSpend.length === 0) lines.push("- No significant wasted spend detected.");
  for (const w of findings.wastedSpend.slice(0, 5)) {
    lines.push(`- **${w.query}**: ${w.reason}`);
  }
  for (const h of findings.highAcosCampaigns.slice(0, 3)) {
    lines.push(`- **${h.name}**: ACOS ${(h.acos * 100).toFixed(0)}% on $${h.spend.toFixed(0)} spend.`);
  }

  lines.push("\n## Strengths to Protect");
  if (findings.strongCampaigns.length === 0) lines.push("- No standout scaling opportunities detected yet.");
  for (const s of findings.strongCampaigns.slice(0, 5)) {
    lines.push(`- **${s.label}**: ${s.reason}`);
  }

  lines.push("\n## Top Actions");
  lines.push("1. Cut or negate the wasted-spend search terms above.");
  lines.push("2. Reallocate freed budget to the scaling opportunities.");
  lines.push("3. Address SQP test/defend queries to capture demand.");

  return lines.join("\n");
}

function round(n: number, digits = 2): number {
  const f = 10 ** digits;
  return Math.round(n * f) / f;
}
