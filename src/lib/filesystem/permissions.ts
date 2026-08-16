// src/lib/filesystem/permissions.ts
import { hasAtLeastRole } from "@/lib/workspace/permissions";
import type { WorkspaceRole } from "@/lib/workspace/types";

/**
 * File-tree permissions deliberately mirror canCreateProject /
 * canEditProject from Part 2c's permissions.ts (editor+ to write,
 * any member to read) rather than introducing a parallel rank
 * system — a person who can create/edit projects can create/edit
 * the files inside them; viewers keep the same read-only guarantee
 * they already have everywhere else in the app.
 */

/** View the file tree and read file contents. Every workspace member, including viewers. */
export function canViewFiles(_role: WorkspaceRole): boolean {
  return true; // any member reaching this check is already membership-gated by getWorkspaceForUser/getWorkspaceBySlugForUser upstream
}

/** Create a file or folder. */
export function canCreateNode(role: WorkspaceRole): boolean {
  return hasAtLeastRole(role, "editor");
}

/** Rename or move a file/folder. Same bar as creating one. */
export function canRenameNode(role: WorkspaceRole): boolean {
  return hasAtLeastRole(role, "editor");
}

/** Edit (save) a file's contents. Same bar as creating one. */
export function canEditNodeContent(role: WorkspaceRole): boolean {
  return hasAtLeastRole(role, "editor");
}

/**
 * Delete a file or folder. Kept at editor+ (unlike project deletion,
 * which reserves admin+ for non-creators) — files are much more
 * granular and frequently-deleted units of work than whole projects,
 * so gating deletion behind "admin, or the project's own creator"
 * the way canDeleteProject does would make ordinary editing friction-
 * heavy for every editor on a team project. The project itself
 * (Part 2c's canDeleteProject) remains the higher-stakes boundary.
 */
export function canDeleteNode(role: WorkspaceRole): boolean {
  return hasAtLeastRole(role, "editor");
}
