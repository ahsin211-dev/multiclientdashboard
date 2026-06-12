"use client";

import type { Route } from "next";
import { useRouter } from "next/navigation";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { type DemoClient } from "@/lib/data/demo";

type ClientSwitcherProps = {
  clients: DemoClient[];
  currentClientId?: string;
};

export function ClientSwitcher({ clients, currentClientId }: ClientSwitcherProps) {
  const router = useRouter();

  return (
    <Select
      value={currentClientId ?? clients[0]?.id}
      onValueChange={(value) => router.push(`/clients/${value}/dashboard` as Route)}
    >
      <SelectTrigger className="w-full border-slate-700 bg-slate-900 text-white">
        <SelectValue placeholder="Select client" />
      </SelectTrigger>
      <SelectContent>
        {clients.map((client) => (
          <SelectItem key={client.id} value={client.id}>
            {client.brandName}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
