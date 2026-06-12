"use client";

import * as React from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { CalendarDays } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

const PRESETS = [
  { key: "7d", label: "7 days" },
  { key: "30d", label: "30 days" },
  { key: "90d", label: "90 days" },
] as const;

/**
 * Period selector driving the dashboard via URL search params:
 *  ?period=7d|30d|90d  OR  ?from=YYYY-MM-DD&to=YYYY-MM-DD
 * Comparison vs the immediately-preceding period is implicit.
 */
export function PeriodSelector() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const period = params.get("period") ?? "30d";
  const from = params.get("from") ?? "";
  const to = params.get("to") ?? "";
  const isCustom = Boolean(from && to);

  const [open, setOpen] = React.useState(false);
  const [draftFrom, setDraftFrom] = React.useState(from);
  const [draftTo, setDraftTo] = React.useState(to);

  function setPreset(key: string) {
    const sp = new URLSearchParams(params.toString());
    sp.set("period", key);
    sp.delete("from");
    sp.delete("to");
    router.push(`${pathname}?${sp.toString()}`);
  }

  function applyCustom() {
    if (!draftFrom || !draftTo) return;
    const sp = new URLSearchParams(params.toString());
    sp.set("from", draftFrom);
    sp.set("to", draftTo);
    sp.delete("period");
    router.push(`${pathname}?${sp.toString()}`);
    setOpen(false);
  }

  return (
    <div className="flex items-center gap-1 rounded-lg border bg-card p-1">
      {PRESETS.map((p) => (
        <Button
          key={p.key}
          size="sm"
          variant={!isCustom && period === p.key ? "default" : "ghost"}
          onClick={() => setPreset(p.key)}
        >
          {p.label}
        </Button>
      ))}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button size="sm" variant={isCustom ? "default" : "ghost"}>
            <CalendarDays className="h-4 w-4" />
            {isCustom ? `${from} → ${to}` : "Custom"}
          </Button>
        </PopoverTrigger>
        <PopoverContent align="end">
          <div className="space-y-3">
            <div className="space-y-1">
              <Label htmlFor="from">From</Label>
              <Input id="from" type="date" value={draftFrom} onChange={(e) => setDraftFrom(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="to">To</Label>
              <Input id="to" type="date" value={draftTo} onChange={(e) => setDraftTo(e.target.value)} />
            </div>
            <Button className="w-full" size="sm" onClick={applyCustom}>
              Apply range
            </Button>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
