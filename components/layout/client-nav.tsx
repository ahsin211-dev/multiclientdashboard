import Link from "next/link";

import { cn } from "@/lib/utils";

const links = [
  { suffix: "dashboard", label: "Dashboard" },
  { suffix: "chat", label: "AI co-pilot" },
  { suffix: "audit", label: "Audit" },
  { suffix: "reports", label: "Reports" },
  { suffix: "settings", label: "Settings" },
];

type ClientNavProps = {
  clientId: string;
  current: string;
};

export function ClientNav({ clientId, current }: ClientNavProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {links.map((link) => (
        <Link
          key={link.suffix}
          href={`/clients/${clientId}/${link.suffix}`}
          className={cn(
            "rounded-full px-4 py-2 text-sm font-medium transition",
            current === link.suffix
              ? "bg-slate-900 text-white"
              : "bg-white text-slate-600 hover:bg-slate-100",
          )}
        >
          {link.label}
        </Link>
      ))}
    </div>
  );
}
