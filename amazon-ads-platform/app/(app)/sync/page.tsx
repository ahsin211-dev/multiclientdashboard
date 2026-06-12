"use client";

import { useState } from "react";
import { Header } from "@/components/layout/header";
import { MOCK_CLIENTS } from "@/lib/mock-data";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  CheckCircle2,
  XCircle,
  Clock,
  Loader2,
  RefreshCw,
  Play,
  Activity,
} from "lucide-react";
import { toast } from "sonner";

type JobStatus = "PENDING" | "RUNNING" | "COMPLETED" | "FAILED";

interface SyncJob {
  id: string;
  clientName: string;
  type: string;
  status: JobStatus;
  startedAt: string;
  completedAt?: string;
  recordsSync: number;
  error?: string;
}

const mockJobs: SyncJob[] = [
  { id: "job-1", clientName: "TechGadgets Pro", type: "FULL_SYNC", status: "COMPLETED", startedAt: "2026-06-12 06:00:00", completedAt: "2026-06-12 06:04:23", recordsSync: 1247 },
  { id: "job-2", clientName: "HomeLife Essentials", type: "CAMPAIGNS", status: "COMPLETED", startedAt: "2026-06-12 06:01:00", completedAt: "2026-06-12 06:02:11", recordsSync: 32 },
  { id: "job-3", clientName: "FitActive Sports", type: "SQP_DATA", status: "FAILED", startedAt: "2026-06-12 06:01:30", error: "SP-API token expired — please reconnect account", recordsSync: 0 },
  { id: "job-4", clientName: "BeautyGlow Cosmetics", type: "SALES_METRICS", status: "PENDING", startedAt: "2026-06-12 06:02:00", recordsSync: 0 },
];

const statusConfig = {
  PENDING: { icon: Clock, color: "text-amber-500", bg: "bg-amber-50", label: "Pending" },
  RUNNING: { icon: Loader2, color: "text-blue-500", bg: "bg-blue-50", label: "Running" },
  COMPLETED: { icon: CheckCircle2, color: "text-emerald-500", bg: "bg-emerald-50", label: "Completed" },
  FAILED: { icon: XCircle, color: "text-red-500", bg: "bg-red-50", label: "Failed" },
};

export default function SyncPage() {
  const [jobs, setJobs] = useState<SyncJob[]>(mockJobs);
  const [triggering, setTriggering] = useState<string | null>(null);

  const triggerSync = async (clientId: string, clientName: string, type: string) => {
    setTriggering(clientId);
    try {
      const response = await fetch("/api/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientId, type }),
      });

      if (response.ok) {
        const data = await response.json();
        toast.success(`Sync started for ${clientName}`, { description: `Job ID: ${data.jobId}` });
        setJobs((prev) => [
          {
            id: data.jobId,
            clientName,
            type,
            status: "PENDING",
            startedAt: new Date().toLocaleString(),
            recordsSync: 0,
          },
          ...prev,
        ]);
      } else {
        toast.error("Sync failed to start", { description: "Check API connection" });
      }
    } catch {
      toast.info("Demo mode", { description: "Connect Amazon APIs to run real syncs" });
    } finally {
      setTriggering(null);
    }
  };

  const completedJobs = jobs.filter((j) => j.status === "COMPLETED").length;
  const failedJobs = jobs.filter((j) => j.status === "FAILED").length;
  const pendingJobs = jobs.filter((j) => j.status === "PENDING" || j.status === "RUNNING").length;

  return (
    <div className="flex flex-col h-full">
      <Header title="Sync Jobs" subtitle="Monitor and trigger data synchronization jobs" />

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Summary */}
        <div className="grid grid-cols-3 gap-4">
          <Card className="border-l-4 border-l-emerald-400">
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">Completed</p>
              <p className="text-2xl font-bold text-emerald-600">{completedJobs}</p>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-amber-400">
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">Pending / Running</p>
              <p className="text-2xl font-bold text-amber-600">{pendingJobs}</p>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-red-400">
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">Failed</p>
              <p className="text-2xl font-bold text-red-600">{failedJobs}</p>
            </CardContent>
          </Card>
        </div>

        {/* Trigger Syncs */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Play className="w-4 h-4" />
              Trigger Manual Sync
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {MOCK_CLIENTS.filter((c) => c.isActive).map((client) => (
                <div key={client.id} className="flex items-center justify-between p-3 rounded-lg border">
                  <div>
                    <p className="text-sm font-medium">{client.brandName}</p>
                    <p className="text-xs text-muted-foreground">{client.marketplace} · Last sync: 2h ago</p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={triggering === client.id}
                      onClick={() => triggerSync(client.id, client.brandName, "CAMPAIGNS")}
                    >
                      Campaigns
                    </Button>
                    <Button
                      size="sm"
                      disabled={triggering === client.id}
                      onClick={() => triggerSync(client.id, client.brandName, "FULL_SYNC")}
                      className="gap-1.5"
                    >
                      {triggering === client.id ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <RefreshCw className="w-3.5 h-3.5" />
                      )}
                      Full Sync
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Job History */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Activity className="w-4 h-4" />
              Job History
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40 hover:bg-muted/40">
                  <TableHead className="font-semibold text-xs">Client</TableHead>
                  <TableHead className="font-semibold text-xs">Type</TableHead>
                  <TableHead className="font-semibold text-xs">Status</TableHead>
                  <TableHead className="font-semibold text-xs">Started</TableHead>
                  <TableHead className="font-semibold text-xs text-right">Records</TableHead>
                  <TableHead className="font-semibold text-xs">Error</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {jobs.map((job) => {
                  const cfg = statusConfig[job.status];
                  const Icon = cfg.icon;
                  return (
                    <TableRow key={job.id} className="hover:bg-muted/30">
                      <TableCell className="text-sm font-medium">{job.clientName}</TableCell>
                      <TableCell>
                        <span className="text-xs font-mono text-muted-foreground">{job.type}</span>
                      </TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center gap-1 text-xs font-medium ${cfg.color}`}>
                          <Icon className={`w-3.5 h-3.5 ${job.status === "RUNNING" ? "animate-spin" : ""}`} />
                          {cfg.label}
                        </span>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">{job.startedAt}</TableCell>
                      <TableCell className="text-right text-sm">
                        {job.recordsSync > 0 ? job.recordsSync.toLocaleString() : "—"}
                      </TableCell>
                      <TableCell className="text-xs text-red-500 max-w-48 truncate">
                        {job.error ?? "—"}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
