import { query } from "./db.mjs";
import { redis, setAuthCode, getAuthCode, incrementAuthCodeAttempts, deleteAuthCode } from "./redis.mjs";

/**
 * Save a lead to PostgreSQL.
 * @param {object} payload
 * @param {string} requestId
 * @param {string[]} channels
 * @param {string} [accountId]
 */
export async function saveLead(payload, requestId, channels, accountId) {
  const result = await query(
    `INSERT INTO leads (type, request_id, payload, status, channels, results, account_id)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     ON CONFLICT (request_id) DO UPDATE SET
       payload = EXCLUDED.payload,
       status = EXCLUDED.status,
       channels = EXCLUDED.channels,
       results = EXCLUDED.results,
       account_id = COALESCE(EXCLUDED.account_id, leads.account_id),
       updated_at = NOW()
     RETURNING id`,
    [
      payload.type,
      requestId,
      JSON.stringify(payload),
      "pending",
      JSON.stringify(channels),
      JSON.stringify([]),
      accountId || null
    ]
  );
  return { ok: true, channel: "database", message: `Lead saved with id ${result.rows[0].id}` };
}

/**
 * Update lead results after channel submission.
 * @param {string} requestId
 * @param {object[]} results
 */
export async function updateLeadResults(requestId, results) {
  await query(
    `UPDATE leads SET results = $1, status = $2, updated_at = NOW() WHERE request_id = $3`,
    [JSON.stringify(results), results.some((r) => r.ok) ? "sent" : "failed", requestId]
  );
}

/**
 * Get recent leads (for admin console).
 * @param {number} limit
 */
export async function getRecentLeads(limit = 50) {
  const result = await query(
    `SELECT type, request_id, status, payload, results, created_at
     FROM leads ORDER BY created_at DESC LIMIT $1`,
    [limit]
  );
  return result.rows.map((row) => ({
    type: row.type,
    requestId: row.request_id,
    status: row.status,
    ok: row.status === "sent",
    partialFailure: row.results && row.results.some((r) => !r.ok) && row.results.some((r) => r.ok),
    submittedAt: row.created_at,
    results: row.results || []
  }));
}

/**
 * Get leads by account ID and type.
 * @param {string} accountId
 * @param {string} [type] - "demand" or "application"
 * @param {number} [limit]
 */
export async function getLeadsByAccount(accountId, type, limit = 50) {
  const clauses = [`account_id = $1`];
  const values = [accountId];
  if (type) {
    clauses.push(`type = $2`);
    values.push(type);
  }
  const result = await query(
    `SELECT type, request_id, status, payload, results, created_at
     FROM leads WHERE ${clauses.join(" AND ")} ORDER BY created_at DESC LIMIT $${values.length + 1}`,
    [...values, limit]
  );
  return result.rows.map((row) => ({
    type: row.type,
    requestId: row.request_id,
    status: row.status,
    ok: row.status === "sent",
    partialFailure: row.results && row.results.some((r) => !r.ok) && row.results.some((r) => r.ok),
    submittedAt: row.created_at,
    results: row.results || []
  }));
}

/**
 * Store auth code using Redis (with PostgreSQL fallback).
 * @param {string} method
 * @param {string} identifier
 * @param {string} purpose
 * @param {string} role
 * @param {string} codeHash
 * @param {number} ttlMs
 */
export async function storeAuthCode(method, identifier, purpose, role, codeHash, ttlMs) {
  const key = getAuthCodeKey(method, identifier, purpose, role);
  if (redis.status === "ready" || redis.status === "connect") {
    try {
      await setAuthCode(key, codeHash, ttlMs);
      return;
    } catch (error) {
      console.warn(`Redis auth code write failed, falling back to PostgreSQL: ${error instanceof Error ? error.message : "unknown error"}`);
    }
  }
  // Fallback: store in PostgreSQL
  await query(
    `INSERT INTO auth_codes (key, code_hash, expires_at, attempts)
     VALUES ($1, $2, NOW() + INTERVAL '1 millisecond' * $3, 0)
     ON CONFLICT (key) DO UPDATE SET
       code_hash = EXCLUDED.code_hash,
       expires_at = EXCLUDED.expires_at,
       attempts = 0`,
    [key, codeHash, ttlMs]
  );
}

/**
 * Verify auth code using Redis (with PostgreSQL fallback).
 * @param {string} method
 * @param {string} identifier
 * @param {string} purpose
 * @param {string} role
 * @param {string} code
 * @param {number} maxAttempts
 * @param {Function} isValidSecretFn
 */
export async function verifyAuthCode(method, identifier, purpose, role, code, maxAttempts, isValidSecretFn) {
  const key = getAuthCodeKey(method, identifier, purpose, role);

  if (redis.status === "ready" || redis.status === "connect") {
    try {
      const stored = await getAuthCode(key);
      if (!stored) throw new Error("验证码已过期，请重新获取");
      if (stored.attempts >= maxAttempts) {
        await deleteAuthCode(key);
        throw new Error("验证码尝试次数过多，请重新获取");
      }
      await incrementAuthCodeAttempts(key);
      if (!isValidSecretFn(code, stored.codeHash)) {
        throw new Error("验证码不正确");
      }
      await deleteAuthCode(key);
      return;
    } catch (error) {
      if (error instanceof Error && ["验证码已过期，请重新获取", "验证码尝试次数过多，请重新获取", "验证码不正确"].includes(error.message)) {
        throw error;
      }
      console.warn(`Redis auth code read failed, falling back to PostgreSQL: ${error instanceof Error ? error.message : "unknown error"}`);
    }
  }

  // PostgreSQL fallback
  const result = await query(
    `SELECT code_hash, expires_at, attempts FROM auth_codes WHERE key = $1`,
    [key]
  );
  const row = result.rows[0];
  if (!row || new Date(row.expires_at) < new Date()) {
    await query(`DELETE FROM auth_codes WHERE key = $1`, [key]);
    throw new Error("验证码已过期，请重新获取");
  }
  if (row.attempts >= maxAttempts) {
    await query(`DELETE FROM auth_codes WHERE key = $1`, [key]);
    throw new Error("验证码尝试次数过多，请重新获取");
  }
  await query(`UPDATE auth_codes SET attempts = attempts + 1 WHERE key = $1`, [key]);
  if (!isValidSecretFn(code, row.code_hash)) {
    throw new Error("验证码不正确");
  }
  await query(`DELETE FROM auth_codes WHERE key = $1`, [key]);
}

function getAuthCodeKey(method, identifier, purpose, role) {
  return `${purpose}:${role}:${method}:${identifier}`;
}

/**
 * Create auth account in PostgreSQL.
 */
export async function createAuthAccount({ id, method, identifier, displayName, role, passwordHash, trustedDevices }) {
  const result = await query(
    `INSERT INTO auth_accounts (id, method, identifier, display_name, role, password_hash, trusted_devices)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     ON CONFLICT (identifier) DO NOTHING
     RETURNING id`,
    [id, method, identifier, displayName, role, passwordHash, trustedDevices]
  );
  if (result.rowCount === 0) throw new Error("该账号已存在，不能重复创建");
  return { id, method, identifier, displayName, role, trustedDevices };
}

/**
 * Get auth account by method + identifier.
 */
export async function getAuthAccount(method, identifier) {
  const result = await query(
    `SELECT id, method, identifier, display_name, role, password_hash, trusted_devices, created_at
     FROM auth_accounts WHERE method = $1 AND identifier = $2`,
    [method, identifier]
  );
  const row = result.rows[0];
  if (!row) return null;
  return {
    id: row.id,
    method: row.method,
    identifier: row.identifier,
    displayName: row.display_name,
    role: row.role,
    passwordHash: row.password_hash,
    trustedDevices: new Set(row.trusted_devices || []),
    createdAt: row.created_at
  };
}

/**
 * Add trusted device to auth account.
 */
export async function addTrustedDevice(method, identifier, deviceId) {
  await query(
    `UPDATE auth_accounts
     SET trusted_devices = array_append(trusted_devices, $1),
         updated_at = NOW()
     WHERE method = $2 AND identifier = $3 AND NOT ($1 = ANY(trusted_devices))`,
    [deviceId, method, identifier]
  );
}

/**
 * Get admin account by email.
 */
export async function getAdminAccount(email) {
  const result = await query(
    `SELECT id, email, name, role, permissions, password_hash, created_at
     FROM admin_accounts WHERE email = $1`,
    [email]
  );
  const row = result.rows[0];
  if (!row) return null;
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    role: row.role,
    permissions: row.permissions,
    passwordHash: row.password_hash,
    createdAt: row.created_at
  };
}

/**
 * Write audit log.
 */
export async function writeAuditLog({ actor, action, resource, details, ipAddress }) {
  await query(
    `INSERT INTO audit_logs (actor, action, resource, details, ip_address)
     VALUES ($1, $2, $3, $4, $5)`,
    [actor, action, resource, details ? JSON.stringify(details) : null, ipAddress || null]
  );
}

/**
 * Get recent audit logs.
 */
export async function getRecentAuditLogs(limit = 50) {
  const result = await query(
    `SELECT actor, action, resource, details, ip_address, created_at
     FROM audit_logs ORDER BY created_at DESC LIMIT $1`,
    [limit]
  );
  return result.rows;
}

// Graceful shutdown helpers
export async function closeDatabaseConnections() {
  const { closePool } = await import("./db.mjs");
  const { closeRedis } = await import("./redis.mjs");
  await closePool();
  await closeRedis();
}
