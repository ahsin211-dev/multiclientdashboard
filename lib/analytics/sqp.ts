import type { SqpAction, SqpInsight } from "@/lib/analytics/types";

export function classifySqpAction(insight: Pick<SqpInsight, "purchaseShare" | "impressionShare" | "clickShare" | "ppcSpend" | "acos" | "roas">): {
  recommendedAction: SqpAction;
  reason: string;
} {
  if (insight.purchaseShare >= 7 && insight.ppcSpend < 250 && insight.roas >= 4) {
    return {
      recommendedAction: "Scale",
      reason: "High purchase share and efficient conversion with low PPC investment.",
    };
  }

  if (insight.ppcSpend >= 500 && insight.purchaseShare < 4 && insight.acos >= 45) {
    return {
      recommendedAction: "Cut",
      reason: "High PPC spend with weak purchase share and poor ACOS.",
    };
  }

  if (insight.impressionShare >= 15 && insight.clickShare < 8) {
    return {
      recommendedAction: "Test",
      reason: "Strong impression share but low click share; test creative, title, price, or offer.",
    };
  }

  return {
    recommendedAction: "Defend",
    reason: "Strong organic/SQP share with efficient PPC; competitors are likely bidding.",
  };
}

export function normalizeSqpInsight(row: Omit<SqpInsight, "recommendedAction" | "reason">): SqpInsight {
  const action = classifySqpAction(row);
  return {
    ...row,
    ...action,
  };
}
