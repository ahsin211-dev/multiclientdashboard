import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn, formatCurrency, formatNumber, formatPercent } from "@/lib/utils";
import { ArrowDown, ArrowUp, Minus } from "lucide-react";

interface MetricCardProps {
  title: string;
  value: number;
  format?: "currency" | "number" | "percent" | "ratio";
  change?: number;
  invertChange?: boolean;
  subtitle?: string;
}

export function MetricCard({
  title,
  value,
  format = "number",
  change,
  invertChange = false,
  subtitle,
}: MetricCardProps) {
  const formattedValue =
    format === "currency"
      ? formatCurrency(value)
      : format === "percent"
        ? formatPercent(value)
        : format === "ratio"
          ? `${value.toFixed(2)}x`
          : formatNumber(value);

  const isPositive = change !== undefined && (invertChange ? change < 0 : change > 0);
  const isNegative = change !== undefined && (invertChange ? change > 0 : change < 0);
  const isNeutral = change !== undefined && change === 0;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        {change !== undefined && (
          <div
            className={cn(
              "flex items-center gap-0.5 text-xs font-medium",
              isPositive && "text-emerald-600",
              isNegative && "text-red-600",
              isNeutral && "text-muted-foreground"
            )}
          >
            {isPositive && <ArrowUp className="h-3 w-3" />}
            {isNegative && <ArrowDown className="h-3 w-3" />}
            {isNeutral && <Minus className="h-3 w-3" />}
            {Math.abs(change).toFixed(1)}%
          </div>
        )}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{formattedValue}</div>
        {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
      </CardContent>
    </Card>
  );
}
