-- db/migrations/006_project_nodes.sql
-- ────────────────────────────────────────────────────────────
-- KODEO — Part 3a: in-browser file system (files + folders)
--
-- Completes the Workspace → Project → File System → Monaco
-- architecture from the Part 3 spec. A single self-referencing table
-- ("adjacency list") models both files and folders — this is the
-- standard, right-sized model for a dynamic, user-editable tree
-- (folders created/renamed/moved constantly) vs. ltree/materialized
-- paths, which suit read-heavy trees that rarely mutate and carry a
-- GiST index size ceiling that's a bad fit for deeply-nested user
-- projects. Ancestor/descendant queries use WITH RECURSIVE CTEs
-- (native to Postgres since 8.4, no extension required).
--
-- Safe to re-run (IF NOT EXISTS everywhere).
-- ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "project_node" (
  id            TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "projectId"   TEXT NOT NULL REFERENCES "project"(id) ON DELETE CASCADE,
  -- NULL parentId = lives at the project root. ON DELETE CASCADE means
  -- deleting a folder deletes its entire subtree in one statement —
  -- no manual recursive cleanup needed, Postgres walks the FK graph.
  "parentId"    TEXT REFERENCES "project_node"(id) ON DELETE CASCADE,
  type          TEXT NOT NULL CHECK (type IN ('file', 'folder')),
  name          TEXT NOT NULL CHECK (length(trim(name)) > 0 AND length(name) <= 255),
  -- File contents live directly on the row. KODEO's editor targets
  -- source files (text), not binary assets, so a TEXT column avoids
  -- the complexity of object storage for Part 3 — large binary/asset
  -- upload support, if ever needed, would be a separate table and a
  -- separate part, not a retrofit of this one. Always NULL for folders.
  content       TEXT NOT NULL DEFAULT '',
  -- Cached byte length of `content`, maintained by the trigger below.
  -- Lets the file tree and status bar show sizes without re-reading
  -- (and re-measuring) every file's content on every tree fetch.
  size          INTEGER NOT NULL DEFAULT 0,
  -- Cached materialized path ("src/lib/utils.ts"), maintained by the
  -- trigger below on insert/rename/move. This is deliberately a cache
  -- on top of the adjacency list, not a replacement for it — parentId
  -- stays the source of truth for the tree (cheap moves, CASCADE
  -- deletes), while `path` exists purely so breadcrumbs, tab titles,
  -- and search results don't each need their own recursive ancestor
  -- walk just to render a string.
  path          TEXT NOT NULL DEFAULT '',
  "createdById" TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  "createdAt"   TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt"   TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- A folder cannot contain file-only fields with content; a file's
  -- content must be text (possibly empty), never NULL. Cheap sanity
  -- constraint since the app layer is the real enforcer of type-shape.
  CONSTRAINT project_node_folder_no_content
    CHECK (type = 'file' OR content = '')
);

-- Sibling names must be unique (case-insensitive) within the same
-- parent, matching every real filesystem's behavior. Two partial
-- indexes because Postgres treats NULL as distinct from NULL in a
-- plain unique index (root-level siblings would never collide
-- without this split) — COALESCE-ing parentId to a sentinel would
-- work too, but two clean partial indexes are easier to reason about
-- and to EXPLAIN.
CREATE UNIQUE INDEX IF NOT EXISTS project_node_sibling_name_unique_idx
  ON "project_node" ("projectId", "parentId", lower(name))
  WHERE "parentId" IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS project_node_root_sibling_name_unique_idx
  ON "project_node" ("projectId", lower(name))
  WHERE "parentId" IS NULL;

CREATE INDEX IF NOT EXISTS project_node_project_id_idx ON "project_node" ("projectId");
CREATE INDEX IF NOT EXISTS project_node_parent_id_idx ON "project_node" ("parentId");
CREATE INDEX IF NOT EXISTS project_node_created_by_id_idx ON "project_node" ("createdById");
-- Powers "find file by name" search across a project without a
-- sequential scan; lower() to match the case-insensitive search UX.
CREATE INDEX IF NOT EXISTS project_node_name_lower_idx ON "project_node" (lower(name));

-- ────────────────────────────────────────────────────────────
-- path + size maintenance trigger
--
-- Keeping `path` correct under rename/move is the one place this
-- schema needs real logic beyond a plain column default: renaming a
-- folder must cascade the new path prefix to every descendant, not
-- just the renamed row itself. Doing this in a trigger (rather than
-- in application code) guarantees it can never drift out of sync
-- regardless of which query path touched the row — including future
-- code this part's author hasn't written yet.
-- ────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION project_node_maintain_path() RETURNS TRIGGER AS $$
DECLARE
  parent_path TEXT;
  old_path TEXT;
BEGIN
  -- Compute this row's own path from its parent's cached path (or ''
  -- for a root node) plus its own name.
  IF NEW."parentId" IS NULL THEN
    NEW.path := NEW.name;
  ELSE
    SELECT path INTO parent_path FROM "project_node" WHERE id = NEW."parentId";
    NEW.path := parent_path || '/' || NEW.name;
  END IF;

  -- Keep size in sync with content length (bytes, not characters —
  -- matches how a status bar / disk-usage figure is normally read).
  NEW.size := octet_length(NEW.content);
  NEW."updatedAt" := now();

  -- On UPDATE, if the path actually changed (rename or re-parent),
  -- cascade the new prefix onto every existing descendant in one
  -- statement using a recursive CTE, then overwrite their path column
  -- directly (bypassing this trigger for the descendants, since we're
  -- computing their full new paths here rather than recursing trigger
  -- invocations row-by-row).
  IF TG_OP = 'UPDATE' THEN
    SELECT path INTO old_path FROM "project_node" WHERE id = NEW.id;
    IF old_path IS DISTINCT FROM NEW.path THEN
      WITH RECURSIVE descendants AS (
        SELECT id, "parentId", (NEW.path || substring(path FROM length(old_path) + 1)) AS new_path
        FROM "project_node"
        WHERE "parentId" = NEW.id
        UNION ALL
        SELECT c.id, c."parentId", (d.new_path || '/' || c.name)
        FROM "project_node" c
        INNER JOIN descendants d ON c."parentId" = d.id
      )
      UPDATE "project_node" pn
      SET path = descendants.new_path, "updatedAt" = now()
      FROM descendants
      WHERE pn.id = descendants.id;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS project_node_maintain_path_trigger ON "project_node";
CREATE TRIGGER project_node_maintain_path_trigger
  BEFORE INSERT OR UPDATE ON "project_node"
  FOR EACH ROW
  EXECUTE FUNCTION project_node_maintain_path();

-- ────────────────────────────────────────────────────────────
-- cycle prevention
--
-- The adjacency list's classic footgun: nothing stops a folder from
-- being re-parented into its own descendant, which would create a
-- cycle and turn every recursive CTE above into an infinite loop.
-- Checked at the DB layer (not just application code) since this is
-- a correctness invariant, not a UX nicety — the application's move
-- endpoint also pre-checks this for a clean error message, but this
-- trigger is the backstop that makes a cycle structurally impossible
-- regardless of which code path performs the write.
-- ────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION project_node_prevent_cycle() RETURNS TRIGGER AS $$
DECLARE
  is_descendant BOOLEAN;
BEGIN
  IF NEW."parentId" IS NULL OR TG_OP = 'INSERT' THEN
    RETURN NEW;
  END IF;

  IF NEW."parentId" = NEW.id THEN
    RAISE EXCEPTION 'A folder cannot be moved into itself.' USING ERRCODE = 'P0001';
  END IF;

  WITH RECURSIVE subtree AS (
    SELECT id FROM "project_node" WHERE id = NEW.id
    UNION ALL
    SELECT c.id FROM "project_node" c INNER JOIN subtree s ON c."parentId" = s.id
  )
  SELECT EXISTS (SELECT 1 FROM subtree WHERE id = NEW."parentId") INTO is_descendant;

  IF is_descendant THEN
    RAISE EXCEPTION 'A folder cannot be moved into one of its own subfolders.' USING ERRCODE = 'P0001';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS project_node_prevent_cycle_trigger ON "project_node";
CREATE TRIGGER project_node_prevent_cycle_trigger
  BEFORE UPDATE OF "parentId" ON "project_node"
  FOR EACH ROW
  EXECUTE FUNCTION project_node_prevent_cycle();

-- ────────────────────────────────────────────────────────────
-- editor preferences (Part 3c will add fields here via a later
-- migration if scope grows, but the column lands now on `user` so
-- Part 3a/3b's auto-save + tab restoration can already persist which
-- files were open, without a second migration touching the same
-- table twice in one Part).
-- ────────────────────────────────────────────────────────────

ALTER TABLE "user"
  ADD COLUMN IF NOT EXISTS "editorPrefs" JSONB NOT NULL DEFAULT '{}'::jsonb;
