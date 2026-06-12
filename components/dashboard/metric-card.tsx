import { ArrowDownRight, ArrowUpRight } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCompactNumber, formatCurrency, formatPercent } from "@/lib/utils";
import { type MetricCardValue } from "@/lib/analytics/service";

type MetricCardProps = {
  metric: MetricCardValue;
  currency: string;
};

const percentMetrics = new Set(["tacos", "acos", "ctr", "cvr"]);
const currencyMetrics = new Set(["spend", "sales", "revenue", "cpc"]);

function formatMetric(metric: MetricCardValue, currency: string) {
  if (percentMetrics.has(metric.key)) {
    return formatPercent(metric.value);
  }

  if (currencyMetrics.has(metric.key)) {
    return formatCurrency(metric.value, currency);
  }

  if (metric.key === "roas") {
    return `${metric.value.toFixed(2)}x`;
  }

  return formatCompactNumber(metric.value);
}

export function MetricCard({ metric, currency }: MetricCardProps) {
  const positive = metric.delta >= 0;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium text-slate-500">{metric.label}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-end justify-between gap-3">
          <p className="text-2xl font-semibold tracking-tight text-slate-950">
            {formatMetric(metric, currency)}
          </p>
          <div
            className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium ${
              positive ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"
            }`}
          >
            {positive ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
            {formatPercent(Math.abs(metric.delta))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
