import { prisma } from "@/lib/db/prisma";
import { requireSession } from "@/lib/auth/session";

export async function getWorkspaceClients() {
  const session = await requireSession();
  return prisma.client.findMany({
    where: { workspaceId: session.workspaceId },
    orderBy: { brandName: "asc" },
  });
}

export async function getClientOrThrow(clientId: string) {
  const session = await requireSession();
  const client = await prisma.client.findFirst({
    where: { id: clientId, workspaceId: session.workspaceId },
    include: {
      connections: true,
      adAccounts: true,
      syncJobs: { orderBy: { createdAt: "desc" }, take: 5 },
    },
  });

  if (!client) throw new Error("Client not found");
  return client;
}
