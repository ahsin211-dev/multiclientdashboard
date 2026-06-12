import { notFound } from "next/navigation";

import { ChatPanel } from "@/components/chat/chat-panel";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { prisma } from "@/lib/db/prisma";

const samplePrompts = [
  "Why did ACOS increase last week?",
  "Which campaigns should I cut?",
  "Which keywords should I scale?",
  "Create a weekly client report.",
  "Find wasted spend.",
  "Which SQP queries have high impression share but low PPC investment?"
];

export default async function ClientChatPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const client = await prisma.client.findUnique({
    where: { id },
    select: { id: true, brandName: true }
  });
  if (!client) notFound();

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>{client.brandName} · AI Co-Pilot</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-slate-600">
            The assistant is constrained by a strict system prompt and only uses provided client data.
            If data is missing, it should explicitly say so.
          </p>
        </CardContent>
      </Card>
      <ChatPanel clientId={client.id} />
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Suggested Questions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-slate-700">
          {samplePrompts.map((prompt) => (
            <div key={prompt} className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2">
              {prompt}
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
