import { prisma } from "@/lib/db/prisma";
import { getAnthropic, ANTHROPIC_MODEL } from "@/lib/anthropic/client";
import { MARKETING_PLAN_SYSTEM_PROMPT } from "@/lib/anthropic/prompts";
import type { AuditFindings } from "./audit";

/**
 * Generates a 30-day marketing plan from an existing audit report. Uses Claude
 * when configured, otherwise produces a deterministic structured plan.
 */
export async function generateMarketingPlan(
  clientId: string,
  auditReportId: string
) {
  const audit = await prisma.auditReport.findUnique({
    where: { id: auditReportId },
  });
  if (!audit || audit.clientId !== clientId) {
    throw new Error("Audit report not found for client");
  }

  const findings = (audit.findings ?? {}) as unknown as AuditFindings;
  const summary = await writePlan(findings);

  const plan = await prisma.marketingPlan.upsert({
    where: { auditReportId },
    create: {
      clientId,
      auditReportId,
      title: `Marketing Plan — ${audit.title}`,
      summary,
      content: buildStructuredPlan(findings) as unknown as object,
    },
    update: {
      summary,
      content: buildStructuredPlan(findings) as unknown as object,
    },
  });

  return plan;
}

function buildStructuredPlan(findings: AuditFindings) {
  return {
    immediateFixes: findings.wastedSpend.slice(0, 5).map((w) => ({
      action: `Negate/lower bid on "${w.query}"`,
      impact: `Save ~$${w.spend.toFixed(0)}`,
      reason: w.reason,
    })),
    budgetReallocation: {
      cut: findings.wastedSpend.slice(0, 5).map((w) => w.query),
      scale: findings.strongCampaigns.slice(0, 5).map((s) => s.label),
    },
    keywordActions: findings.lowCtrKeywords.slice(0, 5).map((k) => ({
      keyword: k.text,
      action: "Improve relevance / pause low CTR",
      ctr: k.ctr,
    })),
    sqpStrategy: findings.sqpOpportunities.slice(0, 10),
    roadmap: [
      { week: 1, focus: "Eliminate wasted spend, negate non-converting terms." },
      { week: 2, focus: "Reallocate budget to scaling opportunities; raise bids on efficient campaigns." },
      { week: 3, focus: "Launch SQP test campaigns; fix listings with low click share." },
      { week: 4, focus: "Defend high-purchase-share queries; review and report results." },
    ],
  };
}

async function writePlan(findings: AuditFindings): Promise<string> {
  const anthropic = getAnthropic();
  if (!anthropic) return deterministicPlan(findings);
  try {
    const msg = await anthropic.messages.create({
      model: ANTHROPIC_MODEL,
      max_tokens: 2000,
      system: MARKETING_PLAN_SYSTEM_PROMPT,
      messages: [
        { role: "user", content: `Audit findings JSON:\n${JSON.stringify(findings, null, 2)}` },
      ],
    });
    const text = msg.content
      .filter((b): b is { type: "text"; text: string } => b.type === "text")
      .map((b) => b.text)
      .join("\n");
    return text || deterministicPlan(findings);
  } catch {
    return deterministicPlan(findings);
  }
}

function deterministicPlan(findings: AuditFindings): string {
  const l: string[] = [];
  l.push("## Immediate Fixes (This Week)");
  if (findings.wastedSpend.length === 0) l.push("- No urgent wasted spend to cut.");
  for (const w of findings.wastedSpend.slice(0, 5)) {
    l.push(`- Negate/lower bid on **${w.query}** — ${w.reason}`);
  }

  l.push("\n## Campaign Restructuring");
  for (const h of findings.highAcosCampaigns.slice(0, 5)) {
    l.push(`- Restructure **${h.name}** (ACOS ${(h.acos * 100).toFixed(0)}%): tighten match types and bids.`);
  }
  if (findings.highAcosCampaigns.length === 0) l.push("- No high-ACOS campaigns requiring restructure.");

  l.push("\n## Budget Reallocation");
  l.push(
    `- Move budget from wasted terms ($${findings.totals.estimatedWastedSpend.toFixed(
      0
    )}) into scaling opportunities: ${findings.strongCampaigns
      .slice(0, 5)
      .map((s) => s.label)
      .join(", ") || "(none yet)"}.`
  );

  l.push("\n## Keyword Actions");
  for (const k of findings.lowCtrKeywords.slice(0, 5)) {
    l.push(`- **${k.text}** CTR ${(k.ctr * 100).toFixed(2)}% — improve ad relevance or pause.`);
  }

  l.push("\n## SQP Strategy");
  for (const s of findings.sqpOpportunities.slice(0, 8)) {
    l.push(`- **${s.action}** — ${s.query}: ${s.reason}`);
  }

  l.push("\n## 30-Day Roadmap");
  l.push("- **Week 1:** Eliminate wasted spend, negate non-converting terms.");
  l.push("- **Week 2:** Reallocate budget; raise bids on efficient campaigns.");
  l.push("- **Week 3:** Launch SQP test campaigns; fix low click-share listings.");
  l.push("- **Week 4:** Defend top queries; measure and report.");

  return l.join("\n");
}
