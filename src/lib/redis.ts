import Redis from "ioredis";

import { env } from "@/env";
import { logger } from "@/lib/logger";

let client: Redis | undefined;

// Created on first use, so the app boots without Redis when REDIS_URL is unset.
export const getRedis = (): Redis => {
  if (client) return client;

  if (!env.REDIS_URL) {
    throw new Error("REDIS_URL is not set. Add it to .env to use Redis.");
  }

  client = new Redis(env.REDIS_URL, {
    maxRetriesPerRequest: 3,
    enableReadyCheck: true,
  });

  client.on("connect", () => {
    logger.info("Redis connected");
  });

  client.on("error", (err: Error) => {
    logger.error("Redis error", { message: err.message });
  });

  client.on("reconnecting", () => {
    logger.warn("Redis reconnecting");
  });

  return client;
};

// Quits only if a client was created.
export const closeRedis = async (): Promise<void> => {
  if (!client) return;
  await client.quit();
  client = undefined;
};

// ── Cache helpers ────────────────────────────────────────────────────────────
type CacheModule = "user" | "auth" | "rate" | "session";

type CacheKey = string & { readonly __brand: "CacheKey" };

// format: "module:subtype:id"
export const createCacheKey = (module: CacheModule, subtype: string, id: string): CacheKey => {
  return `${module}:${subtype}:${id}` as CacheKey;
};

// Set with expiry (seconds)
export const setCache = async (
  key: CacheKey,
  value: unknown,
  ttlSeconds: number = 3600
): Promise<void> => {
  await getRedis().set(key, JSON.stringify(value), "EX", ttlSeconds);
};

// Get and auto-parse
export const getCache = async <T>(key: CacheKey): Promise<T | null> => {
  const data = await getRedis().get(key);
  if (!data) return null;
  return JSON.parse(data) as T;
};

// Delete
export const deleteCache = async (key: CacheKey): Promise<void> => {
  await getRedis().del(key);
};

// Delete multiple keys by pattern e.g. "user:*". Uses SCAN, which does not block Redis like KEYS.
export const deleteCacheByPattern = async (pattern: string): Promise<void> => {
  const redis = getRedis();
  let cursor = "0";
  do {
    const [next, keys] = await redis.scan(cursor, "MATCH", pattern, "COUNT", 100);
    if (keys.length > 0) await redis.del(...keys);
    cursor = next;
  } while (cursor !== "0");
};
