-- db/migrations/004_workspaces.sql
-- ────────────────────────────────────────────────────────────
-- KODEO — Part 2a: workspace system (core schema)
--
-- Introduces the User → Workspace → Project hierarchy. This file
-- covers only what Part 2a needs: workspaces themselves and workspace
-- membership/roles, which is enough to create a workspace, list the
-- workspaces a user belongs to, and switch the active one.
--
-- Invitations and projects are deliberately NOT created here — they
-- belong to Part 2b (members/roles/settings) and Part 2c
-- (invitations/projects) respectively, each in their own migration
-- file, per the "plain .sql files in db/migrations/, applied in
-- order" convention (see progress.md's architecture reference).
--
-- Safe to re-run (IF NOT EXISTS everywhere).
-- ────────────────────────────────────────────────────────────

-- ---------- workspace_role ----------
-- Four fixed roles per the Part 2 spec: Owner, Admin, Editor, Viewer.
-- Modeled as a CHECK constraint rather than a Postgres ENUM type —
-- ENUMs are painful to extend later (ALTER TYPE ... ADD VALUE cannot
-- run inside a transaction block in older PG, and can't be removed at
-- all) whereas a CHECK constraint can be dropped/redefined trivially
-- in a future migration if a 5th role is ever needed.
CREATE TABLE IF NOT EXISTS "workspace" (
  id          TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  name        TEXT NOT NULL,
  slug        TEXT NOT NULL,
  description TEXT,
  -- Multiavatar-style generated identicon seed, same pattern as user
  -- avatars (src/lib/avatar.ts) — NOT a URL. Falls back to initials
  -- client-side if null. Kept as its own column (not reusing `image`)
  -- since a workspace icon has no OAuth-photo equivalent to disambiguate.
  icon        TEXT,
  "ownerId"   TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Slugs are globally unique (used in future URL routing like
-- /w/[slug]) and case-insensitive for the same race-condition reasons
-- documented in 003_username_unique_ci.sql.
CREATE UNIQUE INDEX IF NOT EXISTS workspace_slug_lower_unique_idx
  ON "workspace" (lower(slug));

CREATE INDEX IF NOT EXISTS workspace_owner_id_idx ON "workspace" ("ownerId");

-- ---------- workspace_member ----------
CREATE TABLE IF NOT EXISTS "workspace_member" (
  id            TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "workspaceId" TEXT NOT NULL REFERENCES "workspace"(id) ON DELETE CASCADE,
  "userId"      TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  role          TEXT NOT NULL DEFAULT 'viewer'
                  CHECK (role IN ('owner', 'admin', 'editor', 'viewer')),
  "createdAt"   TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt"   TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- A user can only have one membership row per workspace.
  UNIQUE ("workspaceId", "userId")
);

CREATE INDEX IF NOT EXISTS workspace_member_workspace_id_idx
  ON "workspace_member" ("workspaceId");
CREATE INDEX IF NOT EXISTS workspace_member_user_id_idx
  ON "workspace_member" ("userId");

-- Exactly one 'owner' role per workspace is enforced at the
-- application layer (see src/lib/workspace/queries.ts —
-- createWorkspace runs both inserts in a single transaction), not via
-- a DB constraint, since Postgres has no direct way to express
-- "exactly one row per group matches this predicate" declaratively
-- without a much heavier partial-unique-index-plus-trigger setup that
-- isn't warranted for Part 2a. Part 2b's ownership-transfer endpoint
-- will re-use the same transactional pattern.

-- ---------- user.active workspace ----------
-- Tracks which workspace a user last switched to, so reloading the
-- dashboard (or signing in on a new device) lands them back where
-- they left off instead of always defaulting to "first workspace
-- alphabetically". Mirrors Better Auth's organization plugin concept
-- of an "active organization" persisted on the session/user.
-- ON DELETE SET NULL: deleting the active workspace should not be
-- blocked by this reference, and the app falls back to "no active
-- workspace" (→ redirect to /dashboard workspace picker) cleanly.
ALTER TABLE "user"
  ADD COLUMN IF NOT EXISTS "activeWorkspaceId" TEXT
  REFERENCES "workspace"(id) ON DELETE SET NULL;
