import { ArrowDownRight, ArrowUpRight } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function MetricCard({
  label,
  value,
  delta,
  isPercent = false,
  currency = false
}: {
  label: string;
  value: number;
  delta: number;
  isPercent?: boolean;
  currency?: boolean;
}) {
  const positive = delta >= 0;
  const formattedValue = currency
    ? `$${value.toLocaleString(undefined, { maximumFractionDigits: 2 })}`
    : isPercent
      ? `${(value * 100).toFixed(2)}%`
      : value.toLocaleString(undefined, { maximumFractionDigits: 2 });

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-slate-500">{label}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-semibold text-slate-900">{formattedValue}</div>
        <div
          className={cn(
            "mt-2 flex items-center gap-1 text-xs font-medium",
            positive ? "text-emerald-700" : "text-red-700"
          )}
        >
          {positive ? <ArrowUpRight className="h-3.5 w-3.5" /> : <ArrowDownRight className="h-3.5 w-3.5" />}
          {Math.abs(delta).toFixed(2)}% vs previous period
        </div>
      </CardContent>
    </Card>
  );
}
