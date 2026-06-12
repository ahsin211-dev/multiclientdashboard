import { Sidebar } from "./sidebar";
import { ClientSwitcher } from "@/components/dashboard/client-switcher";

interface AppShellProps {
  children: React.ReactNode;
  clientId?: string;
  clients?: Array<{ id: string; brandName: string }>;
  title?: string;
  actions?: React.ReactNode;
}

export function AppShell({
  children,
  clientId,
  clients = [],
  title,
  actions,
}: AppShellProps) {
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar clientId={clientId} />
      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex h-14 items-center justify-between border-b px-6">
          <div className="flex items-center gap-4">
            {title && <h1 className="text-lg font-semibold">{title}</h1>}
            {clients.length > 0 && (
              <ClientSwitcher clients={clients} currentClientId={clientId} />
            )}
          </div>
          {actions && <div className="flex items-center gap-2">{actions}</div>}
        </header>
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}
