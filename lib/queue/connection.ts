import IORedis, { type Redis } from "ioredis";

/**
 * Shared Redis connection for BullMQ. Returns null when REDIS_URL is not set so
 * the queue layer can transparently fall back to inline execution.
 */
let connection: Redis | null = null;
let attempted = false;

export function getRedis(): Redis | null {
  if (attempted) return connection;
  attempted = true;
  const url = process.env.REDIS_URL;
  if (!url) return null;
  try {
    connection = new IORedis(url, {
      maxRetriesPerRequest: null, // required by BullMQ
      lazyConnect: false,
    });
    connection.on("error", (err) => {
      console.error("[redis] connection error:", err.message);
    });
  } catch (err) {
    console.error("[redis] failed to init:", err);
    connection = null;
  }
  return connection;
}

/**
 * BullMQ is only used when explicitly enabled (ENABLE_QUEUE=true) AND a
 * REDIS_URL is present. This keeps the app working out-of-the-box (syncs run
 * inline) while still supporting a real queue + worker in production. Run the
 * worker with `npm run worker` when ENABLE_QUEUE=true.
 */
export function isQueueEnabled(): boolean {
  return process.env.ENABLE_QUEUE === "true" && Boolean(process.env.REDIS_URL);
}
