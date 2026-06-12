"use client";

import { useRouter, usePathname } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export interface ClientOption {
  id: string;
  brandName: string;
  marketplace: string;
}

/**
 * Switches the active client. Preserves the current sub-route (dashboard, chat,
 * audit…) when moving between clients.
 */
export function ClientSwitcher({
  clients,
  activeId,
}: {
  clients: ClientOption[];
  activeId?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();

  function onChange(id: string) {
    // Try to keep the same sub-page when switching clients.
    const match = pathname.match(/\/clients\/[^/]+\/(.+)$/);
    const sub = match?.[1] ?? "dashboard";
    router.push(`/clients/${id}/${sub}`);
  }

  if (!clients.length) return null;

  return (
    <Select value={activeId} onValueChange={onChange}>
      <SelectTrigger className="w-full">
        <SelectValue placeholder="Select a client" />
      </SelectTrigger>
      <SelectContent>
        {clients.map((c) => (
          <SelectItem key={c.id} value={c.id}>
            {c.brandName} · {c.marketplace}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
