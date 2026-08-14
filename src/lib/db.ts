// src/lib/db.ts
import { Pool } from "pg";

/**
 * Single shared Postgres connection pool, backed by Neon.
 * Used directly by Better Auth (see src/lib/auth.ts) and by any
 * app-level raw SQL queries outside of what Better Auth owns
 * (e.g. onboarding fields, profile extensions in later parts).
 *
 * Neon serverless Postgres works fine with a standard `pg` Pool
 * as long as `sslmode=require` is present in the connection string
 * (already the case in .env.example).
 */
declare global {
  var _kodeoPool: Pool | undefined;
}

function createPool() {
  if (!process.env.DATABASE_URL) {
    throw new Error(
      "DATABASE_URL is not set. Copy .env.example to .env.local and add your Neon connection string."
    );
  }

  return new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 10,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 10_000,
  });
}

// Reuse the pool across hot reloads in dev so we don't exhaust
// Neon's connection limit every time a file changes.
export const pool = globalThis._kodeoPool ?? createPool();

if (process.env.NODE_ENV !== "production") {
  globalThis._kodeoPool = pool;
}

/**
 * Thin helper for raw SQL queries with typed rows.
 * Prefer this over touching `pool` directly in app code.
 */
export async function query<T extends Record<string, unknown> = Record<string, unknown>>(
  text: string,
  params?: unknown[]
): Promise<T[]> {
  const result = await pool.query(text, params);
  return result.rows as T[];
}

/**
 * True if the given error is a Postgres unique_violation (code 23505),
 * i.e. an INSERT/UPDATE was rejected by a UNIQUE constraint or unique
 * index. Use this to turn a database-level constraint failure into a
 * clean user-facing error instead of a generic 500 — this is the
 * authoritative guard against race conditions that an application-level
 * "check if it exists, then write" pattern cannot fully close on its
 * own (two concurrent requests can both pass the check before either
 * commits; only the database can atomically guarantee uniqueness).
 */
export function isUniqueViolation(err: unknown): boolean {
  return (
    typeof err === "object" &&
    err !== null &&
    "code" in err &&
    (err as { code?: string }).code === "23505"
  );
}