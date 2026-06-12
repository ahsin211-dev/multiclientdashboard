import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { z } from "zod";

const createClientSchema = z.object({
  name: z.string().min(1),
  brandName: z.string().min(1),
  marketplace: z.enum(["US", "CA", "MX", "UK", "DE", "FR", "IT", "ES", "JP", "AU", "IN", "AE", "SG", "BR"]),
  workspaceId: z.string(),
  notes: z.string().optional(),
});

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const workspaceId = searchParams.get("workspaceId");

  if (!workspaceId) {
    return Response.json({ error: "workspaceId required" }, { status: 400 });
  }

  const clients = await db.client.findMany({
    where: { workspaceId },
    include: { amazonConnection: { select: { syncStatus: true, lastSyncAt: true } } },
    orderBy: { createdAt: "desc" },
  });

  return Response.json({ clients });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const data = createClientSchema.parse(body);

    const client = await db.client.create({
      data: {
        ...data,
        amazonConnection: {
          create: { syncStatus: "never" },
        },
      },
      include: { amazonConnection: true },
    });

    return Response.json({ client }, { status: 201 });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return Response.json({ error: "Invalid request", details: err.issues }, { status: 400 });
    }
    const message = err instanceof Error ? err.message : "Internal server error";
    return Response.json({ error: message }, { status: 500 });
  }
}
