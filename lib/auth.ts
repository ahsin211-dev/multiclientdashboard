import { prisma } from "@/lib/db/prisma";

export async function getCurrentUser() {
  return prisma.user.findFirst({
    include: {
      memberships: {
        include: {
          workspace: true
        }
      }
    },
    orderBy: { createdAt: "asc" }
  });
}

export async function getDefaultWorkspaceId() {
  const user = await getCurrentUser();
  return user?.memberships[0]?.workspaceId ?? null;
}
