import { Sidebar } from "@/components/layout/sidebar";
import { ClientSwitcher } from "@/components/layout/client-switcher";
import type { ClientRecord } from "@/lib/analytics/types";
import type { ReactNode } from "react";

export function AppShell({
  children,
  clients,
  activeClientId,
}: {
  children: ReactNode;
  clients: ClientRecord[];
  activeClientId?: string;
}) {
  return (
    <div className="flex min-h-screen">
      <Sidebar clientId={activeClientId} />
      <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-6">
          <div className="flex flex-col gap-4 lg:hidden">
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <p className="font-semibold text-slate-950">AdIntel OS</p>
              <p className="text-sm text-slate-500">Amazon growth cockpit</p>
            </div>
          </div>
          <div className="grid gap-6 xl:grid-cols-[1fr_280px]">
            <div className="min-w-0">{children}</div>
            <div className="hidden xl:block">
              <ClientSwitcher clients={clients} activeClientId={activeClientId} />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
