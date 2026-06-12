"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  Line,
  ComposedChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { format, parseISO } from "date-fns";
import type { TrendPoint } from "@/lib/analytics/types";

const fmtDate = (d: string) => {
  try {
    return format(parseISO(d), "MMM d");
  } catch {
    return d;
  }
};

/** Spend vs Sales area chart with ACOS overlay. */
export function SpendSalesChart({ data }: { data: TrendPoint[] }) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <ComposedChart data={data} margin={{ top: 10, right: 8, left: -10, bottom: 0 }}>
        <defs>
          <linearGradient id="salesFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="hsl(243 75% 59%)" stopOpacity={0.3} />
            <stop offset="95%" stopColor="hsl(243 75% 59%)" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="spendFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="hsl(38 92% 50%)" stopOpacity={0.25} />
            <stop offset="95%" stopColor="hsl(38 92% 50%)" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 13% 91%)" vertical={false} />
        <XAxis dataKey="date" tickFormatter={fmtDate} fontSize={11} tickLine={false} axisLine={false} />
        <YAxis yAxisId="left" fontSize={11} tickLine={false} axisLine={false} width={48} />
        <YAxis
          yAxisId="right"
          orientation="right"
          fontSize={11}
          tickLine={false}
          axisLine={false}
          width={40}
          tickFormatter={(v) => `${(v * 100).toFixed(0)}%`}
        />
        <Tooltip
          contentStyle={{ borderRadius: 8, border: "1px solid hsl(220 13% 91%)", fontSize: 12 }}
          labelFormatter={fmtDate}
          formatter={(value: number, name: string) =>
            name === "ACOS" ? `${(value * 100).toFixed(0)}%` : `$${Number(value).toFixed(0)}`
          }
        />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        <Area
          yAxisId="left"
          type="monotone"
          dataKey="sales"
          name="Ad Sales"
          stroke="hsl(243 75% 59%)"
          fill="url(#salesFill)"
          strokeWidth={2}
        />
        <Area
          yAxisId="left"
          type="monotone"
          dataKey="spend"
          name="Spend"
          stroke="hsl(38 92% 50%)"
          fill="url(#spendFill)"
          strokeWidth={2}
        />
        <Line
          yAxisId="right"
          type="monotone"
          dataKey="acos"
          name="ACOS"
          stroke="hsl(0 72% 51%)"
          strokeWidth={2}
          dot={false}
        />
      </ComposedChart>
    </ResponsiveContainer>
  );
}

/** Simple revenue area chart. */
export function RevenueChart({ data }: { data: TrendPoint[] }) {
  return (
    <ResponsiveContainer width="100%" height={240}>
      <AreaChart data={data} margin={{ top: 10, right: 8, left: -10, bottom: 0 }}>
        <defs>
          <linearGradient id="revFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="hsl(142 71% 45%)" stopOpacity={0.3} />
            <stop offset="95%" stopColor="hsl(142 71% 45%)" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 13% 91%)" vertical={false} />
        <XAxis dataKey="date" tickFormatter={fmtDate} fontSize={11} tickLine={false} axisLine={false} />
        <YAxis fontSize={11} tickLine={false} axisLine={false} width={48} />
        <Tooltip
          contentStyle={{ borderRadius: 8, border: "1px solid hsl(220 13% 91%)", fontSize: 12 }}
          labelFormatter={fmtDate}
          formatter={(value: number) => `$${Number(value).toFixed(0)}`}
        />
        <Area
          type="monotone"
          dataKey="revenue"
          name="Revenue"
          stroke="hsl(142 71% 45%)"
          fill="url(#revFill)"
          strokeWidth={2}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
