"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  BarChart3,
  MessageSquare,
  Search,
  FileText,
  Settings,
  Zap,
  ChevronDown,
  Plus,
  Activity,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { MOCK_CLIENTS } from "@/lib/mock-data";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useState } from "react";

const navItems = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/clients", label: "Clients", icon: Users },
  { href: "/sync", label: "Sync Jobs", icon: Activity },
];

const clientNavItems = (clientId: string) => [
  { href: `/clients/${clientId}/dashboard`, label: "Dashboard", icon: BarChart3 },
  { href: `/clients/${clientId}/sqp`, label: "SQP Analyzer", icon: Search },
  { href: `/clients/${clientId}/chat`, label: "AI Co-Pilot", icon: MessageSquare },
  { href: `/clients/${clientId}/audit`, label: "Audit", icon: Zap },
  { href: `/clients/${clientId}/reports`, label: "Reports", icon: FileText },
  { href: `/clients/${clientId}/settings`, label: "Settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const [activeClientId, setActiveClientId] = useState(MOCK_CLIENTS[0].id);

  const activeClient = MOCK_CLIENTS.find((c) => c.id === activeClientId) ?? MOCK_CLIENTS[0];
  const isClientRoute = pathname.includes("/clients/");
  const clientIdFromPath = pathname.split("/clients/")[1]?.split("/")[0];
  const currentClientId = clientIdFromPath || activeClientId;
  const currentClient = MOCK_CLIENTS.find((c) => c.id === currentClientId) ?? activeClient;

  return (
    <div className="w-64 min-h-screen flex flex-col" style={{ background: "var(--sidebar)" }}>
      {/* Logo */}
      <div className="px-5 py-5 border-b" style={{ borderColor: "var(--sidebar-border)" }}>
        <Link href="/dashboard" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "var(--sidebar-primary)" }}>
            <BarChart3 className="w-4.5 h-4.5 text-white" />
          </div>
          <div>
            <p className="text-sm font-bold" style={{ color: "var(--sidebar-foreground)" }}>AdsIntel</p>
            <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>Pro</p>
          </div>
        </Link>
      </div>

      {/* Client Switcher */}
      <div className="px-3 py-3 border-b" style={{ borderColor: "var(--sidebar-border)" }}>
        <p className="text-xs font-medium px-2 mb-2" style={{ color: "var(--muted-foreground)" }}>ACTIVE CLIENT</p>
        <DropdownMenu>
          <DropdownMenuTrigger className="w-full flex items-center gap-2 px-2 py-2 rounded-md hover:opacity-80 transition-opacity text-left outline-none">
            <Avatar className="w-7 h-7">
              <AvatarFallback className="text-xs font-bold" style={{ background: "var(--sidebar-primary)", color: "white" }}>
                {currentClient.brandName.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate" style={{ color: "var(--sidebar-foreground)" }}>
                {currentClient.brandName}
              </p>
              <p className="text-xs truncate" style={{ color: "var(--muted-foreground)" }}>
                {currentClient.marketplace} · {currentClient.isActive ? "Active" : "Inactive"}
              </p>
            </div>
            <ChevronDown className="w-4 h-4 shrink-0" style={{ color: "var(--muted-foreground)" }} />
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="start">
            {MOCK_CLIENTS.map((client) => (
              <DropdownMenuItem key={client.id} className="p-0">
                <Link href={`/clients/${client.id}/dashboard`} className="flex items-center gap-2 w-full px-2 py-1.5">
                  <Avatar className="w-6 h-6">
                    <AvatarFallback className="text-xs" style={{ background: "var(--primary)", color: "white" }}>
                      {client.brandName.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{client.brandName}</p>
                    <p className="text-xs text-muted-foreground">{client.marketplace}</p>
                  </div>
                  {!client.isActive && <Badge variant="secondary" className="text-xs">Inactive</Badge>}
                </Link>
              </DropdownMenuItem>
            ))}
            <DropdownMenuItem className="p-0">
              <Link href="/clients/new" className="flex items-center gap-2 text-muted-foreground w-full px-2 py-1.5">
                <Plus className="w-4 h-4" />
                Add Client
              </Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
        <p className="text-xs font-medium px-2 mb-2" style={{ color: "var(--muted-foreground)" }}>WORKSPACE</p>
        {navItems.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-2.5 px-2 py-2 rounded-md text-sm font-medium transition-colors",
                isActive
                  ? "text-white"
                  : "hover:opacity-80"
              )}
              style={{
                background: isActive ? "var(--sidebar-accent)" : "transparent",
                color: isActive ? "var(--sidebar-foreground)" : "var(--sidebar-foreground)",
                opacity: isActive ? 1 : 0.7,
              }}
            >
              <Icon className="w-4 h-4" />
              {label}
            </Link>
          );
        })}

        {/* Client Navigation */}
        <div className="pt-4">
          <p className="text-xs font-medium px-2 mb-2" style={{ color: "var(--muted-foreground)" }}>
            {currentClient.brandName.toUpperCase()}
          </p>
          {clientNavItems(currentClientId).map(({ href, label, icon: Icon }) => {
            const isActive = pathname === href || pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex items-center gap-2.5 px-2 py-2 rounded-md text-sm font-medium transition-colors"
                )}
                style={{
                  background: isActive ? "var(--sidebar-accent)" : "transparent",
                  color: "var(--sidebar-foreground)",
                  opacity: isActive ? 1 : 0.7,
                }}
              >
                <Icon className="w-4 h-4" />
                {label}
                {label === "AI Co-Pilot" && (
                  <Badge className="ml-auto text-xs py-0" style={{ background: "var(--sidebar-primary)", color: "white" }}>
                    AI
                  </Badge>
                )}
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Footer */}
      <div className="p-3 border-t" style={{ borderColor: "var(--sidebar-border)" }}>
        <div className="flex items-center gap-2 px-2 py-1">
          <Avatar className="w-7 h-7">
            <AvatarFallback className="text-xs" style={{ background: "var(--sidebar-primary)", color: "white" }}>
              AJ
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium truncate" style={{ color: "var(--sidebar-foreground)" }}>Alex Johnson</p>
            <p className="text-xs truncate" style={{ color: "var(--muted-foreground)" }}>Owner</p>
          </div>
          <Link href="/settings">
            <Settings className="w-4 h-4" style={{ color: "var(--muted-foreground)" }} />
          </Link>
        </div>
      </div>
    </div>
  );
}
