import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn, formatPercent } from "@/lib/utils";

export interface MetricCardProps {
  label: string;
  value: string;
  /** Period-over-period change as a fraction (e.g. 0.12 = +12%). */
  delta?: number;
  /** Whether an increase is good (spend up is bad, sales up is good, etc). */
  higherIsBetter?: boolean;
  hint?: string;
}

export function MetricCard({
  label,
  value,
  delta,
  higherIsBetter = true,
  hint,
}: MetricCardProps) {
  const hasDelta = typeof delta === "number" && Number.isFinite(delta);
  const up = (delta ?? 0) >= 0;
  const good = hasDelta ? (up ? higherIsBetter : !higherIsBetter) : true;

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {label}
          </p>
          {hasDelta && (
            <span
              className={cn(
                "inline-flex items-center gap-0.5 rounded-md px-1.5 py-0.5 text-xs font-medium",
                good ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"
              )}
            >
              {up ? (
                <ArrowUpRight className="h-3 w-3" />
              ) : (
                <ArrowDownRight className="h-3 w-3" />
              )}
              {formatPercent(Math.abs(delta!))}
            </span>
          )}
        </div>
        <p className="mt-2 text-2xl font-semibold tracking-tight">{value}</p>
        {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
      </CardContent>
    </Card>
  );
}
