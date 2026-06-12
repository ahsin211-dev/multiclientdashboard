import { notFound } from "next/navigation";

import { ChatPanel } from "@/components/chat/chat-panel";
import { ClientNav } from "@/components/layout/client-nav";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AMAZON_STRATEGIST_SYSTEM_PROMPT } from "@/lib/anthropic/chat";
import { getClient } from "@/lib/db/repository";
import { parseDateRange } from "@/lib/utils";

type ClientChatPageProps = {
  params: Promise<{ id: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function ClientChatPage({ params, searchParams }: ClientChatPageProps) {
  const { id } = await params;
  const resolvedParams = searchParams ? await searchParams : undefined;
  const range = parseDateRange(resolvedParams);
  const client = await getClient(id);

  if (!client) {
    notFound();
  }

  return (
    <div className="space-y-8">
      <section className="space-y-4">
        <ClientNav clientId={client.id} current="chat" />
        <div>
          <p className="text-sm font-medium uppercase tracking-[0.24em] text-slate-400">AI co-pilot</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">
            Strategy assistant for {client.brandName}
          </h1>
          <p className="mt-2 max-w-3xl text-slate-600">
            Streaming Claude-ready answers grounded only in the selected client&apos;s performance context.
          </p>
        </div>
      </section>

      <Card>
        <CardHeader>
          <CardTitle>System prompt guardrails</CardTitle>
          <CardDescription>
            The assistant is constrained to live client context and should call out missing data rather than guessing.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <pre className="whitespace-pre-wrap rounded-lg bg-slate-950 p-4 text-sm text-slate-100">
            {AMAZON_STRATEGIST_SYSTEM_PROMPT}
          </pre>
        </CardContent>
      </Card>

      <ChatPanel clientId={client.id} preset={range.preset} />
    </div>
  );
}
