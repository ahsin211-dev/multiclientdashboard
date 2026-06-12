import { Sidebar } from "@/components/layout/sidebar";
import { listClients } from "@/lib/workspace";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const clients = await listClients();

  return (
    <div className="flex min-h-screen">
      <Sidebar clients={clients} />
      <main className="flex-1 overflow-x-hidden">
        <div className="mx-auto max-w-[1400px] space-y-6 p-4 md:p-8">{children}</div>
      </main>
    </div>
  );
}
