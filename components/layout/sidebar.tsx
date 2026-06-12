"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3 } from "lucide-react";
import { cn } from "@/lib/utils";
import { globalNav, clientNav } from "@/lib/nav";
import { ClientSwitcher, type ClientOption } from "./client-switcher";

export function Sidebar({ clients }: { clients: ClientOption[] }) {
  const pathname = usePathname();
  const activeId = pathname.match(/\/clients\/([^/]+)/)?.[1];
  const activeClient = clients.find((c) => c.id === activeId);

  return (
    <aside className="hidden w-64 shrink-0 flex-col border-r bg-card/40 md:flex">
      <div className="flex h-14 items-center gap-2 border-b px-5">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <BarChart3 className="h-5 w-5" />
        </div>
        <span className="text-lg font-semibold tracking-tight">
          {process.env.NEXT_PUBLIC_APP_NAME || "AdsIQ"}
        </span>
      </div>

      <nav className="flex-1 space-y-6 overflow-y-auto p-3">
        <div>
          <p className="px-2 pb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Workspace
          </p>
          <div className="space-y-1">
            {globalNav.map((item) => (
              <NavLink key={item.href} item={item} pathname={pathname} />
            ))}
          </div>
        </div>

        {activeClient && (
          <div>
            <p className="px-2 pb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {activeClient.brandName}
            </p>
            <div className="mb-3 px-1">
              <ClientSwitcher clients={clients} activeId={activeId} />
            </div>
            <div className="space-y-1">
              {clientNav(activeClient.id).map((item) => (
                <NavLink key={item.href} item={item} pathname={pathname} />
              ))}
            </div>
          </div>
        )}
      </nav>

      <div className="border-t p-3 text-xs text-muted-foreground">
        <p className="font-medium text-foreground">Demo Agency</p>
        <p>demo@adsiq.app</p>
      </div>
    </aside>
  );
}

function NavLink({
  item,
  pathname,
}: {
  item: { label: string; href: string; icon: React.ComponentType<{ className?: string }> };
  pathname: string;
}) {
  const active = pathname === item.href || pathname.startsWith(item.href + "/");
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      className={cn(
        "flex items-center gap-3 rounded-md px-2.5 py-2 text-sm font-medium transition-colors",
        active
          ? "bg-primary/10 text-primary"
          : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
      )}
    >
      <Icon className="h-4 w-4" />
      {item.label}
    </Link>
  );
}
