import { subDays, startOfDay, endOfDay } from "date-fns";
import type { DateRange } from "@/lib/types";

export type PeriodPreset = "7d" | "30d" | "custom";

export function getPeriodRange(preset: PeriodPreset, custom?: DateRange): {
  current: DateRange;
  previous: DateRange;
} {
  const today = endOfDay(new Date());

  if (preset === "7d") {
    const currentFrom = startOfDay(subDays(today, 6));
    const previousTo = endOfDay(subDays(currentFrom, 1));
    const previousFrom = startOfDay(subDays(previousTo, 6));
    return {
      current: { from: currentFrom, to: today },
      previous: { from: previousFrom, to: previousTo },
    };
  }

  if (preset === "30d") {
    const currentFrom = startOfDay(subDays(today, 29));
    const previousTo = endOfDay(subDays(currentFrom, 1));
    const previousFrom = startOfDay(subDays(previousTo, 29));
    return {
      current: { from: currentFrom, to: today },
      previous: { from: previousFrom, to: previousTo },
    };
  }

  if (!custom) throw new Error("Custom date range required");
  const days = Math.ceil(
    (custom.to.getTime() - custom.from.getTime()) / (1000 * 60 * 60 * 24)
  ) + 1;
  const previousTo = endOfDay(subDays(custom.from, 1));
  const previousFrom = startOfDay(subDays(previousTo, days - 1));

  return {
    current: { from: startOfDay(custom.from), to: endOfDay(custom.to) },
    previous: { from: previousFrom, to: previousTo },
  };
}

export function parseDateRange(from?: string, to?: string): DateRange {
  const toDate = to ? new Date(to) : new Date();
  const fromDate = from ? new Date(from) : subDays(toDate, 29);
  return { from: startOfDay(fromDate), to: endOfDay(toDate) };
}
