#!/usr/bin/env node
/**
 * Database initialization script.
 * Creates tables and seeds them with static JSON data.
 * Run with: node scripts/init-db.mjs
 */
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";
import { config } from "../relay/config.mjs";
const { Pool } = pg;

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, "..");

const DATABASE_URL = config.postgres.url;
const databaseUrl = new URL(DATABASE_URL);
const dbName = databaseUrl.pathname.replace(/^\//, "");
const dbOwner = databaseUrl.username ? decodeURIComponent(databaseUrl.username) : "";

const pool = new Pool({ connectionString: DATABASE_URL });

async function init() {
  console.log("Connecting to PostgreSQL...");

  if (!dbName) throw new Error("DATABASE_URL must include a database name");
  if (config.postgres.initCreateDatabase) {
    const adminUrl = new URL(DATABASE_URL);
    adminUrl.pathname = "/postgres";
    const adminPool = new Pool({ connectionString: adminUrl.toString() });
    await adminPool.query(`CREATE DATABASE ${quoteIdentifier(dbName)}${dbOwner ? ` WITH OWNER = ${quoteIdentifier(dbOwner)}` : ""} ENCODING = 'UTF8'`).catch((err) => {
      if (err.code === "42P04") {
        console.log(`Database "${dbName}" already exists.`);
      } else {
        throw err;
      }
    });
    await adminPool.end();
  } else {
    console.log("Skipping CREATE DATABASE. Set DB_INIT_CREATE_DATABASE=true only when the current PostgreSQL role has create-database permission.");
  }

  const client = await pool.connect();
  try {
    console.log("Creating tables...");

    await client.query(`
      CREATE TABLE IF NOT EXISTS providers (
        id SERIAL PRIMARY KEY,
        slug VARCHAR(64) UNIQUE NOT NULL,
        name VARCHAR(128) NOT NULL,
        level VARCHAR(2) NOT NULL CHECK (level IN ('L1', 'L2', 'L3')),
        level_label VARCHAR(32) NOT NULL,
        tags TEXT[] NOT NULL DEFAULT '{}',
        industry TEXT[] NOT NULL DEFAULT '{}',
        delivery_min INTEGER NOT NULL,
        delivery_max INTEGER NOT NULL,
        budget_min INTEGER NOT NULL,
        budget_max INTEGER NOT NULL,
        rating NUMERIC(2,1) NOT NULL CHECK (rating >= 0 AND rating <= 5),
        case_count INTEGER NOT NULL DEFAULT 0,
        avatar_url TEXT NOT NULL DEFAULT '',
        description TEXT NOT NULL,
        tech_stack TEXT[] NOT NULL DEFAULT '{}',
        can_invoice BOOLEAN NOT NULL DEFAULT false,
        featured BOOLEAN NOT NULL DEFAULT false,
        sort_order INTEGER NOT NULL DEFAULT 0,
        response_time VARCHAR(32) NOT NULL,
        services TEXT[] NOT NULL DEFAULT '{}',
        reviews TEXT[] NOT NULL DEFAULT '{}',
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS idx_providers_featured ON providers(featured);
      CREATE INDEX IF NOT EXISTS idx_providers_sort ON providers(sort_order);
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS cases (
        id SERIAL PRIMARY KEY,
        slug VARCHAR(128) UNIQUE NOT NULL,
        title VARCHAR(256) NOT NULL,
        provider_slug VARCHAR(64) NOT NULL REFERENCES providers(slug) ON DELETE CASCADE,
        provider_name VARCHAR(128) NOT NULL,
        category VARCHAR(64) NOT NULL,
        industry TEXT[] NOT NULL DEFAULT '{}',
        background TEXT NOT NULL,
        problem TEXT NOT NULL,
        solution TEXT NOT NULL,
        process TEXT NOT NULL,
        roi_text VARCHAR(128) NOT NULL,
        budget_text VARCHAR(64) NOT NULL,
        ai_label VARCHAR(64) NOT NULL,
        featured BOOLEAN NOT NULL DEFAULT false,
        sort_order INTEGER NOT NULL DEFAULT 0,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS idx_cases_featured ON cases(featured);
      CREATE INDEX IF NOT EXISTS idx_cases_sort ON cases(sort_order);
      CREATE INDEX IF NOT EXISTS idx_cases_provider ON cases(provider_slug);
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS leads (
        id SERIAL PRIMARY KEY,
        type VARCHAR(16) NOT NULL CHECK (type IN ('demand', 'application')),
        request_id VARCHAR(64) NOT NULL UNIQUE,
        payload JSONB NOT NULL,
        status VARCHAR(32) NOT NULL DEFAULT 'pending',
        channels JSONB NOT NULL DEFAULT '[]',
        results JSONB NOT NULL DEFAULT '[]',
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS idx_leads_type ON leads(type);
      CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
      CREATE INDEX IF NOT EXISTS idx_leads_created ON leads(created_at DESC);
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS auth_codes (
        key VARCHAR(256) PRIMARY KEY,
        code_hash VARCHAR(256) NOT NULL,
        expires_at TIMESTAMPTZ NOT NULL,
        attempts INTEGER NOT NULL DEFAULT 0,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS idx_auth_codes_expires ON auth_codes(expires_at);
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS auth_accounts (
        id VARCHAR(32) PRIMARY KEY,
        method VARCHAR(16) NOT NULL CHECK (method IN ('email', 'phone')),
        identifier VARCHAR(128) UNIQUE NOT NULL,
        display_name VARCHAR(128) NOT NULL,
        role VARCHAR(16) NOT NULL CHECK (role IN ('buyer', 'provider')),
        password_hash VARCHAR(256) NOT NULL,
        trusted_devices TEXT[] NOT NULL DEFAULT '{}',
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS idx_auth_method_identifier ON auth_accounts(method, identifier);
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS admin_accounts (
        id VARCHAR(32) PRIMARY KEY,
        email VARCHAR(128) UNIQUE NOT NULL,
        name VARCHAR(128) NOT NULL,
        role VARCHAR(16) NOT NULL CHECK (role IN ('owner', 'ops', 'support', 'finance', 'auditor')),
        permissions TEXT[] NOT NULL DEFAULT '{}',
        password_hash VARCHAR(256),
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS audit_logs (
        id SERIAL PRIMARY KEY,
        actor VARCHAR(128) NOT NULL,
        action VARCHAR(64) NOT NULL,
        resource VARCHAR(64) NOT NULL,
        details JSONB,
        ip_address INET,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_logs(created_at DESC);
      CREATE INDEX IF NOT EXISTS idx_audit_actor ON audit_logs(actor);
    `);

    console.log("Tables created.");

    // Seed providers
    const providers = JSON.parse(readFileSync(join(rootDir, "data/providers.json"), "utf-8"));
    for (const p of providers) {
      await client.query(
        `INSERT INTO providers (
          slug, name, level, level_label, tags, industry,
          delivery_min, delivery_max, budget_min, budget_max,
          rating, case_count, avatar_url, description, tech_stack,
          can_invoice, featured, sort_order, response_time, services, reviews
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21)
        ON CONFLICT (slug) DO UPDATE SET
          name = EXCLUDED.name,
          level = EXCLUDED.level,
          level_label = EXCLUDED.level_label,
          tags = EXCLUDED.tags,
          industry = EXCLUDED.industry,
          delivery_min = EXCLUDED.delivery_min,
          delivery_max = EXCLUDED.delivery_max,
          budget_min = EXCLUDED.budget_min,
          budget_max = EXCLUDED.budget_max,
          rating = EXCLUDED.rating,
          case_count = EXCLUDED.case_count,
          avatar_url = EXCLUDED.avatar_url,
          description = EXCLUDED.description,
          tech_stack = EXCLUDED.tech_stack,
          can_invoice = EXCLUDED.can_invoice,
          featured = EXCLUDED.featured,
          sort_order = EXCLUDED.sort_order,
          response_time = EXCLUDED.response_time,
          services = EXCLUDED.services,
          reviews = EXCLUDED.reviews,
          updated_at = NOW()`,
        [
          p.slug, p.name, p.level, p.levelLabel, p.tags, p.industry,
          p.deliveryMin, p.deliveryMax, p.budgetMin, p.budgetMax,
          p.rating, p.caseCount, p.avatarUrl, p.description, p.techStack,
          p.canInvoice, p.featured, p.sortOrder, p.responseTime, p.services, p.reviews
        ]
      );
    }
    console.log(`Seeded ${providers.length} providers.`);

    // Seed cases
    const cases = JSON.parse(readFileSync(join(rootDir, "data/cases.json"), "utf-8"));
    for (const c of cases) {
      await client.query(
        `INSERT INTO cases (
          slug, title, provider_slug, provider_name, category, industry,
          background, problem, solution, process, roi_text, budget_text,
          ai_label, featured, sort_order
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)
        ON CONFLICT (slug) DO UPDATE SET
          title = EXCLUDED.title,
          provider_slug = EXCLUDED.provider_slug,
          provider_name = EXCLUDED.provider_name,
          category = EXCLUDED.category,
          industry = EXCLUDED.industry,
          background = EXCLUDED.background,
          problem = EXCLUDED.problem,
          solution = EXCLUDED.solution,
          process = EXCLUDED.process,
          roi_text = EXCLUDED.roi_text,
          budget_text = EXCLUDED.budget_text,
          ai_label = EXCLUDED.ai_label,
          featured = EXCLUDED.featured,
          sort_order = EXCLUDED.sort_order,
          updated_at = NOW()`,
        [
          c.slug, c.title, c.providerSlug, c.providerName, c.category, c.industry,
          c.background, c.problem, c.solution, c.process, c.roiText, c.budgetText,
          c.aiLabel, c.featured, c.sortOrder
        ]
      );
    }
    console.log(`Seeded ${cases.length} cases.`);

    // Seed bootstrap admin
    const { randomBytes, scrypt } = await import("node:crypto");
    const { promisify } = await import("node:util");
    const scryptAsync = promisify(scrypt);
    const salt = randomBytes(16).toString("hex");
    const adminEmail = process.env.ADMIN_BOOTSTRAP_EMAIL || "admin@jiuzhang.local";
    const allowDemoPassword = process.env.LEAD_RELAY_DRY_RUN === "true";
    const configuredAdminPassword = process.env.ADMIN_BOOTSTRAP_PASSWORD || "";
    const adminPassword = configuredAdminPassword && configuredAdminPassword !== "change-admin-password" && !configuredAdminPassword.includes("replace-with")
      ? process.env.ADMIN_BOOTSTRAP_PASSWORD
      : allowDemoPassword
        ? "AdminDemo123!"
        : "";
    const adminName = process.env.ADMIN_BOOTSTRAP_NAME || "九章管理员";
    const adminRole = normalizeAdminRole(process.env.ADMIN_BOOTSTRAP_ROLE || "owner");
    if (!adminPassword || (!allowDemoPassword && (adminPassword === "change-admin-password" || adminPassword.length < 12))) {
      throw new Error("ADMIN_BOOTSTRAP_PASSWORD must be set to a non-default value with at least 12 characters outside dry-run mode");
    }
    const buf = await scryptAsync(adminPassword, salt, 64);
    const passwordHash = `scrypt:${salt}:${Buffer.from(buf).toString("hex")}`;

    await client.query(
      `INSERT INTO admin_accounts (id, email, name, role, permissions, password_hash)
       VALUES ($1,$2,$3,$4,$5,$6)
       ON CONFLICT (email) DO UPDATE SET
         name = EXCLUDED.name,
         role = EXCLUDED.role,
         permissions = EXCLUDED.permissions,
         password_hash = EXCLUDED.password_hash,
         updated_at = NOW()`,
      [
        "admin_bootstrap_01",
        adminEmail,
        adminName,
        adminRole,
        permissionsForRole(adminRole),
        passwordHash
      ]
    );
    console.log("Seeded bootstrap admin account.");

    console.log("Database initialization complete.");
  } finally {
    client.release();
    await pool.end();
  }
}

init().catch((err) => {
  console.error("Init failed:", err.message);
  process.exit(1);
});

function quoteIdentifier(value) {
  if (!/^[A-Za-z0-9_-]+$/.test(value)) {
    throw new Error(`Unsafe SQL identifier: ${value}`);
  }
  return `"${value.replaceAll('"', '""')}"`;
}

function normalizeAdminRole(value) {
  return ["owner", "ops", "support", "finance", "auditor"].includes(value) ? value : "owner";
}

function permissionsForRole(role) {
  const permissions = {
    owner: ["leads:read", "leads:assign", "providers:review", "content:edit", "payments:review", "settings:manage", "audit:read"],
    ops: ["leads:read", "leads:assign", "providers:review", "content:edit", "audit:read"],
    support: ["leads:read", "leads:assign"],
    finance: ["leads:read", "payments:review", "audit:read"],
    auditor: ["leads:read", "audit:read"]
  };
  return permissions[role] || permissions.owner;
}
