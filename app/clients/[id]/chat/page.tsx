import { redirect, notFound } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { getClientById, getWorkspaceClients } from "@/lib/clients";
import { AppShell } from "@/components/layout/app-shell";
import { ChatInterface } from "@/components/chat/chat-interface";

export default async function ClientChatPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getSession();
  if (!session) redirect("/login");

  const { id } = await params;
  const client = await getClientById(id);
  if (!client) notFound();

  const clients = await getWorkspaceClients();

  return (
    <AppShell title={`${client.brandName} — AI Co-Pilot`} clientId={id} clients={clients}>
      <ChatInterface clientId={id} />
    </AppShell>
  );
}
