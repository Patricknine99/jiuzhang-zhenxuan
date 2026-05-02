import Redis from "ioredis";
import { config } from "./config.mjs";

export const redis = new Redis(config.redis.url, {
  maxRetriesPerRequest: config.redis.maxRetriesPerRequest,
  retryStrategy(times) {
    const delay = Math.min(times * 50, config.redis.retryDelayMaxMs);
    return delay;
  }
});

redis.on("error", (err) => {
  console.error("Redis error:", err.message);
});

/**
 * Rate limit using Redis sliding window.
 * @param {string} key
 * @param {number} windowMs
 * @param {number} max
 */
export async function consumeRateLimitRedis(key, windowMs, max) {
  const now = Date.now();
  const windowStart = now - windowMs;
  const redisKey = `ratelimit:${key}`;

  const pipeline = redis.pipeline();
  pipeline.zremrangebyscore(redisKey, 0, windowStart);
  pipeline.zcard(redisKey);
  const [, [, count]] = await pipeline.exec();

  if (count >= max) {
    const oldest = await redis.zrange(redisKey, 0, 0, "WITHSCORES");
    const retryAfterMs = oldest.length ? Number(oldest[1]) + windowMs - now : windowMs;
    return { ok: false, retryAfterMs: Math.max(0, retryAfterMs) };
  }

  await redis.zadd(redisKey, now, `${now}_${Math.random().toString(36).slice(2, 8)}`);
  await redis.pexpire(redisKey, windowMs);
  return { ok: true, retryAfterMs: 0 };
}

/**
 * Store auth code in Redis with TTL.
 * @param {string} key
 * @param {string} codeHash
 * @param {number} ttlMs
 */
export async function setAuthCode(key, codeHash, ttlMs) {
  const redisKey = `authcode:${key}`;
  await redis.setex(redisKey, Math.ceil(ttlMs / 1000), JSON.stringify({ codeHash, attempts: 0 }));
}

/**
 * Get auth code from Redis.
 * @param {string} key
 * @returns {Promise<{codeHash: string, attempts: number} | null>}
 */
export async function getAuthCode(key) {
  const redisKey = `authcode:${key}`;
  const raw = await redis.get(redisKey);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

/**
 * Increment auth code attempts in Redis.
 * @param {string} key
 * @param {number} ttlMs
 */
export async function incrementAuthCodeAttempts(key) {
  const redisKey = `authcode:${key}`;
  const raw = await redis.get(redisKey);
  if (!raw) return;
  const data = JSON.parse(raw);
  data.attempts += 1;
  const remainingTtl = await redis.ttl(redisKey);
  await redis.setex(redisKey, Math.max(remainingTtl, 1), JSON.stringify(data));
}

/**
 * Delete auth code from Redis.
 * @param {string} key
 */
export async function deleteAuthCode(key) {
  await redis.del(`authcode:${key}`);
}

/**
 * Check send cooldown in Redis.
 * @param {string} key
 * @param {number} cooldownMs
 */
export async function checkSendCooldown(key, cooldownMs) {
  const redisKey = `sendcooldown:${key}`;
  const lastSent = await redis.get(redisKey);
  if (lastSent) {
    const elapsed = Date.now() - Number(lastSent);
    if (elapsed < cooldownMs) {
      return { ok: false, retryAfterMs: cooldownMs - elapsed };
    }
  }
  await redis.setex(redisKey, Math.ceil(cooldownMs / 1000), String(Date.now()));
  return { ok: true, retryAfterMs: 0 };
}

/**
 * Gracefully close Redis connection.
 */
export async function closeRedis() {
  await redis.quit();
}
