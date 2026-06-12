import { AppShell } from "@/components/layout/app-shell";
import { ReportsPanel } from "@/components/dashboard/reports-panel";
import { ClientSwitcher } from "@/components/dashboard/client-switcher";
import { getClientOrThrow, getWorkspaceClients } from "@/lib/data/workspace";

export default async function ClientReportsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [client, clients] = await Promise.all([
    getClientOrThrow(id),
    getWorkspaceClients(),
  ]);

  return (
    <AppShell
      clientId={id}
      title={`${client.brandName} — Reports`}
      actions={<ClientSwitcher clients={clients} currentClientId={id} />}
    >
      <ReportsPanel clientId={id} brandName={client.brandName} />
    </AppShell>
  );
}
