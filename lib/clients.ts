import { prisma } from "@/lib/db/prisma";
import { getSession } from "@/lib/auth/session";
import { getPresetDateRange } from "@/lib/analytics/date-ranges";
import type { DateRange } from "@/lib/analytics/types";

export async function getWorkspaceClients() {
  const session = await getSession();
  if (!session) return [];

  return prisma.client.findMany({
    where: { workspaceId: session.workspaceId },
    orderBy: { brandName: "asc" },
    select: {
      id: true,
      brandName: true,
      marketplace: true,
      syncStatus: true,
      lastSyncAt: true,
    },
  });
}

export async function getClientById(clientId: string) {
  const session = await getSession();
  if (!session) return null;

  return prisma.client.findFirst({
    where: { id: clientId, workspaceId: session.workspaceId },
    include: {
      connections: true,
      adAccounts: true,
      _count: {
        select: {
          campaigns: true,
          products: true,
          syncJobs: true,
        },
      },
    },
  });
}

export function parseDateRange(
  rangeParam?: string,
  customFrom?: string,
  customTo?: string
): DateRange {
  if (rangeParam === "7d" || rangeParam === "30d") {
    return getPresetDateRange(rangeParam).current;
  }
  if (customFrom && customTo) {
    return { from: new Date(customFrom), to: new Date(customTo) };
  }
  return getPresetDateRange("30d").current;
}
