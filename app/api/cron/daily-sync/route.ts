import { NextResponse } from "next/server";
import { scheduleDailySync } from "@/lib/queue/sync-queue";

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const enqueued = await scheduleDailySync();
    return NextResponse.json({
      success: true,
      enqueued,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Daily sync cron error:", error);
    return NextResponse.json({ error: "Cron failed" }, { status: 500 });
  }
}
