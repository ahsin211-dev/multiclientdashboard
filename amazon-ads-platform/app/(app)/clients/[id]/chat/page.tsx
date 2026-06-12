import { use } from "react";
import { Header } from "@/components/layout/header";
import { ChatInterface } from "@/components/chat/chat-interface";
import { MOCK_CLIENTS } from "@/lib/mock-data";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function ChatPage({ params }: PageProps) {
  const { id: clientId } = use(params);
  const client = MOCK_CLIENTS.find((c) => c.id === clientId) ?? MOCK_CLIENTS[0];

  return (
    <div className="flex flex-col h-screen">
      <Header
        title="AI Co-Pilot"
        subtitle={`${client.brandName} — Amazon Ads Strategist`}
      />
      <div className="flex-1 overflow-hidden">
        <ChatInterface clientId={clientId} clientName={client.brandName} />
      </div>
    </div>
  );
}
