"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { ChartDataPoint } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface SpendSalesChartProps {
  data: ChartDataPoint[];
  title?: string;
}

function formatCurrency(value: number) {
  if (value >= 1000) return `$${(value / 1000).toFixed(1)}k`;
  return `$${value}`;
}

function formatDate(dateStr: string) {
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function SpendSalesChart({ data, title = "Spend vs Sales" }: SpendSalesChartProps) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={260}>
          <AreaChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="oklch(0.6 0.2 264)" stopOpacity={0.25} />
                <stop offset="95%" stopColor="oklch(0.6 0.2 264)" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="spendGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="oklch(0.65 0.18 160)" stopOpacity={0.25} />
                <stop offset="95%" stopColor="oklch(0.65 0.18 160)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.91 0 0)" />
            <XAxis
              dataKey="date"
              tickFormatter={formatDate}
              tick={{ fontSize: 11, fill: "oklch(0.48 0 0)" }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              tickFormatter={formatCurrency}
              tick={{ fontSize: 11, fill: "oklch(0.48 0 0)" }}
              tickLine={false}
              axisLine={false}
              width={45}
            />
            <Tooltip
              formatter={(value, name) => [
                `$${Number(value).toLocaleString()}`,
                name === "sales" ? "Sales" : "Spend",
              ]}
              labelFormatter={(label) => formatDate(String(label))}
              contentStyle={{
                background: "white",
                border: "1px solid oklch(0.91 0 0)",
                borderRadius: "8px",
                fontSize: "12px",
              }}
            />
            <Legend
              formatter={(value) => (value === "sales" ? "Sales" : "Spend")}
              wrapperStyle={{ fontSize: "12px" }}
            />
            <Area
              type="monotone"
              dataKey="sales"
              stroke="oklch(0.6 0.2 264)"
              strokeWidth={2}
              fill="url(#salesGrad)"
            />
            <Area
              type="monotone"
              dataKey="spend"
              stroke="oklch(0.65 0.18 160)"
              strokeWidth={2}
              fill="url(#spendGrad)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
