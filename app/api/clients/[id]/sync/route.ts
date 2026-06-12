import { NextResponse } from "next/server";

import { enqueueClientSync, runClientSync } from "@/lib/queue/sync-queue";

type SyncRouteProps = {
  params: Promise<{ id: string }>;
};

export async function POST(_: Request, { params }: SyncRouteProps) {
  const { id } = await params;
  const queued = await enqueueClientSync({
    clientId: id,
    trigger: "manual",
  });

  if (queued.queued) {
    return NextResponse.json({
      status: "queued",
      jobId: queued.jobId,
    });
  }

  const result = await runClientSync(id);

  return NextResponse.json({
    status: "completed",
    fallback: true,
    result,
  });
}
