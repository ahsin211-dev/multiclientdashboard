import Link from "next/link";
import { CalendarDays } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function DateRangeControls({ basePath, activeRange }: { basePath: string; activeRange: string }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Link
        href={`${basePath}?range=7d`}
        className={cn(
          "inline-flex h-8 items-center rounded-lg px-3 text-sm font-semibold",
          activeRange === "7d" ? "bg-blue-600 text-white" : "border border-slate-200 bg-white text-slate-900 hover:bg-slate-50",
        )}
      >
        Last 7 days
      </Link>
      <Link
        href={`${basePath}?range=30d`}
        className={cn(
          "inline-flex h-8 items-center rounded-lg px-3 text-sm font-semibold",
          activeRange === "30d" ? "bg-blue-600 text-white" : "border border-slate-200 bg-white text-slate-900 hover:bg-slate-50",
        )}
      >
        Last 30 days
      </Link>
      <Button variant="outline" size="sm">
        <CalendarDays className="h-4 w-4" />
        Custom range
      </Button>
    </div>
  );
}
