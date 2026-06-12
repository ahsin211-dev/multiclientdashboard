import { startSyncWorker } from "@/lib/queue/worker";

const worker = startSyncWorker();

if (!worker) {
  process.exit(0);
}

console.info("Sync worker started.");
