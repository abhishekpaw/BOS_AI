import Redis from "ioredis";

let redis = null;

if (process.env.REDIS_URL) {
  redis = new Redis(process.env.REDIS_URL);
}

export async function getCachedResponse(key) {
  if (!redis) return null;
  return redis.get(key);
}

export async function setCachedResponse(key, value, ttlSeconds = 300) {
  if (!redis) return;
  await redis.set(key, value, "EX", ttlSeconds);
}