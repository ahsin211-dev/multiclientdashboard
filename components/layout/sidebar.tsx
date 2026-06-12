"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  Building2,
  FileText,
  LayoutDashboard,
  MessageSquare,
  Search,
  Settings,
  Link2,
  ClipboardCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";

const mainNav = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/clients", label: "Clients", icon: Building2 },
  { href: "/connect/amazon", label: "Connect Amazon", icon: Link2 },
];

function getClientNav(clientId: string) {
  return [
    { href: `/clients/${clientId}/dashboard`, label: "Analytics", icon: BarChart3 },
    { href: `/clients/${clientId}/chat`, label: "AI Co-Pilot", icon: MessageSquare },
    { href: `/clients/${clientId}/audit`, label: "Audit", icon: ClipboardCheck },
    { href: `/clients/${clientId}/reports`, label: "Reports", icon: FileText },
    { href: `/clients/${clientId}/settings`, label: "Settings", icon: Settings },
  ];
}

interface SidebarProps {
  clientId?: string;
}

export function Sidebar({ clientId }: SidebarProps) {
  const pathname = usePathname();
  const clientNav = clientId ? getClientNav(clientId) : [];

  return (
    <aside className="flex h-full w-64 flex-col border-r bg-sidebar text-sidebar-foreground">
      <div className="flex h-14 items-center border-b border-sidebar-border px-4">
        <Search className="mr-2 h-5 w-5 text-sidebar-primary" />
        <span className="font-semibold">Ads Intelligence</span>
      </div>

      <nav className="flex-1 space-y-1 p-3">
        <p className="px-3 py-2 text-xs font-medium uppercase text-sidebar-foreground/60">Workspace</p>
        {mainNav.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
                active
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground/80 hover:bg-sidebar-accent/50"
              )}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}

        {clientNav.length > 0 && (
          <>
            <p className="mt-6 px-3 py-2 text-xs font-medium uppercase text-sidebar-foreground/60">Client</p>
            {clientNav.map((item) => {
              const Icon = item.icon;
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
                    active
                      ? "bg-sidebar-accent text-sidebar-accent-foreground"
                      : "text-sidebar-foreground/80 hover:bg-sidebar-accent/50"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </>
        )}
      </nav>
    </aside>
  );
}
