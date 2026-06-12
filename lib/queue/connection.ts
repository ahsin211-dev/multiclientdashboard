import { RedisOptions } from "ioredis";

import { env } from "@/lib/env";

export const SYNC_QUEUE_NAME = "client-sync-jobs";

export function getRedisConnectionOptions(): RedisOptions | null {
  if (!env.REDIS_URL) {
    return null;
  }

  const redisUrl = new URL(env.REDIS_URL);
  return {
    host: redisUrl.hostname,
    port: Number(redisUrl.port || 6379),
    username: redisUrl.username || undefined,
    password: redisUrl.password || undefined,
    tls: redisUrl.protocol === "rediss:" ? {} : undefined
  };
}
