"use client";

import { useRouter } from "next/navigation";

import { Select } from "@/components/ui/select";

interface ClientOption {
  id: string;
  brandName: string;
}

export function ClientSwitcher({
  clients,
  value
}: {
  clients: ClientOption[];
  value?: string;
}) {
  const router = useRouter();

  return (
    <Select
      value={value}
      onChange={(event) => {
        const clientId = event.target.value;
        if (!clientId) return;
        router.push(`/clients/${clientId}/dashboard`);
      }}
      className="max-w-xs"
    >
      <option value="">Select client</option>
      {clients.map((client) => (
        <option key={client.id} value={client.id}>
          {client.brandName}
        </option>
      ))}
    </Select>
  );
}
