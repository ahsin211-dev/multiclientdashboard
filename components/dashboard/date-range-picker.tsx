"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { Select } from "@/components/ui/select";

export function DateRangePicker() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const range = searchParams.get("range") ?? "last7";

  return (
    <Select
      className="w-[220px]"
      value={range}
      onChange={(event) => {
        const params = new URLSearchParams(searchParams.toString());
        params.set("range", event.target.value);
        router.push(`${pathname}?${params.toString()}`);
      }}
    >
      <option value="last7">Last 7 days vs previous 7</option>
      <option value="last30">Last 30 days vs previous 30</option>
      <option value="custom">Custom (use from/to query)</option>
    </Select>
  );
}
