// src/lib/workspace/permissions.ts
import type { WorkspaceRole } from "@/lib/workspace/types";

/**
 * Numeric rank per role — higher is more privileged. Used for simple
 * "does role A outrank role B" checks, e.g. an admin cannot change
 * another admin's role, only an owner can.
 */
const ROLE_RANK: Record<WorkspaceRole, number> = {
  owner: 3,
  admin: 2,
  editor: 1,
  viewer: 0,
};

export function roleRank(role: WorkspaceRole): number {
  return ROLE_RANK[role];
}

/** True if `role` is at least as privileged as `minimum`. */
export function hasAtLeastRole(role: WorkspaceRole, minimum: WorkspaceRole): boolean {
  return ROLE_RANK[role] >= ROLE_RANK[minimum];
}

/** True if `role` strictly outranks `other`. */
export function outranks(role: WorkspaceRole, other: WorkspaceRole): boolean {
  return ROLE_RANK[role] > ROLE_RANK[other];
}

// ────────────────────────────────────────────────────────────
// Part 2a
// ────────────────────────────────────────────────────────────

export function canCreateWorkspace(): boolean {
  return true; // any authenticated user — enforced by requiring a session in the route handler
}

export function isWorkspaceMember(role: WorkspaceRole | null | undefined): role is WorkspaceRole {
  return role != null;
}

// ────────────────────────────────────────────────────────────
// Part 2b — workspace settings, members, roles
// ────────────────────────────────────────────────────────────

/** Rename, re-icon, or edit the description of the workspace. */
export function canEditWorkspaceDetails(role: WorkspaceRole): boolean {
  return hasAtLeastRole(role, "admin");
}

/**
 * Permanently delete the workspace. Deliberately owner-only, even
 * though admins can do almost everything else an owner can — deletion
 * is destructive and irreversible for every member, not just the
 * actor, so it stays behind the highest bar.
 */
export function canDeleteWorkspace(role: WorkspaceRole): boolean {
  return role === "owner";
}

/** View the members list. Every member can see who else is in the workspace. */
export function canViewMembers(role: WorkspaceRole): boolean {
  return isWorkspaceMember(role);
}

/** Invite new members (invitations themselves ship in Part 2c). */
export function canInviteMembers(role: WorkspaceRole): boolean {
  return hasAtLeastRole(role, "admin");
}

/**
 * Change another member's role. An actor can only set a role on a
 * target they outrank, and can only grant a role at or below their
 * own rank — this is what stops an admin from promoting someone to
 * admin (equal rank) or owner (higher rank), while still letting an
 * owner freely move people between admin/editor/viewer.
 *
 * Ownership itself is NEVER granted through this check — see
 * canTransferOwnership, which is a separate, owner-only, single-
 * target operation with its own safeguards.
 */
export function canChangeMemberRole(
  actorRole: WorkspaceRole,
  targetCurrentRole: WorkspaceRole,
  newRole: WorkspaceRole
): boolean {
  if (newRole === "owner") return false; // ownership changes only via transferOwnership
  if (!hasAtLeastRole(actorRole, "admin")) return false;
  if (!outranks(actorRole, targetCurrentRole)) return false; // can't touch peers or superiors
  if (!hasAtLeastRole(actorRole, newRole)) return false; // can't grant a role above your own
  return true;
}

/**
 * Remove a member from the workspace. Same "must outrank the target"
 * rule as role changes — an admin can remove editors/viewers but not
 * other admins or the owner; only the owner can remove an admin.
 * Removing yourself (leaving the workspace) is handled by a separate
 * check below since the outranking rule doesn't apply to yourself.
 */
export function canRemoveMember(actorRole: WorkspaceRole, targetRole: WorkspaceRole): boolean {
  if (!hasAtLeastRole(actorRole, "admin")) return false;
  return outranks(actorRole, targetRole);
}

/**
 * Leaving a workspace voluntarily. Anyone except the sole owner can
 * leave at will — an owner must transfer ownership first (see
 * canTransferOwnership / the isLastOwner check in queries.ts), since
 * leaving would otherwise strand the workspace with no owner at all.
 */
export function canLeaveWorkspace(role: WorkspaceRole): boolean {
  return role !== "owner";
}

/** Only the current owner can initiate an ownership transfer. */
export function canTransferOwnership(actorRole: WorkspaceRole): boolean {
  return actorRole === "owner";
}
