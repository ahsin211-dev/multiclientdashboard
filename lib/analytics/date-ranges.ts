import type { DateRange, DateRangeKey } from "@/lib/analytics/types";

export function getDateRange(key: DateRangeKey = "30d"): DateRange {
  const to = new Date();
  to.setUTCHours(23, 59, 59, 999);
  const from = new Date(to);
  from.setUTCHours(0, 0, 0, 0);
  from.setUTCDate(to.getUTCDate() - (key === "7d" ? 6 : 29));

  return { key, from, to };
}

export function getPreviousRange(range: DateRange): DateRange {
  const days = Math.max(1, Math.ceil((range.to.getTime() - range.from.getTime()) / (24 * 60 * 60 * 1000)));
  const to = new Date(range.from);
  to.setUTCDate(to.getUTCDate() - 1);
  const from = new Date(to);
  from.setUTCDate(to.getUTCDate() - days + 1);
  return { key: range.key, from, to };
}
