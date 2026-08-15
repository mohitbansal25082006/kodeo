-- db/migrations/005_invitations_and_projects.sql
-- ────────────────────────────────────────────────────────────
-- KODEO — Part 2c: invitations + projects
--
-- Completes the User → Workspace → Project hierarchy from the Part 2
-- spec, and adds email-based invitations so workspaces can grow
-- beyond their creator. Safe to re-run (IF NOT EXISTS everywhere).
-- ────────────────────────────────────────────────────────────

-- ---------- workspace_invitation ----------
CREATE TABLE IF NOT EXISTS "workspace_invitation" (
  id            TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "workspaceId" TEXT NOT NULL REFERENCES "workspace"(id) ON DELETE CASCADE,
  email         TEXT NOT NULL,
  role          TEXT NOT NULL DEFAULT 'viewer'
                  CHECK (role IN ('admin', 'editor', 'viewer')),
  -- Ownership is never transferred via invitation — only via the
  -- existing transferOwnership flow (Part 2b) between two people who
  -- are already members. An invited person always lands as admin/
  -- editor/viewer, hence 'owner' is deliberately excluded from this
  -- CHECK constraint even though it's a valid workspace_member role.
  token         TEXT NOT NULL UNIQUE,
  status        TEXT NOT NULL DEFAULT 'pending'
                  CHECK (status IN ('pending', 'accepted', 'declined', 'revoked')),
  "invitedById" TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  "expiresAt"   TIMESTAMPTZ NOT NULL,
  "createdAt"   TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt"   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- A given email can have at most one PENDING invitation per
-- workspace at a time (re-inviting after decline/revoke/expiry is
-- fine and creates a new row) — enforced with a partial unique index
-- rather than a plain UNIQUE constraint, since a plain constraint
-- would also block ever re-inviting someone who previously declined.
CREATE UNIQUE INDEX IF NOT EXISTS workspace_invitation_pending_unique_idx
  ON "workspace_invitation" ("workspaceId", lower(email))
  WHERE status = 'pending';

CREATE INDEX IF NOT EXISTS workspace_invitation_workspace_id_idx
  ON "workspace_invitation" ("workspaceId");
CREATE INDEX IF NOT EXISTS workspace_invitation_token_idx
  ON "workspace_invitation" (token);
CREATE INDEX IF NOT EXISTS workspace_invitation_email_idx
  ON "workspace_invitation" (lower(email));

-- ---------- project ----------
CREATE TABLE IF NOT EXISTS "project" (
  id            TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "workspaceId" TEXT NOT NULL REFERENCES "workspace"(id) ON DELETE CASCADE,
  name          TEXT NOT NULL,
  slug          TEXT NOT NULL,
  description   TEXT,
  -- Multiavatar-style seed, same non-URL convention as user avatars
  -- and workspace icons (see src/lib/avatar.ts, workspace-icon.tsx).
  icon          TEXT,
  status        TEXT NOT NULL DEFAULT 'active'
                  CHECK (status IN ('active', 'archived')),
  "createdById" TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  "createdAt"   TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt"   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Slugs only need to be unique WITHIN a workspace (unlike workspace
-- slugs, which are globally unique for the /w/[slug] route) since
-- project URLs are always scoped under their parent workspace:
-- /w/[workspaceSlug]/[projectSlug].
CREATE UNIQUE INDEX IF NOT EXISTS project_workspace_slug_lower_unique_idx
  ON "project" ("workspaceId", lower(slug));

CREATE INDEX IF NOT EXISTS project_workspace_id_idx ON "project" ("workspaceId");
CREATE INDEX IF NOT EXISTS project_created_by_id_idx ON "project" ("createdById");
