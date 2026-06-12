import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { retrySyncJob } from "@/lib/amazon/sync";
import { enqueueSyncJob } from "@/lib/queue";
import { z } from "zod";

const retrySchema = z.object({ jobId: z.string().cuid() });

export async function POST(request: Request) {
  try {
    const session = await requireSession();
    const { jobId } = retrySchema.parse(await request.json());

    const job = await prisma.dataSyncJob.findUnique({
      where: { id: jobId },
      include: { client: true },
    });

    if (!job || job.client.workspaceId !== session.workspaceId) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    await retrySyncJob(jobId);
    await enqueueSyncJob(jobId);

    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Retry failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
