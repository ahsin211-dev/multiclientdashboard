"use client";

import { Header } from "@/components/layout/header";
import { MOCK_CLIENTS } from "@/lib/mock-data";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import Link from "next/link";
import {
  BarChart3,
  MessageSquare,
  Settings,
  Zap,
  Plus,
  ExternalLink,
  Clock,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { generateMetricSummary } from "@/lib/mock-data";

function SyncStatusBadge({ status }: { status: string }) {
  if (status === "completed") {
    return (
      <div className="flex items-center gap-1 text-xs text-emerald-600">
        <CheckCircle2 className="w-3.5 h-3.5" />
        Synced
      </div>
    );
  }
  if (status === "running") {
    return (
      <div className="flex items-center gap-1 text-xs text-blue-500">
        <Clock className="w-3.5 h-3.5 animate-pulse" />
        Syncing...
      </div>
    );
  }
  return (
    <div className="flex items-center gap-1 text-xs text-muted-foreground">
      <AlertCircle className="w-3.5 h-3.5" />
      Not connected
    </div>
  );
}

export default function ClientsPage() {
  return (
    <div className="flex flex-col h-full">
      <Header title="Clients" subtitle="Manage all client accounts">
        <Link href="/clients/new">
          <Button size="sm" className="gap-2">
            <Plus className="w-4 h-4" />
            Add Client
          </Button>
        </Link>
      </Header>

      <div className="flex-1 p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {MOCK_CLIENTS.map((client) => {
            const metrics = generateMetricSummary();
            return (
              <Card
                key={client.id}
                className={`overflow-hidden hover:shadow-lg transition-all ${!client.isActive ? "opacity-60" : ""}`}
              >
                <CardContent className="p-0">
                  {/* Header */}
                  <div className="flex items-center gap-3 p-5 border-b">
                    <Avatar className="w-10 h-10">
                      <AvatarFallback
                        className="text-sm font-bold text-white"
                        style={{ background: "var(--primary)" }}
                      >
                        {client.brandName.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold">{client.name}</h3>
                        <Badge variant={client.isActive ? "default" : "secondary"} className="text-xs">
                          {client.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {client.brandName} · Amazon {client.marketplace}
                      </p>
                    </div>
                    <SyncStatusBadge status="never" />
                  </div>

                  {/* Metrics */}
                  <div className="grid grid-cols-4 divide-x p-0">
                    {[
                      { label: "Spend", value: `$${metrics.spend.toLocaleString()}` },
                      { label: "Sales", value: `$${metrics.sales.toLocaleString()}` },
                      { label: "ACOS", value: `${metrics.acos}%`, colored: true, good: metrics.acos < 25 },
                      { label: "ROAS", value: `${metrics.roas}x`, colored: true, good: metrics.roas > 4 },
                    ].map((m) => (
                      <div key={m.label} className="py-3 px-4 text-center">
                        <p className="text-xs text-muted-foreground mb-0.5">{m.label}</p>
                        <p
                          className={`text-sm font-bold ${
                            m.colored
                              ? m.good
                                ? "text-emerald-600"
                                : "text-red-500"
                              : "text-foreground"
                          }`}
                        >
                          {m.value}
                        </p>
                      </div>
                    ))}
                  </div>

                  {/* Notes */}
                  {client.notes && (
                    <div className="px-5 py-2 bg-muted/30 text-xs text-muted-foreground border-t">
                      {client.notes}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex items-center gap-2 p-4 border-t bg-muted/20">
                    <Link href={`/clients/${client.id}/dashboard`} className="flex-1">
                      <Button variant="default" size="sm" className="w-full gap-2">
                        <BarChart3 className="w-3.5 h-3.5" />
                        Dashboard
                      </Button>
                    </Link>
                    <Link href={`/clients/${client.id}/chat`}>
                      <Button variant="outline" size="sm" className="gap-2">
                        <MessageSquare className="w-3.5 h-3.5" />
                        AI Chat
                      </Button>
                    </Link>
                    <Link href={`/clients/${client.id}/audit`}>
                      <Button variant="outline" size="sm" className="gap-2">
                        <Zap className="w-3.5 h-3.5" />
                        Audit
                      </Button>
                    </Link>
                    <Link href={`/clients/${client.id}/settings`}>
                      <Button variant="ghost" size="icon" className="w-8 h-8">
                        <Settings className="w-3.5 h-3.5" />
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Empty state for add client */}
        <div className="mt-5">
          <Link href="/clients/new">
            <Card className="border-dashed hover:border-primary hover:bg-primary/5 transition-all cursor-pointer">
              <CardContent className="py-8 flex flex-col items-center gap-2 text-muted-foreground">
                <Plus className="w-8 h-8" />
                <p className="font-medium">Add New Client</p>
                <p className="text-sm">Connect an Amazon Ads account to get started</p>
              </CardContent>
            </Card>
          </Link>
        </div>
      </div>
    </div>
  );
}
