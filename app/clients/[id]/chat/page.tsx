import { ChatPanel } from "@/components/chat/chat-panel";
import { AppShell } from "@/components/layout/app-shell";
import { getDashboardData } from "@/lib/analytics/dashboard";

export default async function ClientChatPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const data = await getDashboardData(id);

  return (
    <AppShell clients={data.clients} activeClientId={data.client.id}>
      <div className="grid gap-6">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-blue-600">AI co-pilot</p>
          <h1 className="mt-2 text-3xl font-bold text-slate-950">{data.client.brandName} strategist</h1>
          <p className="mt-2 text-slate-600">Ask data-grounded questions about spend, sales, SQP, campaigns, and reports.</p>
        </div>
        <ChatPanel clientId={data.client.id} />
      </div>
    </AppShell>
  );
}
