import { AppShell } from "@/components/layout/app-shell";
import { DashboardView } from "@/components/dashboard/dashboard-view";
import { getDashboardData } from "@/lib/analytics/dashboard";

export default async function ClientDashboardPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ range?: string }>;
}) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const range = query.range === "7d" ? "7d" : "30d";
  const data = await getDashboardData(id, range);

  return (
    <AppShell clients={data.clients} activeClientId={data.client.id}>
      <DashboardView data={data} basePath={`/clients/${id}/dashboard`} />
    </AppShell>
  );
}
