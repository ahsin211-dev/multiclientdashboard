"use client";

import { useRouter, usePathname } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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

  function handleChange(clientId: string) {
    const segments = pathname.split("/");
    const clientsIndex = segments.indexOf("clients");
    if (clientsIndex !== -1 && segments[clientsIndex + 1]) {
      segments[clientsIndex + 1] = clientId;
      router.push(segments.join("/"));
    } else {
      router.push(`/clients/${clientId}/dashboard`);
    }
  }

  if (clients.length === 0) return null;

  return (
    <Select value={currentClientId} onValueChange={handleChange}>
      <SelectTrigger className="w-[200px]">
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
