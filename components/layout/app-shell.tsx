"use client";

import { usePathname } from "next/navigation";

import { ClientSwitcher } from "@/components/layout/client-switcher";
import { SidebarNav } from "@/components/layout/sidebar-nav";

interface ClientOption {
  id: string;
  brandName: string;
}

export function AppShell({
  children,
  clients
}: {
  children: React.ReactNode;
  clients: ClientOption[];
}) {
  const pathname = usePathname();
  const currentClientId = pathname?.startsWith("/clients/") ? pathname.split("/")[2] : undefined;

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto grid max-w-[1400px] grid-cols-1 gap-6 p-4 md:grid-cols-[240px_1fr]">
        <aside className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="mb-6">
            <div className="text-sm font-semibold text-slate-900">AgencyOps</div>
            <div className="text-xs text-slate-500">Amazon Ads Intelligence</div>
          </div>
          <SidebarNav pathname={pathname ?? ""} />
        </aside>
        <main className="space-y-4">
          <header className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-lg font-semibold text-slate-900">Amazon Ads + Sales Intelligence</h1>
              <p className="text-sm text-slate-500">Multi-client analytics, sync, and AI strategy workspace.</p>
            </div>
            <ClientSwitcher clients={clients} value={currentClientId} />
          </header>
          {children}
        </main>
      </div>
    </div>
  );
}
