import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { retrySyncJob } from "@/lib/amazon/sync";

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await request.formData();
  const jobId = formData.get("jobId") as string;

  if (!jobId) {
    return NextResponse.json({ error: "Job ID required" }, { status: 400 });
  }

  const job = await prisma.dataSyncJob.findFirst({
    where: {
      id: jobId,
      client: { workspaceId: session.workspaceId },
    },
  });

  if (!job) {
    return NextResponse.json({ error: "Job not found" }, { status: 404 });
  }

  try {
    await retrySyncJob(jobId);
    return NextResponse.redirect(
      new URL(`/clients/${job.clientId}/settings`, request.url)
    );
  } catch (error) {
    console.error("Retry error:", error);
    return NextResponse.json({ error: "Retry failed" }, { status: 500 });
  }
}
