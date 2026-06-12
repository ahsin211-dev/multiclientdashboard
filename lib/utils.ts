import { clsx, type ClassValue } from "clsx";
import { format, subDays } from "date-fns";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export type DateRangePreset = "7d" | "30d" | "custom";

export type DateRange = {
  from: Date;
  to: Date;
  preset: DateRangePreset;
};

export function formatCurrency(value: number, currency = "USD") {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatPercent(value: number, digits = 1) {
  return `${(value * 100).toFixed(digits)}%`;
}

export function formatCompactNumber(value: number) {
  return new Intl.NumberFormat("en-US", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
}

export function formatDateLabel(date: Date) {
  return format(date, "MMM d");
}

export function getPresetDateRange(preset: DateRangePreset): DateRange {
  const to = new Date();
  const days = preset === "30d" ? 29 : 6;

  return {
    from: subDays(to, days),
    to,
    preset,
  };
}

export function getComparisonRange(range: DateRange): DateRange {
  const days = Math.max(1, Math.ceil((range.to.getTime() - range.from.getTime()) / (1000 * 60 * 60 * 24)));

  return {
    from: subDays(range.from, days + 1),
    to: subDays(range.to, days + 1),
    preset: range.preset,
  };
}

export function parseDateRange(searchParams?: Record<string, string | string[] | undefined>): DateRange {
  const presetParam = typeof searchParams?.preset === "string" ? searchParams.preset : "7d";
  const fromParam = typeof searchParams?.from === "string" ? searchParams.from : undefined;
  const toParam = typeof searchParams?.to === "string" ? searchParams.to : undefined;

  if (presetParam === "custom" && fromParam && toParam) {
    return {
      from: new Date(fromParam),
      to: new Date(toParam),
      preset: "custom",
    };
  }

  return getPresetDateRange(presetParam === "30d" ? "30d" : "7d");
}

export function calculateDelta(current: number, previous: number) {
  if (previous === 0) {
    return current === 0 ? 0 : 1;
  }

  return (current - previous) / previous;
}
