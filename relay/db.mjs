import pg from "pg";
import { config } from "./config.mjs";
const { Pool } = pg;

export const pool = new Pool({
  connectionString: config.postgres.url,
  max: config.postgres.poolMax,
  idleTimeoutMillis: config.postgres.idleTimeoutMs,
  connectionTimeoutMillis: config.postgres.connectionTimeoutMs
});

pool.on("error", (err) => {
  console.error("Unexpected PostgreSQL pool error:", err.message);
});

/**
 * Execute a parameterized query.
 * @param {string} text
 * @param {any[]} [params]
 * @returns {Promise<pg.QueryResult>}
 */
export async function query(text, params) {
  const client = await pool.connect();
  try {
    return await client.query(text, params);
  } finally {
    client.release();
  }
}

/**
 * Get a client from the pool for transactions.
 * Remember to call client.release() when done.
 * @returns {Promise<pg.PoolClient>}
 */
export async function getClient() {
  return pool.connect();
}

/**
 * Gracefully close the pool.
 */
export async function closePool() {
  await pool.end();
}
