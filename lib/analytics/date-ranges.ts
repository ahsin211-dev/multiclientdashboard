import { subDays, startOfDay, endOfDay } from "date-fns";
import type { DateRange } from "./types";

export type PresetRange = "7d" | "30d" | "custom";

export function getPresetDateRange(preset: "7d" | "30d"): {
  current: DateRange;
  previous: DateRange;
} {
  const today = endOfDay(new Date());
  const days = preset === "7d" ? 7 : 30;

  const currentFrom = startOfDay(subDays(today, days - 1));
  const previousTo = endOfDay(subDays(currentFrom, 1));
  const previousFrom = startOfDay(subDays(previousTo, days - 1));

  return {
    current: { from: currentFrom, to: today },
    previous: { from: previousFrom, to: previousTo },
  };
}

export function getComparisonRange(range: DateRange): DateRange {
  const durationMs = range.to.getTime() - range.from.getTime();
  const previousTo = new Date(range.from.getTime() - 1);
  const previousFrom = new Date(previousTo.getTime() - durationMs);

  return { from: previousFrom, to: previousTo };
}
