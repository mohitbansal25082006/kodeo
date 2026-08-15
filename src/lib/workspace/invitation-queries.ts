// src/lib/workspace/invitation-queries.ts
import crypto from "crypto";
import { pool, isUniqueViolation } from "@/lib/db";
import type {
  InvitableRole,
  InvitationPreview,
  WorkspaceInvitation,
} from "@/lib/workspace/types";

export class PendingInvitationExistsError extends Error {
  constructor() {
    super("This email already has a pending invitation to this workspace.");
    this.name = "PendingInvitationExistsError";
  }
}

export class InvitationNotFoundError extends Error {
  constructor() {
    super("This invitation doesn't exist or has already been used.");
    this.name = "InvitationNotFoundError";
  }
}

export class InvitationExpiredError extends Error {
  constructor() {
    super("This invitation has expired. Ask an admin to send a new one.");
    this.name = "InvitationExpiredError";
  }
}

export class AlreadyMemberError extends Error {
  constructor() {
    super("You're already a member of this workspace.");
    this.name = "AlreadyMemberError";
  }
}

const INVITATION_EXPIRY_DAYS = 7;

function generateToken(): string {
  // 32 bytes of randomness, hex-encoded — same order of magnitude as
  // Better Auth's own session tokens, appropriate for a token that
  // grants workspace access to whoever holds the link.
  return crypto.randomBytes(32).toString("hex");
}

interface CreateInvitationInput {
  workspaceId: string;
  email: string;
  role: InvitableRole;
  invitedById: string;
}

/**
 * Create a pending invitation. Collisions on the partial unique index
 * (one pending invite per email per workspace — see
 * 005_invitations_and_projects.sql) surface as a clean, expected
 * error rather than a raw constraint violation, since "this person
 * already has a pending invite" is a normal outcome an admin should
 * see a real message for, not a 500.
 */
export async function createInvitation(input: CreateInvitationInput): Promise<WorkspaceInvitation> {
  const token = generateToken();
  const expiresAt = new Date(Date.now() + INVITATION_EXPIRY_DAYS * 24 * 60 * 60 * 1000);

  try {
    const { rows } = await pool.query<{
      id: string;
      workspaceId: string;
      email: string;
      role: InvitableRole;
      status: WorkspaceInvitation["status"];
      invitedById: string;
      expiresAt: string;
      createdAt: string;
      inviterName: string;
      inviterEmail: string;
    }>(
      `WITH inserted AS (
         INSERT INTO "workspace_invitation"
           ("workspaceId", email, role, token, "invitedById", "expiresAt")
         VALUES ($1, lower($2), $3, $4, $5, $6)
         RETURNING id, "workspaceId", email, role, status, "invitedById", "expiresAt", "createdAt"
       )
       SELECT inserted.*, u.name AS "inviterName", u.email AS "inviterEmail"
       FROM inserted
       INNER JOIN "user" u ON u.id = inserted."invitedById"`,
      [input.workspaceId, input.email, input.role, token, input.invitedById, expiresAt]
    );

    const row = rows[0];
    return {
      id: row.id,
      workspaceId: row.workspaceId,
      email: row.email,
      role: row.role,
      status: row.status,
      invitedById: row.invitedById,
      expiresAt: row.expiresAt,
      createdAt: row.createdAt,
      invitedBy: { name: row.inviterName, email: row.inviterEmail },
    };
  } catch (err) {
    if (isUniqueViolation(err)) {
      throw new PendingInvitationExistsError();
    }
    throw err;
  }
}

/**
 * The raw token for a just-created invitation, separately from the
 * public-safe WorkspaceInvitation shape above — split out so the
 * token only ever exists in the return value of createInvitation's
 * caller (the API route, which emails it) and never gets accidentally
 * serialized into a list response elsewhere.
 */
export async function getInvitationToken(invitationId: string): Promise<string | null> {
  const { rows } = await pool.query<{ token: string }>(
    `SELECT token FROM "workspace_invitation" WHERE id = $1`,
    [invitationId]
  );
  return rows[0]?.token ?? null;
}

/** All pending invitations for a workspace, newest first. */
export async function listPendingInvitations(workspaceId: string): Promise<WorkspaceInvitation[]> {
  const { rows } = await pool.query<{
    id: string;
    workspaceId: string;
    email: string;
    role: InvitableRole;
    status: WorkspaceInvitation["status"];
    invitedById: string;
    expiresAt: string;
    createdAt: string;
    inviterName: string;
    inviterEmail: string;
  }>(
    `SELECT
       wi.id, wi."workspaceId", wi.email, wi.role, wi.status,
       wi."invitedById", wi."expiresAt", wi."createdAt",
       u.name AS "inviterName", u.email AS "inviterEmail"
     FROM "workspace_invitation" wi
     INNER JOIN "user" u ON u.id = wi."invitedById"
     WHERE wi."workspaceId" = $1 AND wi.status = 'pending'
     ORDER BY wi."createdAt" DESC`,
    [workspaceId]
  );

  return rows.map((r) => ({
    id: r.id,
    workspaceId: r.workspaceId,
    email: r.email,
    role: r.role,
    status: r.status,
    invitedById: r.invitedById,
    expiresAt: r.expiresAt,
    createdAt: r.createdAt,
    invitedBy: { name: r.inviterName, email: r.inviterEmail },
  }));
}

/** Revoke a pending invitation. No-ops (via WHERE clause) if it's already accepted/declined/revoked. */
export async function revokeInvitation(workspaceId: string, invitationId: string): Promise<void> {
  await pool.query(
    `UPDATE "workspace_invitation" SET status = 'revoked', "updatedAt" = now()
     WHERE id = $1 AND "workspaceId" = $2 AND status = 'pending'`,
    [invitationId, workspaceId]
  );
}

/**
 * Look up an invitation by its public token, for the /invite/[token]
 * landing page — returns a deliberately minimal preview shape (see
 * InvitationPreview's doc comment) rather than the full
 * WorkspaceInvitation, since this is called before the viewer has
 * proven they're the invited person or even signed in at all.
 */
export async function getInvitationPreviewByToken(token: string): Promise<InvitationPreview | null> {
  const { rows } = await pool.query<{
    email: string;
    role: InvitableRole;
    status: InvitationPreview["status"];
    expiresAt: string;
    workspaceName: string;
    workspaceIcon: string | null;
    inviterName: string;
  }>(
    `SELECT
       wi.email, wi.role, wi.status, wi."expiresAt",
       w.name AS "workspaceName", w.icon AS "workspaceIcon",
       u.name AS "inviterName"
     FROM "workspace_invitation" wi
     INNER JOIN "workspace" w ON w.id = wi."workspaceId"
     INNER JOIN "user" u ON u.id = wi."invitedById"
     WHERE wi.token = $1
     LIMIT 1`,
    [token]
  );

  const row = rows[0];
  if (!row) return null;

  return {
    workspaceName: row.workspaceName,
    workspaceIcon: row.workspaceIcon,
    role: row.role,
    inviterName: row.inviterName,
    email: row.email,
    status: row.status,
    expiresAt: row.expiresAt,
  };
}

/**
 * Accept an invitation: verify token validity (pending, not expired,
 * email matches the accepting user), create the workspace_member row,
 * and mark the invitation accepted — all in one transaction, so a
 * user is never left "half accepted" (membership created but
 * invitation still pending, which would let the same token be reused).
 *
 * The email-match check matters because invitations are sent to an
 * email address, not a user ID — someone could otherwise sign up
 * under any account and redeem a token meant for a different person
 * if the invited email weren't verified against the accepting
 * session's own email.
 */
export async function acceptInvitation(
  token: string,
  acceptingUserId: string,
  acceptingUserEmail: string
): Promise<{ workspaceId: string; workspaceSlug: string }> {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const { rows } = await client.query<{
      id: string;
      workspaceId: string;
      email: string;
      role: InvitableRole;
      status: string;
      expiresAt: string;
      workspaceSlug: string;
    }>(
      `SELECT wi.id, wi."workspaceId", wi.email, wi.role, wi.status, wi."expiresAt", w.slug AS "workspaceSlug"
       FROM "workspace_invitation" wi
       INNER JOIN "workspace" w ON w.id = wi."workspaceId"
       WHERE wi.token = $1
       LIMIT 1
       FOR UPDATE OF wi`,
      [token]
    );

    const invitation = rows[0];
    if (!invitation) throw new InvitationNotFoundError();
    if (invitation.status !== "pending") throw new InvitationNotFoundError();
    if (new Date(invitation.expiresAt).getTime() < Date.now()) {
      // Mark it expired-equivalent (revoked) so it stops showing as
      // pending in the workspace's invitation list going forward.
      await client.query(
        `UPDATE "workspace_invitation" SET status = 'revoked', "updatedAt" = now() WHERE id = $1`,
        [invitation.id]
      );
      await client.query("COMMIT");
      throw new InvitationExpiredError();
    }
    if (invitation.email.toLowerCase() !== acceptingUserEmail.toLowerCase()) {
      throw new InvitationNotFoundError();
    }

    const { rows: existingMember } = await client.query<{ id: string }>(
      `SELECT id FROM "workspace_member" WHERE "workspaceId" = $1 AND "userId" = $2`,
      [invitation.workspaceId, acceptingUserId]
    );
    if (existingMember.length > 0) {
      // Already a member (e.g. re-clicked an old email) — mark the
      // invitation accepted anyway so it stops cluttering the pending
      // list, but don't throw; treat this as a harmless no-op success
      // from the accepting user's point of view.
      await client.query(
        `UPDATE "workspace_invitation" SET status = 'accepted', "updatedAt" = now() WHERE id = $1`,
        [invitation.id]
      );
      await client.query("COMMIT");
      return { workspaceId: invitation.workspaceId, workspaceSlug: invitation.workspaceSlug };
    }

    await client.query(
      `INSERT INTO "workspace_member" ("workspaceId", "userId", role) VALUES ($1, $2, $3)`,
      [invitation.workspaceId, acceptingUserId, invitation.role]
    );
    await client.query(
      `UPDATE "workspace_invitation" SET status = 'accepted', "updatedAt" = now() WHERE id = $1`,
      [invitation.id]
    );
    await client.query(
      `UPDATE "user" SET "activeWorkspaceId" = $1, "updatedAt" = now() WHERE id = $2`,
      [invitation.workspaceId, acceptingUserId]
    );

    await client.query("COMMIT");
    return { workspaceId: invitation.workspaceId, workspaceSlug: invitation.workspaceSlug };
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

/** Decline an invitation by token — no session required, matches accept's public-token nature. */
export async function declineInvitation(token: string): Promise<void> {
  const { rows } = await pool.query<{ id: string; status: string }>(
    `SELECT id, status FROM "workspace_invitation" WHERE token = $1 LIMIT 1`,
    [token]
  );
  const invitation = rows[0];
  if (!invitation || invitation.status !== "pending") {
    throw new InvitationNotFoundError();
  }

  await pool.query(
    `UPDATE "workspace_invitation" SET status = 'declined', "updatedAt" = now() WHERE id = $1`,
    [invitation.id]
  );
}
