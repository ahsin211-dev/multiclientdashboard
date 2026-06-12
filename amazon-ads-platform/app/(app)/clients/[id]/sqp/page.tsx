"use client";

import { useState, useEffect } from "react";
import { use } from "react";
import { Header } from "@/components/layout/header";
import { SQPTable } from "@/components/tables/sqp-table";
import { generateSQPData, MOCK_CLIENTS } from "@/lib/mock-data";
import { SQPRow } from "@/lib/types";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Activity, Shield, Eye } from "lucide-react";

interface PageProps {
  params: Promise<{ id: string }>;
}

const actionSummary = [
  { action: "SCALE" as const, label: "Scale", icon: TrendingUp, color: "text-emerald-600", bg: "bg-emerald-50", description: "High purchase share, low PPC — increase bids" },
  { action: "CUT" as const, label: "Cut", icon: TrendingDown, color: "text-red-600", bg: "bg-red-50", description: "High spend, low conversion — reduce or pause" },
  { action: "TEST" as const, label: "Test", icon: Activity, color: "text-amber-600", bg: "bg-amber-50", description: "High impressions, low CTR — optimize creative" },
  { action: "DEFEND" as const, label: "Defend", icon: Shield, color: "text-blue-600", bg: "bg-blue-50", description: "Strong organic share — increase PPC coverage" },
  { action: "MONITOR" as const, label: "Monitor", icon: Eye, color: "text-gray-600", bg: "bg-gray-50", description: "Moderate performance — watch for trends" },
];

export default function SQPPage({ params }: PageProps) {
  const { id: clientId } = use(params);
  const [dateRange, setDateRange] = useState("last30");
  const [data, setData] = useState<SQPRow[]>([]);
  const [filter, setFilter] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const client = MOCK_CLIENTS.find((c) => c.id === clientId) ?? MOCK_CLIENTS[0];

  useEffect(() => {
    setLoading(true);
    setTimeout(() => {
      setData(generateSQPData());
      setLoading(false);
    }, 400);
  }, [dateRange, clientId]);

  const filteredData = filter ? data.filter((d) => d.action === filter) : data;

  const actionCounts = actionSummary.map((a) => ({
    ...a,
    count: data.filter((d) => d.action === a.action).length,
    totalSpend: data.filter((d) => d.action === a.action).reduce((s, d) => s + d.ppcSpend, 0),
  }));

  const wastedSpend = data.filter((d) => d.action === "CUT").reduce((s, d) => s + d.ppcSpend, 0);
  const scaleOpportunity = data.filter((d) => d.action === "SCALE").reduce((s, d) => s + d.ppcSales * 0.3, 0);

  return (
    <div className="flex flex-col h-full">
      <Header
        title="SQP Analyzer"
        subtitle={`${client.brandName} — Search Query Performance Intelligence`}
        dateRange={dateRange}
        onDateRangeChange={setDateRange}
      />

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="border-l-4 border-l-red-400">
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground mb-1">Estimated Wasted Spend</p>
              <p className="text-2xl font-bold text-red-600">${Math.round(wastedSpend).toLocaleString()}</p>
              <p className="text-xs text-muted-foreground mt-1">from queries to cut</p>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-emerald-400">
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground mb-1">Scale Opportunity</p>
              <p className="text-2xl font-bold text-emerald-600">+${Math.round(scaleOpportunity).toLocaleString()}</p>
              <p className="text-xs text-muted-foreground mt-1">estimated additional sales</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground mb-1">Total Queries Analyzed</p>
              <p className="text-2xl font-bold">{data.length}</p>
              <p className="text-xs text-muted-foreground mt-1">from SQP report</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground mb-1">Queries Needing Action</p>
              <p className="text-2xl font-bold">{data.filter((d) => d.action !== "MONITOR").length}</p>
              <p className="text-xs text-muted-foreground mt-1">scale, cut, test, or defend</p>
            </CardContent>
          </Card>
        </div>

        {/* Action Filter Pills */}
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => setFilter(null)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
              filter === null
                ? "bg-foreground text-background"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
          >
            All ({data.length})
          </button>
          {actionCounts.map((a) => {
            const Icon = a.icon;
            return (
              <button
                key={a.action}
                onClick={() => setFilter(filter === a.action ? null : a.action)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                  filter === a.action
                    ? `${a.bg} ${a.color} ring-2 ring-current ring-offset-1`
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {a.label} ({a.count})
              </button>
            );
          })}
        </div>

        {/* Action Legend */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {actionCounts.map((a) => {
            const Icon = a.icon;
            return (
              <Card
                key={a.action}
                className={`cursor-pointer transition-all hover:shadow-md ${filter === a.action ? "ring-2 ring-primary" : ""}`}
                onClick={() => setFilter(filter === a.action ? null : a.action)}
              >
                <CardContent className={`p-3 ${a.bg} rounded-lg`}>
                  <div className={`flex items-center gap-1.5 ${a.color} mb-1`}>
                    <Icon className="w-4 h-4" />
                    <span className="text-sm font-semibold">{a.label}</span>
                    <Badge variant="secondary" className="ml-auto text-xs py-0">{a.count}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">{a.description}</p>
                  {a.totalSpend > 0 && (
                    <p className="text-xs font-medium mt-1 text-muted-foreground">
                      ${Math.round(a.totalSpend).toLocaleString()} PPC spend
                    </p>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* SQP Table */}
        {loading ? (
          <Card>
            <CardContent className="p-8 text-center text-muted-foreground">
              Loading SQP data...
            </CardContent>
          </Card>
        ) : (
          <SQPTable data={filteredData} title={filter ? `${filter} Queries` : "All Search Queries"} />
        )}
      </div>
    </div>
  );
}
