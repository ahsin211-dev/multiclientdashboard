import Link from "next/link";
import { BarChart3, Bot, Building2, ClipboardCheck, FileText, Home, PlugZap, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: Home },
  { href: "/clients", label: "Clients", icon: Building2 },
  { href: "/connect/amazon", label: "Connect Amazon", icon: PlugZap },
];

export function Sidebar({ clientId }: { clientId?: string }) {
  const clientItems = clientId
    ? [
        { href: `/clients/${clientId}/dashboard`, label: "Client dashboard", icon: BarChart3 },
        { href: `/clients/${clientId}/chat`, label: "AI co-pilot", icon: Bot },
        { href: `/clients/${clientId}/audit`, label: "Audit", icon: ClipboardCheck },
        { href: `/clients/${clientId}/reports`, label: "Reports", icon: FileText },
        { href: `/clients/${clientId}/settings`, label: "Settings", icon: Settings },
      ]
    : [];

  return (
    <aside className="hidden min-h-screen w-72 border-r border-slate-200 bg-white/80 p-5 backdrop-blur lg:block">
      <Link href="/dashboard" className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white">
          <BarChart3 className="h-5 w-5" />
        </div>
        <div>
          <p className="font-semibold text-slate-950">AdIntel OS</p>
          <p className="text-xs text-slate-500">Amazon growth cockpit</p>
        </div>
      </Link>

      <nav className="mt-8 space-y-1">
        {[...navItems, ...clientItems].map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-950",
            )}
          >
            <item.icon className="h-4 w-4" />
            {item.label}
          </Link>
        ))}
      </nav>

      <div className="mt-8 rounded-2xl border border-blue-100 bg-blue-50 p-4">
        <p className="text-sm font-semibold text-blue-950">MVP mode</p>
        <p className="mt-1 text-xs leading-5 text-blue-800">
          Uses seeded/mock Amazon data until OAuth credentials, PostgreSQL, and Redis are configured.
        </p>
      </div>
    </aside>
  );
}
