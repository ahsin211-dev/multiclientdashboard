import Link from "next/link";
import { ChevronDown } from "lucide-react";
import type { ClientRecord } from "@/lib/analytics/types";
import { Badge } from "@/components/ui/badge";

export function ClientSwitcher({ clients, activeClientId }: { clients: ClientRecord[]; activeClientId?: string }) {
  const active = clients.find((client) => client.id === activeClientId) ?? clients[0];

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Active client</p>
          <p className="mt-1 font-semibold text-slate-950">{active?.brandName ?? "No client"}</p>
        </div>
        <ChevronDown className="h-4 w-4 text-slate-400" />
      </div>
      <div className="mt-3 grid gap-2">
        {clients.map((client) => (
          <Link
            key={client.id}
            href={`/clients/${client.id}/dashboard`}
            className="flex items-center justify-between rounded-xl px-3 py-2 text-sm text-slate-600 hover:bg-slate-50"
          >
            <span>{client.brandName}</span>
            <Badge variant={client.syncStatus === "SYNCED" ? "success" : "warning"}>{client.marketplace}</Badge>
          </Link>
        ))}
      </div>
    </div>
  );
}
