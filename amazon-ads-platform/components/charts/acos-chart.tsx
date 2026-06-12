"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import { ChartDataPoint } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface AcosChartProps {
  data: ChartDataPoint[];
  targetAcos?: number;
  title?: string;
}

function formatDate(dateStr: string) {
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function AcosChart({ data, targetAcos = 25, title = "ACOS Trend" }: AcosChartProps) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold">{title}</CardTitle>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <div className="w-3 h-0.5 bg-red-400 border-dashed" />
            Target {targetAcos}%
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.91 0 0)" />
            <XAxis
              dataKey="date"
              tickFormatter={formatDate}
              tick={{ fontSize: 11, fill: "oklch(0.48 0 0)" }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              tickFormatter={(v) => `${v}%`}
              tick={{ fontSize: 11, fill: "oklch(0.48 0 0)" }}
              tickLine={false}
              axisLine={false}
              width={40}
            />
            <Tooltip
              formatter={(value) => [`${Number(value)}%`, "ACOS"]}
              labelFormatter={(label) => formatDate(String(label))}
              contentStyle={{
                background: "white",
                border: "1px solid oklch(0.91 0 0)",
                borderRadius: "8px",
                fontSize: "12px",
              }}
            />
            <ReferenceLine
              y={targetAcos}
              stroke="oklch(0.577 0.245 27.325)"
              strokeDasharray="4 4"
              strokeWidth={1.5}
            />
            <Line
              type="monotone"
              dataKey="acos"
              stroke="oklch(0.7 0.15 30)"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
