import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function MetricCard({
  title,
  value,
  delta,
  inverse = false,
}: {
  title: string;
  value: string;
  delta?: number;
  inverse?: boolean;
}) {
  const positive = (delta ?? 0) >= 0;
  const good = inverse ? !positive : positive;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-slate-500">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-end justify-between gap-3">
          <p className="text-2xl font-bold text-slate-950">{value}</p>
          {typeof delta === "number" ? (
            <span className={cn("flex items-center gap-1 text-xs font-semibold", good ? "text-emerald-600" : "text-rose-600")}>
              {positive ? <ArrowUpRight className="h-3.5 w-3.5" /> : <ArrowDownRight className="h-3.5 w-3.5" />}
              {Math.abs(delta).toFixed(1)}%
            </span>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}
