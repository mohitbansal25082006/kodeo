-- db/migrations/001_init.sql
-- ────────────────────────────────────────────────────────────
-- KODEO — Part 1b initial schema
--
-- Better Auth normally generates its own tables via its CLI
-- (`npx @better-auth/cli generate`). This file is the raw-SQL
-- equivalent so the schema lives in version control as plain
-- SQL, per the "Neon + PostgreSQL + pg + raw SQL, no ORM"
-- requirement. Run this BEFORE starting the app for the first
-- time. Safe to re-run (uses IF NOT EXISTS everywhere).
--
-- Tables:
--   user               - Better Auth core + KODEO profile fields
--   session            - Better Auth core
--   account             - Better Auth core (OAuth + credentials)
--   verification        - Better Auth core (OTP / email verification tokens)
-- ────────────────────────────────────────────────────────────

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ---------- user ----------
CREATE TABLE IF NOT EXISTS "user" (
  id              TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  name            TEXT NOT NULL DEFAULT '',
  email           TEXT NOT NULL UNIQUE,
  "emailVerified" BOOLEAN NOT NULL DEFAULT false,
  image           TEXT,
  "createdAt"     TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt"     TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- KODEO-specific profile fields (Part 1 spec: username, developer role,
  -- one-time onboarding flag). Kept on the same table since Part 1 is
  -- intentionally not introducing a separate profile table yet.
  username        TEXT UNIQUE,
  "developerRole" TEXT,
  "onboardingCompletedAt" TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS user_email_idx ON "user" (email);
CREATE INDEX IF NOT EXISTS user_username_idx ON "user" (username);

-- ---------- session ----------
CREATE TABLE IF NOT EXISTS "session" (
  id             TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "expiresAt"    TIMESTAMPTZ NOT NULL,
  token          TEXT NOT NULL UNIQUE,
  "createdAt"    TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt"    TIMESTAMPTZ NOT NULL DEFAULT now(),
  "ipAddress"    TEXT,
  "userAgent"    TEXT,
  "userId"       TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS session_user_id_idx ON "session" ("userId");
CREATE INDEX IF NOT EXISTS session_token_idx ON "session" (token);

-- ---------- account ----------
-- Stores both OAuth-linked accounts (Google, GitHub) and the
-- credential account (hashed password) for email/password sign-in.
CREATE TABLE IF NOT EXISTS "account" (
  id                       TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "accountId"              TEXT NOT NULL,
  "providerId"             TEXT NOT NULL,
  "userId"                 TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  "accessToken"            TEXT,
  "refreshToken"           TEXT,
  "idToken"                TEXT,
  "accessTokenExpiresAt"   TIMESTAMPTZ,
  "refreshTokenExpiresAt"  TIMESTAMPTZ,
  scope                    TEXT,
  password                 TEXT,
  "createdAt"              TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt"              TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE ("providerId", "accountId")
);

CREATE INDEX IF NOT EXISTS account_user_id_idx ON "account" ("userId");

-- ---------- verification ----------
-- Stores OTP codes / verification tokens for:
--   email-verification, sign-in (passwordless), forget-password
CREATE TABLE IF NOT EXISTS "verification" (
  id          TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  identifier  TEXT NOT NULL,
  value       TEXT NOT NULL,
  "expiresAt" TIMESTAMPTZ NOT NULL,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS verification_identifier_idx ON "verification" (identifier);