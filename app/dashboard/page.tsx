import { AppShell } from "@/components/layout/app-shell";
import { DashboardView } from "@/components/dashboard/dashboard-view";
import { getDashboardData } from "@/lib/analytics/dashboard";
import type { DateRangeKey } from "@/lib/analytics/types";

export default async function DashboardPage({ searchParams }: { searchParams: Promise<{ range?: string }> }) {
  const params = await searchParams;
  const range = params.range === "7d" ? "7d" : "30d";
  const data = await getDashboardData(undefined, range as DateRangeKey);

  return (
    <AppShell clients={data.clients} activeClientId={data.client.id}>
      <DashboardView data={data} basePath="/dashboard" />
    </AppShell>
  );
}
