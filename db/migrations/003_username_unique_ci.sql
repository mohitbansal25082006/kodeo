-- db/migrations/003_username_unique_ci.sql
-- ────────────────────────────────────────────────────────────
-- KODEO — case-insensitive username uniqueness
--
-- The existing `username TEXT UNIQUE` constraint (001_init.sql) is
-- case-SENSITIVE at the database level — Postgres would happily allow
-- both "JohnDoe" and "johndoe" as separate rows, even though the
-- application treats usernames as case-insensitive everywhere else
-- (login-by-username, profile lookup, the app-level SELECT-before-
-- UPDATE uniqueness check in /api/onboarding and /api/profile).
--
-- That app-level check alone has a real race condition: if two
-- requests for the same username (in different casing, or even
-- identical casing) land at the database at almost the same instant,
-- both can pass the SELECT check before either one's UPDATE commits,
-- and the case-sensitive UNIQUE constraint won't catch a case
-- mismatch between them.
--
-- A case-insensitive unique index closes this gap at the only layer
-- that can actually guarantee it: the database itself, atomically,
-- under concurrent writes. This is the standard, correct way to
-- enforce "unique, ignoring case" in Postgres. Safe to re-run.
-- ────────────────────────────────────────────────────────────

-- Drop the old case-sensitive UNIQUE constraint's backing index if it
-- exists under its default auto-generated name, so we don't end up
-- enforcing uniqueness twice (once case-sensitive, once not) — the
-- case-insensitive index below is a strict superset of what it did.
ALTER TABLE "user" DROP CONSTRAINT IF EXISTS "user_username_key";

-- The plain btree index from 001_init.sql is now redundant with the
-- functional index below (which also serves lookups on lower(username)
-- efficiently); drop it to avoid maintaining two indexes for the same
-- column.
DROP INDEX IF EXISTS user_username_idx;

CREATE UNIQUE INDEX IF NOT EXISTS user_username_lower_unique_idx
  ON "user" (lower(username))
  WHERE username IS NOT NULL;