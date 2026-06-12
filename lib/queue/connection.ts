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

export function isQueueEnabled(): boolean {
  return Boolean(process.env.REDIS_URL);
}
