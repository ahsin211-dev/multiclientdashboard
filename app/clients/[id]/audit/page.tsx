import { AppShell } from "@/components/layout/app-shell";
import { AuditPanel } from "@/components/dashboard/audit-panel";
import { ClientSwitcher } from "@/components/dashboard/client-switcher";
import { getClientOrThrow, getWorkspaceClients } from "@/lib/data/workspace";
import { prisma } from "@/lib/db/prisma";

export default async function ClientAuditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [client, clients, reports] = await Promise.all([
    getClientOrThrow(id),
    getWorkspaceClients(),
    prisma.auditReport.findMany({
      where: { clientId: id },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
  ]);

  return (
    <AppShell
      clientId={id}
      title={`${client.brandName} — Account Audit`}
      actions={<ClientSwitcher clients={clients} currentClientId={id} />}
    >
      <AuditPanel
        clientId={id}
        initialReports={reports.map((r) => ({
          id: r.id,
          title: r.title,
          summary: r.summary,
          score: r.score,
          findings: r.findings as { type: string; title: string; description: string; impact: "high" | "medium" | "low" }[],
          createdAt: r.createdAt.toISOString(),
        }))}
      />
    </AppShell>
  );
}
