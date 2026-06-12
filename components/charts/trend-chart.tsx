"use client";

import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { TrendPoint } from "@/lib/analytics/types";
import { formatCurrency } from "@/lib/utils";

export function TrendChart({ data }: { data: TrendPoint[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Performance trend</CardTitle>
        <CardDescription>Spend, ad sales, and total revenue over the selected range.</CardDescription>
      </CardHeader>
      <CardContent className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              <linearGradient id="sales" x1="0" x2="0" y1="0" y2="1">
                <stop offset="5%" stopColor="#2563eb" stopOpacity={0.28} />
                <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="spend" x1="0" x2="0" y1="0" y2="1">
                <stop offset="5%" stopColor="#f97316" stopOpacity={0.24} />
                <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="date" tickLine={false} axisLine={false} tick={{ fill: "#64748b", fontSize: 12 }} />
            <YAxis tickLine={false} axisLine={false} tick={{ fill: "#64748b", fontSize: 12 }} tickFormatter={(value) => `$${Number(value) / 1000}k`} />
            <Tooltip formatter={(value) => formatCurrency(Number(value))} />
            <Area type="monotone" dataKey="sales" stroke="#2563eb" fillOpacity={1} fill="url(#sales)" strokeWidth={2} />
            <Area type="monotone" dataKey="spend" stroke="#f97316" fillOpacity={1} fill="url(#spend)" strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
