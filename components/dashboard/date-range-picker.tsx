"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

export function DateRangePicker() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const current = searchParams.get("range") || "30d";

  function setRange(range: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("range", range);
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <Tabs value={current} onValueChange={setRange}>
      <TabsList>
        <TabsTrigger value="7d">Last 7 days</TabsTrigger>
        <TabsTrigger value="30d">Last 30 days</TabsTrigger>
      </TabsList>
    </Tabs>
  );
}
