import { NextResponse } from "next/server";

import { scheduleDailySyncs } from "@/lib/queue/scheduler";

export async function GET() {
  const result = await scheduleDailySyncs();
  return NextResponse.json(result);
}
