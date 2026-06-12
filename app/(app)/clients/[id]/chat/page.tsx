import { notFound } from "next/navigation";
import { PageHeader } from "@/components/layout/page-header";
import { ChatPanel } from "@/components/chat/chat-panel";
import { Badge } from "@/components/ui/badge";
import { prisma } from "@/lib/db/prisma";
import { isAnthropicConfigured } from "@/lib/anthropic/client";

export const dynamic = "force-dynamic";

export default async function ChatPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { period?: string };
}) {
  const client = await prisma.client.findUnique({ where: { id: params.id } });
  if (!client) notFound();

  const configured = isAnthropicConfigured();

  return (
    <>
      <PageHeader
        title="AI Co-pilot"
        description={`Ask questions about ${client.brandName}, grounded in live data.`}
        actions={
          <Badge variant={configured ? "success" : "warning"}>
            {configured ? "Claude connected" : "Demo mode (no API key)"}
          </Badge>
        }
      />
      <ChatPanel clientId={client.id} period={searchParams.period ?? "30d"} />
    </>
  );
}
