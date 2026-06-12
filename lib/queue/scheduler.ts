import { getClients } from "@/lib/db/repository";
import { enqueueClientSync } from "@/lib/queue/sync-queue";

export async function scheduleDailySyncs() {
  const clients = await getClients();
  const jobs = await Promise.all(
    clients.map((client) =>
      enqueueClientSync({
        clientId: client.id,
        trigger: "daily",
      }),
    ),
  );

  return {
    scheduled: jobs.length,
    jobs,
  };
}
