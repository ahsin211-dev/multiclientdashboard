import { ClientSyncStatus, DataSyncJobType } from "@prisma/client";

import { prisma } from "@/lib/db/prisma";
import { enqueueSyncJob } from "@/lib/queue/jobs";

export async function runDailyScheduledSync() {
  const clients = await prisma.client.findMany({
    where: {
      syncStatus: {
        in: [ClientSyncStatus.CONNECTED, ClientSyncStatus.FAILED]
      }
    },
    select: {
      id: true,
      workspaceId: true
    }
  });

  for (const client of clients) {
    await enqueueSyncJob(client.id, client.workspaceId, DataSyncJobType.SCHEDULED_DAILY);
  }

  return clients.length;
}
