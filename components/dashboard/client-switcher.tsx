"use client";

import { useRouter, usePathname } from "next/navigation";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface ClientOption {
  id: string;
  brandName: string;
}

interface ClientSwitcherProps {
  clients: ClientOption[];
  currentClientId?: string;
}

export function ClientSwitcher({ clients, currentClientId }: ClientSwitcherProps) {
  const router = useRouter();
  const pathname = usePathname();

  function onChange(clientId: string) {
    const segments = pathname.split("/");
    const clientIndex = segments.indexOf("clients");
    if (clientIndex !== -1 && segments[clientIndex + 1]) {
      segments[clientIndex + 1] = clientId;
      router.push(segments.join("/"));
    } else {
      router.push(`/clients/${clientId}/dashboard`);
    }
  }

  if (clients.length === 0) return null;

  return (
    <Select value={currentClientId} onValueChange={onChange}>
      <SelectTrigger className="w-[220px]">
        <SelectValue placeholder="Select client" />
      </SelectTrigger>
      <SelectContent>
        {clients.map((c) => (
          <SelectItem key={c.id} value={c.id}>
            {c.brandName}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
