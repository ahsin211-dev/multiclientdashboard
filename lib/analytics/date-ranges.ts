import {
  subDays,
  startOfDay,
  endOfDay,
  differenceInCalendarDays,
} from "date-fns";
import type { DateRange } from "./types";

export type PeriodPreset = "7d" | "30d" | "90d" | "custom";

/** Returns the [from, to] range (inclusive) for a preset, ending today. */
export function presetRange(preset: PeriodPreset, now = new Date()): DateRange {
  const to = endOfDay(now);
  switch (preset) {
    case "7d":
      return { from: startOfDay(subDays(now, 6)), to };
    case "30d":
      return { from: startOfDay(subDays(now, 29)), to };
    case "90d":
      return { from: startOfDay(subDays(now, 89)), to };
    default:
      return { from: startOfDay(subDays(now, 29)), to };
  }
}

/**
 * The immediately-preceding period of equal length, used for trend comparison
 * (e.g. last 7 days vs the 7 days before that).
 */
export function previousRange(range: DateRange): DateRange {
  const days = differenceInCalendarDays(range.to, range.from) + 1;
  return {
    from: startOfDay(subDays(range.from, days)),
    to: endOfDay(subDays(range.to, days)),
  };
}

export function parseRange(
  fromStr?: string | null,
  toStr?: string | null,
  fallback: PeriodPreset = "30d"
): DateRange {
  if (fromStr && toStr) {
    const from = startOfDay(new Date(fromStr));
    const to = endOfDay(new Date(toStr));
    if (!Number.isNaN(from.getTime()) && !Number.isNaN(to.getTime())) {
      return { from, to };
    }
  }
  return presetRange(fallback);
}

export function rangeLengthDays(range: DateRange): number {
  return differenceInCalendarDays(range.to, range.from) + 1;
}
