import Link from "next/link";
import { BarChart3, Bot, FileBarChart2, Home, Settings, Users } from "lucide-react";

import { cn } from "@/lib/utils";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: Home },
  { href: "/clients", label: "Clients", icon: Users },
  { href: "/connect/amazon", label: "Connect Amazon", icon: Settings }
];

export function SidebarNav({ pathname }: { pathname: string }) {
  return (
    <nav className="flex flex-col gap-1">
      {navItems.map((item) => {
        const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-2 rounded-md px-3 py-2 text-sm text-slate-600 hover:bg-slate-100 hover:text-slate-900",
              active && "bg-slate-100 font-medium text-slate-900"
            )}
          >
            <Icon className="h-4 w-4" />
            {item.label}
          </Link>
        );
      })}
      <div className="mt-5 border-t border-slate-200 pt-3 text-xs uppercase tracking-wide text-slate-500">
        Client Views
      </div>
      <div className="flex flex-col gap-1">
        {[
          { href: "/clients", label: "Client dashboard", icon: BarChart3 },
          { href: "/clients", label: "Copilot chat", icon: Bot },
          { href: "/clients", label: "Audit & reports", icon: FileBarChart2 }
        ].map((item) => {
          const Icon = item.icon;
          return (
            <div key={item.label} className="flex items-center gap-2 px-3 py-1 text-sm text-slate-500">
              <Icon className="h-4 w-4" />
              {item.label}
            </div>
          );
        })}
      </div>
    </nav>
  );
}
