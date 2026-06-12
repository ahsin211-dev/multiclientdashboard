import { Sidebar } from "./sidebar";
import { getSession } from "@/lib/auth/session";
import { redirect } from "next/navigation";

interface AppShellProps {
  children: React.ReactNode;
  clientId?: string;
  title?: string;
  actions?: React.ReactNode;
}

export async function AppShell({ children, clientId, title, actions }: AppShellProps) {
  const session = await getSession();
  if (!session) redirect("/login");

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar clientId={clientId} />
      <div className="flex flex-1 flex-col overflow-hidden">
        {(title || actions) && (
          <header className="flex h-14 items-center justify-between border-b px-6">
            {title && <h1 className="text-lg font-semibold">{title}</h1>}
            {actions && <div className="flex items-center gap-3">{actions}</div>}
          </header>
        )}
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}
