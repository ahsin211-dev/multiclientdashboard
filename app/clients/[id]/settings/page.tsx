import { AppShell } from "@/components/layout/app-shell";
import { ClientSettings } from "@/components/dashboard/client-settings";
import { ClientSwitcher } from "@/components/dashboard/client-switcher";
import { SyncButton } from "@/components/dashboard/sync-button";
import { getClientOrThrow, getWorkspaceClients } from "@/lib/data/workspace";

export default async function ClientSettingsPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ connected?: string }>;
}) {
  const { id } = await params;
  const { connected } = await searchParams;
  const [client, clients] = await Promise.all([
    getClientOrThrow(id),
    getWorkspaceClients(),
  ]);

  return (
    <AppShell
      clientId={id}
      title={`${client.brandName} — Settings`}
      actions={
        <>
          <ClientSwitcher clients={clients} currentClientId={id} />
          <SyncButton clientId={id} />
        </>
      }
    >
      <ClientSettings client={client} connected={connected === "true"} />
    </AppShell>
  );
}
