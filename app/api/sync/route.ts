import { NextResponse } from "next/server";
import { z } from "zod";
import { enqueueSyncJob } from "@/lib/queue/sync-queue";

const syncSchema = z.object({
  clientId: z.string().min(1),
  reason: z.enum(["manual", "scheduled", "oauth-connected", "retry"]).default("manual"),
});

export async function POST(request: Request) {
  const contentType = request.headers.get("content-type") ?? "";
  const payload = contentType.includes("application/json")
    ? await request.json()
    : Object.fromEntries((await request.formData()).entries());

  const body = syncSchema.safeParse(payload);
  if (!body.success) {
    return NextResponse.json({ error: "Invalid sync payload", issues: body.error.flatten() }, { status: 400 });
  }

  const job = await enqueueSyncJob(body.data);
  const referer = request.headers.get("referer");
  if (!contentType.includes("application/json") && referer) {
    return NextResponse.redirect(referer);
  }

  return NextResponse.json({ job });
}
