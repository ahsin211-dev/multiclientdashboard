import { endOfDay, parseISO, startOfDay, subDays } from "date-fns";

import type { DateRange, DateRangePreset } from "@/lib/types";

export function resolveDateRange(
  preset: DateRangePreset = "last7",
  customFrom?: string,
  customTo?: string
): DateRange {
  if (preset === "custom" && customFrom && customTo) {
    return {
      from: startOfDay(parseISO(customFrom)),
      to: endOfDay(parseISO(customTo))
    };
  }

  if (preset === "last30") {
    return {
      from: startOfDay(subDays(new Date(), 29)),
      to: endOfDay(new Date())
    };
  }

  return {
    from: startOfDay(subDays(new Date(), 6)),
    to: endOfDay(new Date())
  };
}

export function previousDateRange(range: DateRange): DateRange {
  const windowMs = range.to.getTime() - range.from.getTime();
  const previousTo = new Date(range.from.getTime() - 1);
  const previousFrom = new Date(previousTo.getTime() - windowMs);
  return { from: previousFrom, to: previousTo };
}
