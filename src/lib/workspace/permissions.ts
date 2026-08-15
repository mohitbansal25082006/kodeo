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
 */
export function canRemoveMember(actorRole: WorkspaceRole, targetRole: WorkspaceRole): boolean {
  if (!hasAtLeastRole(actorRole, "admin")) return false;
  return outranks(actorRole, targetRole);
}

/**
 * Leaving a workspace voluntarily. Anyone except the sole owner can
 * leave at will — an owner must transfer ownership first, since
 * leaving would otherwise strand the workspace with no owner at all.
 */
export function canLeaveWorkspace(role: WorkspaceRole): boolean {
  return role !== "owner";
}

/** Only the current owner can initiate an ownership transfer. */
export function canTransferOwnership(actorRole: WorkspaceRole): boolean {
  return actorRole === "owner";
}

// ────────────────────────────────────────────────────────────
// Part 2c — invitations, projects
// ────────────────────────────────────────────────────────────

/** Invite new members by email. Admins and owners only — mirrors canEditWorkspaceDetails' bar. */
export function canInviteMembers(role: WorkspaceRole): boolean {
  return hasAtLeastRole(role, "admin");
}

/**
 * Revoke a pending invitation. Same bar as sending one — if you can
 * invite, you can un-invite. (Unlike member removal, there's no
 * "outranks the target" question here since an invitation has no
 * role of its own yet, just the role it will grant on acceptance.)
 */
export function canRevokeInvitation(role: WorkspaceRole): boolean {
  return hasAtLeastRole(role, "admin");
}

/**
 * See the list of pending invitations. Kept at the same admin+ bar as
 * sending them, rather than opening it to every member — who has and
 * hasn't been invited is a light management detail, not something
 * viewers/editors need visibility into.
 */
export function canViewInvitations(role: WorkspaceRole): boolean {
  return hasAtLeastRole(role, "admin");
}

/**
 * An invitation can only grant a role the inviter themselves could
 * grant directly via canChangeMemberRole's "can't grant above your
 * own rank" rule — an admin can invite someone as admin/editor/viewer,
 * but never as owner (ownership has no invitation path at all, see
 * the CHECK constraint in 005_invitations_and_projects.sql).
 */
export function canInviteAsRole(actorRole: WorkspaceRole, invitedRole: WorkspaceRole): boolean {
  if (invitedRole === "owner") return false;
  return hasAtLeastRole(actorRole, "admin") && hasAtLeastRole(actorRole, invitedRole);
}

/** Create a new project within the workspace. Editors and above — viewers are read-only by design. */
export function canCreateProject(role: WorkspaceRole): boolean {
  return hasAtLeastRole(role, "editor");
}

/** Edit a project's name/description/status. Same bar as creating one. */
export function canEditProject(role: WorkspaceRole): boolean {
  return hasAtLeastRole(role, "editor");
}

/**
 * Delete a project. Admins and owners can delete any project in the
 * workspace; an editor may only delete a project they created
 * themselves — matches the "editors build, admins govern" split used
 * throughout Part 2's role model, and avoids one editor being able to
 * destroy another editor's work.
 */
export function canDeleteProject(
  actorRole: WorkspaceRole,
  actorUserId: string,
  projectCreatedById: string
): boolean {
  if (hasAtLeastRole(actorRole, "admin")) return true;
  return actorRole === "editor" && actorUserId === projectCreatedById;
}
