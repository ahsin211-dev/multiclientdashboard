"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  MessageSquare,
  FileSearch,
  FileText,
  Settings,
  Link2,
  BarChart3,
  Search,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface SidebarProps {
  clientId?: string;
}

export function Sidebar({ clientId }: SidebarProps) {
  const pathname = usePathname();

  const workspaceNav = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/clients", label: "Clients", icon: Users },
    { href: "/connect/amazon", label: "Connect Amazon", icon: Link2 },
  ];

  const clientNav = clientId
    ? [
        {
          href: `/clients/${clientId}/dashboard`,
          label: "Analytics",
          icon: BarChart3,
        },
        {
          href: `/clients/${clientId}/chat`,
          label: "AI Co-Pilot",
          icon: MessageSquare,
        },
        {
          href: `/clients/${clientId}/sqp`,
          label: "SQP Analyzer",
          icon: Search,
        },
        {
          href: `/clients/${clientId}/audit`,
          label: "Audit",
          icon: FileSearch,
        },
        {
          href: `/clients/${clientId}/reports`,
          label: "Reports",
          icon: FileText,
        },
        {
          href: `/clients/${clientId}/settings`,
          label: "Settings",
          icon: Settings,
        },
      ]
    : [];

  return (
    <aside className="flex h-full w-64 flex-col border-r bg-card">
      <div className="flex h-14 items-center border-b px-6">
        <Link href="/dashboard" className="flex items-center gap-2 font-semibold">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground text-sm font-bold">
            AI
          </div>
          <span>Ads Intel</span>
        </Link>
      </div>

      <nav className="flex-1 space-y-1 p-4">
        <div className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Workspace
        </div>
        {workspaceNav.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                isActive
                  ? "bg-primary/10 text-primary font-medium"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              )}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}

        {clientNav.length > 0 && (
          <>
            <div className="mb-2 mt-6 px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Client
            </div>
            {clientNav.map((item) => {
              const Icon = item.icon;
              const isActive = pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                    isActive
                      ? "bg-primary/10 text-primary font-medium"
                      : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
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
