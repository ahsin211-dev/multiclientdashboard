import { runDailyScheduledSync } from "@/lib/queue/scheduler";

async function main() {
  const count = await runDailyScheduledSync();
  console.info(`Scheduled ${count} clients for daily sync.`);
}

main().catch((error) => {
  console.error("Cron execution failed", error);
  process.exit(1);
});
