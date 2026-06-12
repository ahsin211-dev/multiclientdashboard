import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { createSyncJob } from "@/lib/amazon/sync";
import { enqueueSyncJob } from "@/lib/queue";

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const clients = await prisma.client.findMany({
      where: {
        connections: { some: { status: "CONNECTED" } },
      },
    });

    const jobs = [];
    for (const client of clients) {
      const job = await createSyncJob(client.id);
      await enqueueSyncJob(job.id);
      jobs.push(job.id);
    }

    return NextResponse.json({
      success: true,
      clientsProcessed: clients.length,
      jobIds: jobs,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Cron sync failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
