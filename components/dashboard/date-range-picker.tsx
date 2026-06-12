"use client";

import type { Route } from "next";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { Button } from "@/components/ui/button";
import { type DateRangePreset } from "@/lib/utils";

const presets: Array<{ value: DateRangePreset; label: string }> = [
  { value: "7d", label: "Last 7 days" },
  { value: "30d", label: "Last 30 days" },
  { value: "custom", label: "Custom" },
];

type DateRangePickerProps = {
  current: DateRangePreset;
};

export function DateRangePicker({ current }: DateRangePickerProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function setPreset(preset: DateRangePreset) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("preset", preset);
    if (preset !== "custom") {
      params.delete("from");
      params.delete("to");
    }
    router.push(`${pathname}?${params.toString()}` as Route);
  }

  return (
    <div className="flex flex-wrap gap-2">
      {presets.map((preset) => (
        <Button
          key={preset.value}
          variant={current === preset.value ? "default" : "secondary"}
          size="sm"
          onClick={() => setPreset(preset.value)}
        >
          {preset.label}
        </Button>
      ))}
    </div>
  );
}
