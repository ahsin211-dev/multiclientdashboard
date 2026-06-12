import { prisma } from "@/lib/db/prisma";
import { ratio } from "@/lib/utils";
import type { DateRange } from "@/lib/analytics/types";

/** SQP recommendation buckets (mirrors the SqpAction enum in schema.prisma). */
export type SqpAction = "SCALE" | "CUT" | "TEST" | "DEFEND" | "MAINTAIN";

export interface SqpAnalyzedRow {
  query: string;
  impressionShare: number;
  clickShare: number;
  cartAddShare: number;
  purchaseShare: number;
  ppcSpend: number;
  ppcClicks: number;
  ppcOrders: number;
  ppcSales: number;
  acos: number;
  roas: number;
  action: SqpAction;
  reason: string;
  priority: number; // 0..100, higher = more urgent / higher impact
}

/**
 * Joins Brand Analytics / Search Query Performance shares with PPC search-term
 * performance and classifies each query into an actionable bucket.
 *
 * Heuristics (tunable):
 *  - SCALE   : strong purchase share + healthy ACOS + low/moderate spend
 *  - CUT     : meaningful spend + poor ACOS + weak purchase share
 *  - TEST    : high impression share but low click share (listing/creative gap)
 *  - DEFEND  : strong purchase share already + low spend (protect from competitors)
 *  - MAINTAIN: everything else
 */
export async function analyzeSqp(
  clientId: string,
  range: DateRange,
  opts: { targetAcos?: number } = {}
): Promise<SqpAnalyzedRow[]> {
  const targetAcos = opts.targetAcos ?? 0.3;

  const [sqpRows, ppcRows] = await Promise.all([
    prisma.sQPMetric.groupBy({
      by: ["query"],
      where: { clientId, date: { gte: range.from, lte: range.to } },
      _avg: {
        impressionShare: true,
        clickShare: true,
        cartAddShare: true,
        purchaseShare: true,
      },
    }),
    prisma.searchTerm.groupBy({
      by: ["query"],
      where: { campaign: { clientId }, date: { gte: range.from, lte: range.to } },
      _sum: { spend: true, clicks: true, orders: true, sales: true },
    }),
  ]);

  const ppcMap = new Map(ppcRows.map((r) => [normalize(r.query), r._sum]));

  const totalSpend = ppcRows.reduce((s, r) => s + (r._sum.spend ?? 0), 0);

  const analyzed = sqpRows.map((s) => {
    const ppc = ppcMap.get(normalize(s.query));
    const ppcSpend = ppc?.spend ?? 0;
    const ppcClicks = ppc?.clicks ?? 0;
    const ppcOrders = ppc?.orders ?? 0;
    const ppcSales = ppc?.sales ?? 0;
    const acos = ratio(ppcSpend, ppcSales);
    const roas = ratio(ppcSales, ppcSpend);

    const row = {
      query: s.query,
      impressionShare: s._avg.impressionShare ?? 0,
      clickShare: s._avg.clickShare ?? 0,
      cartAddShare: s._avg.cartAddShare ?? 0,
      purchaseShare: s._avg.purchaseShare ?? 0,
      ppcSpend: round(ppcSpend),
      ppcClicks,
      ppcOrders,
      ppcSales: round(ppcSales),
      acos: round(acos),
      roas: round(roas),
    };

    const { action, reason, priority } = classify(row, {
      targetAcos,
      totalSpend,
    });
    return { ...row, action, reason, priority };
  });

  return analyzed.sort((a, b) => b.priority - a.priority);
}

function classify(
  r: Omit<SqpAnalyzedRow, "action" | "reason" | "priority">,
  ctx: { targetAcos: number; totalSpend: number }
): { action: SqpAction; reason: string; priority: number } {
  const spendShare = ctx.totalSpend ? r.ppcSpend / ctx.totalSpend : 0;
  const hasSpend = r.ppcSpend > 0;
  const goodAcos = hasSpend && r.acos > 0 && r.acos <= ctx.targetAcos;
  const badAcos = hasSpend && (r.acos === 0 ? false : r.acos > ctx.targetAcos * 1.5);

  // CUT: real money going out with poor efficiency and weak demand capture.
  if (hasSpend && badAcos && r.purchaseShare < 0.15) {
    return {
      action: "CUT",
      reason: `ACOS ${(r.acos * 100).toFixed(0)}% exceeds target with only ${(
        r.purchaseShare * 100
      ).toFixed(0)}% purchase share — reduce bids or negate.`,
      priority: clamp(60 + spendShare * 200),
    };
  }

  // SCALE: converting well, efficient, and not yet heavily invested.
  if (goodAcos && r.purchaseShare >= 0.2 && spendShare < 0.08) {
    return {
      action: "SCALE",
      reason: `Strong ${(r.purchaseShare * 100).toFixed(
        0
      )}% purchase share at ${(r.acos * 100).toFixed(
        0
      )}% ACOS with low spend — increase bids/budget.`,
      priority: clamp(70 + r.purchaseShare * 40),
    };
  }

  // TEST: lots of eyeballs but few clicks — listing/creative/price problem.
  if (r.impressionShare >= 0.25 && r.clickShare < r.impressionShare * 0.5) {
    return {
      action: "TEST",
      reason: `High impression share (${(r.impressionShare * 100).toFixed(
        0
      )}%) but low click share (${(r.clickShare * 100).toFixed(
        0
      )}%) — test title, main image and price.`,
      priority: clamp(40 + r.impressionShare * 50),
    };
  }

  // DEFEND: already winning the query organically; protect it.
  if (r.purchaseShare >= 0.3 && spendShare < 0.03) {
    return {
      action: "DEFEND",
      reason: `Dominant ${(r.purchaseShare * 100).toFixed(
        0
      )}% purchase share with minimal PPC — defend with branded/exact coverage.`,
      priority: clamp(45 + r.purchaseShare * 30),
    };
  }

  return {
    action: "MAINTAIN",
    reason: "Performance within expected range — keep monitoring.",
    priority: clamp(10 + spendShare * 50),
  };
}

function normalize(q: string): string {
  return q.trim().toLowerCase();
}

function round(n: number, digits = 2): number {
  const f = 10 ** digits;
  return Math.round(n * f) / f;
}

function clamp(n: number, min = 0, max = 100): number {
  return Math.max(min, Math.min(max, Math.round(n)));
}
