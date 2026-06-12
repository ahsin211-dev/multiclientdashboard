import { AppShell } from "@/components/layout/app-shell";
import { ChatInterface } from "@/components/chat/chat-interface";
import { ClientSwitcher } from "@/components/dashboard/client-switcher";
import { getClientOrThrow, getWorkspaceClients } from "@/lib/data/workspace";

export default async function ClientChatPage({
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
      title={`${client.brandName} — AI Co-Pilot`}
      actions={<ClientSwitcher clients={clients} currentClientId={id} />}
    >
      <ChatInterface clientId={id} />
    </AppShell>
  );
}
