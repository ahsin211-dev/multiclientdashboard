import { prisma } from "@/lib/db/prisma";

/**
 * Resolves the "active" workspace. In this MVP there is no session-based auth,
 * so we use the demo workspace. This is the single place to swap in real
 * session/workspace resolution later (e.g. from NextAuth + WorkspaceMember).
 */
export async function getActiveWorkspace() {
  const workspace =
    (await prisma.workspace.findUnique({ where: { slug: "demo-agency" } })) ??
    (await prisma.workspace.findFirst());
  return workspace;
}

export async function getActiveWorkspaceId(): Promise<string | null> {
  const ws = await getActiveWorkspace();
  return ws?.id ?? null;
}

/** Lightweight client list for switchers / sidebars. */
export async function listClients() {
  const ws = await getActiveWorkspace();
  if (!ws) return [];
  return prisma.client.findMany({
    where: { workspaceId: ws.id },
    select: { id: true, brandName: true, marketplace: true },
    orderBy: { brandName: "asc" },
  });
}
