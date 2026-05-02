import "./env.mjs";

export const config = {
  postgres: {
    url: process.env.DATABASE_URL || "postgresql://nine9jiu@localhost:5432/jiuzhang",
    poolMax: readPositiveInt("DATABASE_POOL_MAX", 20),
    idleTimeoutMs: readPositiveInt("DATABASE_IDLE_TIMEOUT_MS", 30_000),
    connectionTimeoutMs: readPositiveInt("DATABASE_CONNECTION_TIMEOUT_MS", 5_000),
    initCreateDatabase: readBoolean("DB_INIT_CREATE_DATABASE", false)
  },
  redis: {
    url: process.env.REDIS_URL || "redis://localhost:6379",
    maxRetriesPerRequest: readPositiveInt("REDIS_MAX_RETRIES_PER_REQUEST", 3),
    retryDelayMaxMs: readPositiveInt("REDIS_RETRY_DELAY_MAX_MS", 2_000)
  }
};

export function readPositiveInt(key, fallback) {
  const value = Number(process.env[key]);
  return Number.isInteger(value) && value > 0 ? value : fallback;
}

export function readBoolean(key, fallback = false) {
  const value = process.env[key];
  if (value === "true") return true;
  if (value === "false") return false;
  return fallback;
}
