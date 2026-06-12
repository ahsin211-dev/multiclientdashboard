import type { Route } from "next";
import Link from "next/link";
import { BarChart3, Bot, Briefcase, Building2, Cable, FileText, SearchCheck, Settings2 } from "lucide-react";

import { ClientSwitcher } from "@/components/layout/client-switcher";
import { Badge } from "@/components/ui/badge";
import { type DemoWorkspace } from "@/lib/data/demo";

type AppSidebarProps = {
  workspace: DemoWorkspace;
  currentClientId?: string;
};

const navItems = [
  { href: "/dashboard", label: "Portfolio dashboard", icon: BarChart3 },
  { href: "/clients", label: "Clients", icon: Building2 },
  { href: "/connect/amazon", label: "Connect Amazon", icon: Cable },
];

const clientItems = [
  { suffix: "dashboard", label: "Client dashboard", icon: Briefcase },
  { suffix: "chat", label: "AI co-pilot", icon: Bot },
  { suffix: "audit", label: "Audit", icon: SearchCheck },
  { suffix: "reports", label: "Reports", icon: FileText },
  { suffix: "settings", label: "Settings", icon: Settings2 },
];

export function AppSidebar({ workspace, currentClientId }: AppSidebarProps) {
  return (
    <aside className="hidden w-72 shrink-0 border-r border-slate-200 bg-slate-950 text-slate-200 lg:flex lg:flex-col">
      <div className="border-b border-slate-800 p-6">
        <div className="mb-6">
          <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Amazon intelligence</p>
          <h1 className="mt-2 text-xl font-semibold text-white">{workspace.name}</h1>
        </div>

        <ClientSwitcher clients={workspace.clients} currentClientId={currentClientId} />
      </div>

      <div className="flex-1 space-y-8 overflow-y-auto p-4">
        <div className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href as Route}
                className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-slate-300 transition hover:bg-slate-900 hover:text-white"
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </div>

        {currentClientId ? (
          <div className="space-y-1">
            <p className="px-3 text-xs uppercase tracking-[0.24em] text-slate-500">Client workspace</p>
            {clientItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.suffix}
                  href={`/clients/${currentClientId}/${item.suffix}` as Route}
                  className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-slate-300 transition hover:bg-slate-900 hover:text-white"
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </div>
        ) : null}
      </div>

      <div className="border-t border-slate-800 p-4">
        <div className="rounded-lg border border-slate-800 bg-slate-900/70 p-4">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-sm font-medium text-white">Sync posture</p>
            <Badge variant="success">Healthy</Badge>
          </div>
          <p className="text-sm text-slate-400">
            Daily syncs, manual refresh, and queue-based retries are wired for BullMQ or fallback mode.
          </p>
        </div>
      </div>
    </aside>
  );
}
