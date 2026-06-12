import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  Users,
  PlugZap,
  MessageSquare,
  ClipboardCheck,
  FileText,
  Settings,
  Search,
} from "lucide-react";

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
}

export const globalNav: NavItem[] = [
  { label: "Overview", href: "/dashboard", icon: LayoutDashboard },
  { label: "Clients", href: "/clients", icon: Users },
  { label: "Connect Amazon", href: "/connect/amazon", icon: PlugZap },
];

export function clientNav(clientId: string): NavItem[] {
  const base = `/clients/${clientId}`;
  return [
    { label: "Dashboard", href: `${base}/dashboard`, icon: LayoutDashboard },
    { label: "SQP Analyzer", href: `${base}/sqp`, icon: Search },
    { label: "AI Co-pilot", href: `${base}/chat`, icon: MessageSquare },
    { label: "Audit", href: `${base}/audit`, icon: ClipboardCheck },
    { label: "Reports", href: `${base}/reports`, icon: FileText },
    { label: "Settings", href: `${base}/settings`, icon: Settings },
  ];
}
