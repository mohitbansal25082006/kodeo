// src/lib/workspace/queries.ts
import { pool, isUniqueViolation } from "@/lib/db";
import { slugify, slugCandidates, isValidSlug } from "@/lib/workspace/slug";
import type {
  Workspace,
  WorkspaceMember,
  WorkspaceRole,
  WorkspaceWithRole,
} from "@/lib/workspace/types";

export class SlugExhaustedError extends Error {
  constructor() {
    super("Could not generate a unique slug for this workspace name.");
    this.name = "SlugExhaustedError";
  }
}

export class LastOwnerError extends Error {
  constructor(message = "A workspace must always have at least one owner.") {
    super(message);
    this.name = "LastOwnerError";
  }
}

// ────────────────────────────────────────────────────────────
// Part 2a — create, list, switch
// ────────────────────────────────────────────────────────────

interface CreateWorkspaceInput {
  name: string;
  description?: string | null;
  icon?: string | null;
  ownerId: string;
  slug?: string;
}

/**
 * Create a workspace and its owner membership row atomically.
 * See the Part 2a writeup for why this needs a real transaction
 * rather than two separate pool.query calls, and why slug collisions
 * are resolved by retrying against the DB's unique index rather than
 * a pre-check SELECT.
 */
export async function createWorkspace(input: CreateWorkspaceInput): Promise<Workspace> {
  const baseSlug = input.slug && isValidSlug(input.slug) ? input.slug : slugify(input.name);
  const client = await pool.connect();

  try {
    for (const candidate of slugCandidates(baseSlug)) {
      try {
        await client.query("BEGIN");

        const { rows } = await client.query<Workspace>(
          `INSERT INTO "workspace" (name, slug, description, icon, "ownerId")
           VALUES ($1, $2, $3, $4, $5)
           RETURNING id, name, slug, description, icon, "ownerId", "createdAt", "updatedAt"`,
          [input.name, candidate, input.description ?? null, input.icon ?? null, input.ownerId]
        );
        const workspace = rows[0];

        await client.query(
          `INSERT INTO "workspace_member" ("workspaceId", "userId", role)
           VALUES ($1, $2, 'owner')`,
          [workspace.id, input.ownerId]
        );

        await client.query(
          `UPDATE "user" SET "activeWorkspaceId" = $1, "updatedAt" = now() WHERE id = $2`,
          [workspace.id, input.ownerId]
        );

        await client.query("COMMIT");
        return workspace;
      } catch (err) {
        await client.query("ROLLBACK");
        if (isUniqueViolation(err)) continue;
        throw err;
      }
    }

    throw new SlugExhaustedError();
  } finally {
    client.release();
  }
}

export async function listWorkspacesForUser(userId: string): Promise<WorkspaceWithRole[]> {
  const { rows } = await pool.query<WorkspaceWithRole>(
    `SELECT
       w.id, w.name, w.slug, w.description, w.icon,
       w."ownerId", w."createdAt", w."updatedAt",
       wm.role,
       (SELECT COUNT(*)::int FROM "workspace_member" wm2 WHERE wm2."workspaceId" = w.id) AS "memberCount"
     FROM "workspace" w
     INNER JOIN "workspace_member" wm ON wm."workspaceId" = w.id
     WHERE wm."userId" = $1
     ORDER BY w."createdAt" DESC`,
    [userId]
  );
  return rows;
}

/**
 * A single workspace plus the requesting user's role in it — returns
 * null if the workspace doesn't exist OR the user isn't a member,
 * deliberately not distinguishing the two so route handlers always
 * respond 404, never leaking whether an ID/slug exists to a non-member.
 */
export async function getWorkspaceForUser(
  workspaceId: string,
  userId: string
): Promise<WorkspaceWithRole | null> {
  const { rows } = await pool.query<WorkspaceWithRole>(
    `SELECT
       w.id, w.name, w.slug, w.description, w.icon,
       w."ownerId", w."createdAt", w."updatedAt",
       wm.role,
       (SELECT COUNT(*)::int FROM "workspace_member" wm2 WHERE wm2."workspaceId" = w.id) AS "memberCount"
     FROM "workspace" w
     INNER JOIN "workspace_member" wm ON wm."workspaceId" = w.id
     WHERE w.id = $1 AND wm."userId" = $2
     LIMIT 1`,
    [workspaceId, userId]
  );
  return rows[0] ?? null;
}

/**
 * Same lookup as getWorkspaceForUser but by slug — powers every
 * /w/[slug]/* page added in Part 2b. Slugs are stored lowercase-unique
 * (see the functional index in 004_workspaces.sql) so this lowercases
 * the input before comparing, same as the username lookup pattern.
 */
export async function getWorkspaceBySlugForUser(
  slug: string,
  userId: string
): Promise<WorkspaceWithRole | null> {
  const { rows } = await pool.query<WorkspaceWithRole>(
    `SELECT
       w.id, w.name, w.slug, w.description, w.icon,
       w."ownerId", w."createdAt", w."updatedAt",
       wm.role,
       (SELECT COUNT(*)::int FROM "workspace_member" wm2 WHERE wm2."workspaceId" = w.id) AS "memberCount"
     FROM "workspace" w
     INNER JOIN "workspace_member" wm ON wm."workspaceId" = w.id
     WHERE lower(w.slug) = lower($1) AND wm."userId" = $2
     LIMIT 1`,
    [slug, userId]
  );
  return rows[0] ?? null;
}

export async function setActiveWorkspace(
  userId: string,
  workspaceId: string | null
): Promise<boolean> {
  if (workspaceId !== null) {
    const membership = await getWorkspaceForUser(workspaceId, userId);
    if (!membership) return false;
  }

  await pool.query(
    `UPDATE "user" SET "activeWorkspaceId" = $1, "updatedAt" = now() WHERE id = $2`,
    [workspaceId, userId]
  );
  return true;
}

export async function getActiveWorkspace(userId: string): Promise<WorkspaceWithRole | null> {
  const { rows } = await pool.query<{ activeWorkspaceId: string | null }>(
    `SELECT "activeWorkspaceId" FROM "user" WHERE id = $1`,
    [userId]
  );
  const activeId = rows[0]?.activeWorkspaceId;
  if (!activeId) return null;
  return getWorkspaceForUser(activeId, userId);
}

export async function getMemberRole(
  workspaceId: string,
  userId: string
): Promise<WorkspaceRole | null> {
  const { rows } = await pool.query<{ role: WorkspaceRole }>(
    `SELECT role FROM "workspace_member" WHERE "workspaceId" = $1 AND "userId" = $2 LIMIT 1`,
    [workspaceId, userId]
  );
  return rows[0]?.role ?? null;
}

// ────────────────────────────────────────────────────────────
// Part 2b — settings, members, roles, ownership transfer
// ────────────────────────────────────────────────────────────

interface UpdateWorkspaceInput {
  name?: string;
  description?: string | null;
  icon?: string | null;
  /** Explicit slug change — validated and uniqueness-checked like create. */
  slug?: string;
}

/**
 * Update a workspace's editable fields. Unlike createWorkspace, a
 * slug change here does NOT auto-append "-2" on collision — silently
 * rewriting a URL a team may have already bookmarked/shared would be
 * more surprising than useful, so a taken slug is a hard 409 the
 * caller must resolve by picking a different one.
 */
export async function updateWorkspace(
  workspaceId: string,
  input: UpdateWorkspaceInput
): Promise<Workspace> {
  const sets: string[] = [];
  const values: unknown[] = [];
  let i = 1;

  if (input.name !== undefined) {
    sets.push(`name = $${i++}`);
    values.push(input.name);
  }
  if (input.description !== undefined) {
    sets.push(`description = $${i++}`);
    values.push(input.description);
  }
  if (input.icon !== undefined) {
    sets.push(`icon = $${i++}`);
    values.push(input.icon);
  }
  if (input.slug !== undefined) {
    sets.push(`slug = $${i++}`);
    values.push(input.slug);
  }

  sets.push(`"updatedAt" = now()`);
  values.push(workspaceId);

  const { rows } = await pool.query<Workspace>(
    `UPDATE "workspace" SET ${sets.join(", ")} WHERE id = $${i}
     RETURNING id, name, slug, description, icon, "ownerId", "createdAt", "updatedAt"`,
    values
  );
  return rows[0];
}

/**
 * Permanently delete a workspace. Relies entirely on the ON DELETE
 * CASCADE foreign keys already in place (workspace_member →
 * workspace, and the future project table in Part 2c) — no manual
 * cleanup query needed here, same pattern as account deletion in
 * Part 1c. Caller (the API route) is responsible for the
 * canDeleteWorkspace permission check before calling this.
 */
export async function deleteWorkspace(workspaceId: string): Promise<void> {
  await pool.query(`DELETE FROM "workspace" WHERE id = $1`, [workspaceId]);
}

/**
 * All members of a workspace, joined with their user profile info,
 * ordered by role (owner first) then join date. Powers the members
 * table in /w/[slug]/members.
 */
export async function listMembers(workspaceId: string): Promise<WorkspaceMember[]> {
  const { rows } = await pool.query<{
    id: string;
    workspaceId: string;
    userId: string;
    role: WorkspaceRole;
    createdAt: string;
    name: string;
    email: string;
    image: string | null;
    username: string | null;
  }>(
    `SELECT
       wm.id, wm."workspaceId", wm."userId", wm.role, wm."createdAt",
       u.name, u.email, u.image, u.username
     FROM "workspace_member" wm
     INNER JOIN "user" u ON u.id = wm."userId"
     WHERE wm."workspaceId" = $1
     ORDER BY
       CASE wm.role
         WHEN 'owner' THEN 0
         WHEN 'admin' THEN 1
         WHEN 'editor' THEN 2
         ELSE 3
       END,
       wm."createdAt" ASC`,
    [workspaceId]
  );

  return rows.map((r) => ({
    id: r.id,
    workspaceId: r.workspaceId,
    userId: r.userId,
    role: r.role,
    createdAt: r.createdAt,
    user: { name: r.name, email: r.email, image: r.image, username: r.username },
  }));
}

/** How many owner-role members a workspace currently has. Used to guard the last-owner rule. */
export async function countOwners(workspaceId: string): Promise<number> {
  const { rows } = await pool.query<{ count: string }>(
    `SELECT COUNT(*) FROM "workspace_member" WHERE "workspaceId" = $1 AND role = 'owner'`,
    [workspaceId]
  );
  return parseInt(rows[0].count, 10);
}

/**
 * A single member row scoped to a workspace, by member id — used to
 * load the target member's current role before authorizing a role
 * change or removal, so the API route can call
 * canChangeMemberRole/canRemoveMember with real data instead of
 * trusting whatever role the client claims the target currently has.
 */
export async function getMemberById(
  workspaceId: string,
  memberId: string
): Promise<{ userId: string; role: WorkspaceRole } | null> {
  const { rows } = await pool.query<{ userId: string; role: WorkspaceRole }>(
    `SELECT "userId", role FROM "workspace_member" WHERE id = $1 AND "workspaceId" = $2 LIMIT 1`,
    [memberId, workspaceId]
  );
  return rows[0] ?? null;
}

/**
 * Change a member's role. Refuses to demote the sole owner (would
 * leave the workspace ownerless) — callers should use
 * transferOwnership instead when moving ownership, which atomically
 * swaps roles rather than just demoting one side.
 */
export async function updateMemberRole(
  workspaceId: string,
  memberId: string,
  newRole: WorkspaceRole
): Promise<void> {
  const target = await getMemberById(workspaceId, memberId);
  if (!target) throw new Error("Member not found.");

  if (target.role === "owner" && newRole !== "owner") {
    const owners = await countOwners(workspaceId);
    if (owners <= 1) {
      throw new LastOwnerError("Transfer ownership to someone else before changing your own role.");
    }
  }

  await pool.query(
    `UPDATE "workspace_member" SET role = $1, "updatedAt" = now() WHERE id = $2 AND "workspaceId" = $3`,
    [newRole, memberId, workspaceId]
  );
}

/**
 * Remove a member from a workspace. Refuses to remove the sole owner
 * for the same reason updateMemberRole does — a workspace can never
 * be left with zero owners through this path.
 */
export async function removeMember(workspaceId: string, memberId: string): Promise<void> {
  const target = await getMemberById(workspaceId, memberId);
  if (!target) throw new Error("Member not found.");

  if (target.role === "owner") {
    const owners = await countOwners(workspaceId);
    if (owners <= 1) {
      throw new LastOwnerError("Transfer ownership before removing the last owner.");
    }
  }

  await pool.query(`DELETE FROM "workspace_member" WHERE id = $1 AND "workspaceId" = $2`, [
    memberId,
    workspaceId,
  ]);
}

/**
 * Transfer ownership from the current owner to another member,
 * atomically: the current owner becomes 'admin' (not demoted further
 * — they keep management rights over the workspace they built) and
 * the target becomes 'owner'. Also updates workspace."ownerId" for
 * consistency, since that column exists for quick "who created this"
 * display purposes even though workspace_member.role is the real
 * source of truth for permissions.
 *
 * Wrapped in a transaction for the same reason createWorkspace is:
 * a state where two members are simultaneously 'owner', or where
 * neither is, must never be observable even under concurrent requests.
 */
export async function transferOwnership(
  workspaceId: string,
  currentOwnerUserId: string,
  newOwnerMemberId: string
): Promise<void> {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const { rows: targetRows } = await client.query<{ userId: string; role: WorkspaceRole }>(
      `SELECT "userId", role FROM "workspace_member" WHERE id = $1 AND "workspaceId" = $2 LIMIT 1`,
      [newOwnerMemberId, workspaceId]
    );
    const target = targetRows[0];
    if (!target) {
      throw new Error("Target member not found.");
    }
    if (target.userId === currentOwnerUserId) {
      throw new Error("You're already the owner.");
    }

    await client.query(
      `UPDATE "workspace_member" SET role = 'admin', "updatedAt" = now()
       WHERE "workspaceId" = $1 AND "userId" = $2`,
      [workspaceId, currentOwnerUserId]
    );
    await client.query(
      `UPDATE "workspace_member" SET role = 'owner', "updatedAt" = now()
       WHERE id = $1 AND "workspaceId" = $2`,
      [newOwnerMemberId, workspaceId]
    );
    await client.query(
      `UPDATE "workspace" SET "ownerId" = $1, "updatedAt" = now() WHERE id = $2`,
      [target.userId, workspaceId]
    );

    await client.query("COMMIT");
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

/**
 * A member removing themselves from a workspace. Thin wrapper over
 * removeMember, looked up by userId instead of memberId since "leave"
 * is initiated by the member about themself, not by an admin acting
 * on someone else's member row.
 */
export async function leaveWorkspace(workspaceId: string, userId: string): Promise<void> {
  const { rows } = await pool.query<{ id: string; role: WorkspaceRole }>(
    `SELECT id, role FROM "workspace_member" WHERE "workspaceId" = $1 AND "userId" = $2 LIMIT 1`,
    [workspaceId, userId]
  );
  const member = rows[0];
  if (!member) throw new Error("You're not a member of this workspace.");

  if (member.role === "owner") {
    throw new LastOwnerError("Transfer ownership before leaving this workspace.");
  }

  await pool.query(`DELETE FROM "workspace_member" WHERE id = $1`, [member.id]);

  // If the workspace they just left was their active one, clear it so
  // the dashboard falls back to the picker instead of a 404 lookup.
  await pool.query(
    `UPDATE "user" SET "activeWorkspaceId" = NULL, "updatedAt" = now()
     WHERE id = $1 AND "activeWorkspaceId" = $2`,
    [userId, workspaceId]
  );
}
