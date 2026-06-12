import { Bell, PanelLeftClose } from "lucide-react";

import { AppSidebar } from "@/components/layout/app-sidebar";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { getCurrentUser } from "@/lib/auth";
import { getWorkspace } from "@/lib/db/repository";

type AppShellProps = {
  children: React.ReactNode;
  currentClientId?: string;
};

export async function AppShell({ children, currentClientId }: AppShellProps) {
  const [workspace, user] = await Promise.all([getWorkspace(), getCurrentUser()]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-950">
      <div className="flex min-h-screen">
        <AppSidebar workspace={workspace} currentClientId={currentClientId} />
        <div className="flex min-h-screen flex-1 flex-col">
          <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/90 backdrop-blur">
            <div className="flex items-center justify-between gap-4 px-6 py-4">
              <div className="flex items-center gap-3">
                <Button variant="ghost" size="sm" className="lg:hidden">
                  <PanelLeftClose className="h-4 w-4" />
                </Button>
                <div>
                  <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Workspace</p>
                  <p className="text-sm font-medium text-slate-900">{workspace.name}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Button variant="outline" size="sm">
                  <Bell className="h-4 w-4" />
                  Alerts
                </Button>
                <Separator orientation="vertical" className="h-8" />
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarFallback>
                      {user.name?.slice(0, 1)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="text-right">
                    <p className="text-sm font-medium text-slate-900">{user.name}</p>
                    <p className="text-xs text-slate-500">{user.role}</p>
                  </div>
                </div>
              </div>
            </div>
          </header>

          <main className="flex-1 p-6">{children}</main>
        </div>
      </div>
    </div>
  );
}
