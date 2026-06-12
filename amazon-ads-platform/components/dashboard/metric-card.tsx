import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface MetricCardProps {
  title: string;
  value: string;
  change?: number;
  changeLabel?: string;
  icon?: React.ReactNode;
  description?: string;
  highlight?: "good" | "bad" | "neutral";
  prefix?: string;
  suffix?: string;
}

export function MetricCard({
  title,
  value,
  change,
  changeLabel,
  icon,
  description,
  highlight,
  prefix,
  suffix,
}: MetricCardProps) {
  const changePositive = change !== undefined && change > 0;
  const changeNegative = change !== undefined && change < 0;
  const changeNeutral = change === undefined || change === 0;

  // For ACOS/TACOS/CPC, lower is better
  const isInverseMetric = highlight === "bad";
  const trendGood = isInverseMetric ? changeNegative : changePositive;
  const trendBad = isInverseMetric ? changePositive : changeNegative;

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
              {title}
            </p>
            <p className="text-2xl font-bold text-foreground tracking-tight">
              {prefix}{value}{suffix}
            </p>
            {description && (
              <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
            )}
          </div>
          {icon && (
            <div className="p-2 rounded-lg bg-secondary shrink-0">
              {icon}
            </div>
          )}
        </div>

        {change !== undefined && (
          <div className="mt-3 flex items-center gap-1.5">
            <div
              className={cn(
                "flex items-center gap-1 text-xs font-medium",
                trendGood && "text-emerald-600",
                trendBad && "text-red-500",
                changeNeutral && "text-muted-foreground"
              )}
            >
              {trendGood && <TrendingUp className="w-3.5 h-3.5" />}
              {trendBad && <TrendingDown className="w-3.5 h-3.5" />}
              {changeNeutral && <Minus className="w-3.5 h-3.5" />}
              {change > 0 ? "+" : ""}{typeof change === "number" ? change.toFixed(1) : change}%
            </div>
            {changeLabel && (
              <span className="text-xs text-muted-foreground">{changeLabel}</span>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
