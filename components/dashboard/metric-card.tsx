import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn, formatCurrency, formatNumber, formatPercent } from "@/lib/utils";
import type { MetricValue } from "@/lib/types";
import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";

interface MetricCardProps {
  title: string;
  metric: MetricValue;
  format?: "currency" | "percent" | "number" | "ratio";
  invertDelta?: boolean;
}

function formatValue(value: number, format: MetricCardProps["format"]) {
  switch (format) {
    case "currency":
      return formatCurrency(value);
    case "percent":
      return formatPercent(value);
    case "ratio":
      return `${formatNumber(value, 2)}x`;
    default:
      return formatNumber(value);
  }
}

export function MetricCard({ title, metric, format = "number", invertDelta = false }: MetricCardProps) {
  const delta = metric.delta ?? 0;
  const isPositive = invertDelta ? delta < 0 : delta > 0;
  const isNeutral = Math.abs(delta) < 0.5;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{formatValue(metric.value, format)}</div>
        {metric.previous !== undefined && (
          <div className="mt-1 flex items-center text-xs text-muted-foreground">
            {isNeutral ? (
              <Minus className="mr-1 h-3 w-3" />
            ) : isPositive ? (
              <ArrowUpRight className="mr-1 h-3 w-3 text-emerald-600" />
            ) : (
              <ArrowDownRight className="mr-1 h-3 w-3 text-red-600" />
            )}
            <span
              className={cn(
                !isNeutral && (isPositive ? "text-emerald-600" : "text-red-600")
              )}
            >
              {formatPercent(Math.abs(delta), 1)} vs prior
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
