import { NextResponse } from "next/server";
import { z } from "zod";
import { generateClientReport } from "@/lib/reports/client-report";

const reportSchema = z.object({
  clientId: z.string().min(1),
});

export async function POST(request: Request) {
  const body = reportSchema.safeParse(await request.json());
  if (!body.success) {
    return NextResponse.json({ error: "Invalid report payload", issues: body.error.flatten() }, { status: 400 });
  }

  const report = await generateClientReport(body.data.clientId);
  return NextResponse.json({ report });
}
