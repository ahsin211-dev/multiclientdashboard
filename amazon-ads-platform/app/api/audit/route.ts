import { NextRequest } from "next/server";
import { generateAuditFindings } from "@/lib/analytics/audit";
import { z } from "zod";

const querySchema = z.object({
  clientId: z.string(),
  from: z.string().optional(),
  to: z.string().optional(),
});

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const { clientId, from, to } = querySchema.parse({
      clientId: searchParams.get("clientId"),
      from: searchParams.get("from"),
      to: searchParams.get("to"),
    });

    const now = new Date();
    const dateRange = {
      from: from ? new Date(from) : new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
      to: to ? new Date(to) : now,
    };

    const result = await generateAuditFindings(clientId, dateRange);
    return Response.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return Response.json({ error: message }, { status: 500 });
  }
}
