// src/lib/workspace/types.ts

/**
 * The four fixed workspace roles from the Part 2 spec, ordered from
 * most to least privileged. Keeping this as a plain string union (not
 * a TS enum) matches the DB's CHECK constraint in
 * db/migrations/004_workspaces.sql, which stores these as plain text.
 */
export type WorkspaceRole = "owner" | "admin" | "editor" | "viewer";

export const WORKSPACE_ROLES: WorkspaceRole[] = ["owner", "admin", "editor", "viewer"];

/**
 * Roles that can be granted through an invitation. Owner is excluded
 * — see the CHECK constraint in 005_invitations_and_projects.sql and
 * canInviteAsRole in permissions.ts for why ownership never flows
 * through the invite path.
 */
export type InvitableRole = "admin" | "editor" | "viewer";
export const INVITABLE_ROLES: InvitableRole[] = ["admin", "editor", "viewer"];

export interface WorkspaceRoleMeta {
  id: WorkspaceRole;
  label: string;
  description: string;
}

/**
 * Human-readable role metadata for role pickers, badges, and the
 * members table.
 */
export const WORKSPACE_ROLE_META: Record<WorkspaceRole, WorkspaceRoleMeta> = {
  owner: {
    id: "owner",
    label: "Owner",
    description: "Full control, including deleting the workspace and transferring ownership.",
  },
  admin: {
    id: "admin",
    label: "Admin",
    description: "Manage members, invitations, and projects. Cannot delete the workspace.",
  },
  editor: {
    id: "editor",
    label: "Editor",
    description: "Create and edit projects. Cannot manage members or workspace settings.",
  },
  viewer: {
    id: "viewer",
    label: "Viewer",
    description: "Read-only access to projects.",
  },
};

/** A workspace row as returned from the database, camelCase as-is. */
export interface Workspace {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * A workspace joined with the current user's membership in it — the
 * shape the switcher, dashboard list, and layout guard all consume.
 */
export interface WorkspaceWithRole extends Workspace {
  role: WorkspaceRole;
  memberCount: number;
}

export interface WorkspaceMember {
  id: string;
  workspaceId: string;
  userId: string;
  role: WorkspaceRole;
  createdAt: string;
  user: {
    name: string;
    email: string;
    image: string | null;
    username: string | null;
  };
}

// ────────────────────────────────────────────────────────────
// Part 2c — invitations, projects
// ────────────────────────────────────────────────────────────

export type InvitationStatus = "pending" | "accepted" | "declined" | "revoked";

export interface WorkspaceInvitation {
  id: string;
  workspaceId: string;
  email: string;
  role: InvitableRole;
  status: InvitationStatus;
  invitedById: string;
  expiresAt: string;
  createdAt: string;
  invitedBy: {
    name: string;
    email: string;
  };
}

/**
 * The shape a public /invite/[token] landing page needs — enough to
 * show "You've been invited to join {workspace.name} as {role}" and
 * confirm without leaking anything about the workspace to someone who
 * hasn't accepted yet (no member list, no other invitations, etc).
 */
export interface InvitationPreview {
  workspaceName: string;
  workspaceIcon: string | null;
  role: InvitableRole;
  inviterName: string;
  email: string;
  status: InvitationStatus;
  expiresAt: string;
}

export type ProjectStatus = "active" | "archived";

export interface Project {
  id: string;
  workspaceId: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  status: ProjectStatus;
  createdById: string;
  createdAt: string;
  updatedAt: string;
}
