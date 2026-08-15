// src/lib/project/queries.ts
import { pool, isUniqueViolation } from "@/lib/db";
import { slugify, slugCandidates, isValidSlug } from "@/lib/workspace/slug";
import type { Project, ProjectStatus } from "@/lib/workspace/types";

export class ProjectSlugExhaustedError extends Error {
  constructor() {
    super("Could not generate a unique project URL. Try a different name.");
    this.name = "ProjectSlugExhaustedError";
  }
}

interface CreateProjectInput {
  workspaceId: string;
  name: string;
  description?: string | null;
  icon?: string | null;
  createdById: string;
  slug?: string;
}

/**
 * Create a project. Unlike createWorkspace (Part 2a), this doesn't
 * need a wrapping transaction with a second insert — a project has no
 * required companion row the way a workspace needs its owner member
 * — but it reuses the same slug-retry-on-collision approach, scoped
 * to project_workspace_slug_lower_unique_idx (unique per workspace,
 * not globally, since project URLs are always /w/[wsSlug]/[pSlug]).
 */
export async function createProject(input: CreateProjectInput): Promise<Project> {
  const baseSlug = input.slug && isValidSlug(input.slug) ? input.slug : slugify(input.name);

  for (const candidate of slugCandidates(baseSlug)) {
    try {
      const { rows } = await pool.query<Project>(
        `INSERT INTO "project" ("workspaceId", name, slug, description, icon, "createdById")
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING id, "workspaceId", name, slug, description, icon, status, "createdById", "createdAt", "updatedAt"`,
        [input.workspaceId, input.name, candidate, input.description ?? null, input.icon ?? null, input.createdById]
      );
      return rows[0];
    } catch (err) {
      if (isUniqueViolation(err)) continue;
      throw err;
    }
  }

  throw new ProjectSlugExhaustedError();
}

/** All projects in a workspace, active first then archived, newest first within each group. */
export async function listProjects(workspaceId: string): Promise<Project[]> {
  const { rows } = await pool.query<Project>(
    `SELECT id, "workspaceId", name, slug, description, icon, status, "createdById", "createdAt", "updatedAt"
     FROM "project"
     WHERE "workspaceId" = $1
     ORDER BY (status = 'archived'), "createdAt" DESC`,
    [workspaceId]
  );
  return rows;
}

/** A single project by slug, scoped to its workspace — powers /w/[slug]/[projectSlug]. */
export async function getProjectBySlug(workspaceId: string, projectSlug: string): Promise<Project | null> {
  const { rows } = await pool.query<Project>(
    `SELECT id, "workspaceId", name, slug, description, icon, status, "createdById", "createdAt", "updatedAt"
     FROM "project"
     WHERE "workspaceId" = $1 AND lower(slug) = lower($2)
     LIMIT 1`,
    [workspaceId, projectSlug]
  );
  return rows[0] ?? null;
}

/** A single project by ID, scoped to its workspace — used by API routes that address a project directly. */
export async function getProjectById(workspaceId: string, projectId: string): Promise<Project | null> {
  const { rows } = await pool.query<Project>(
    `SELECT id, "workspaceId", name, slug, description, icon, status, "createdById", "createdAt", "updatedAt"
     FROM "project"
     WHERE "workspaceId" = $1 AND id = $2
     LIMIT 1`,
    [workspaceId, projectId]
  );
  return rows[0] ?? null;
}

interface UpdateProjectInput {
  name?: string;
  description?: string | null;
  icon?: string | null;
  status?: ProjectStatus;
  slug?: string;
}

export async function updateProject(
  workspaceId: string,
  projectId: string,
  input: UpdateProjectInput
): Promise<Project> {
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
  if (input.status !== undefined) {
    sets.push(`status = $${i++}`);
    values.push(input.status);
  }
  if (input.slug !== undefined) {
    sets.push(`slug = $${i++}`);
    values.push(input.slug);
  }

  sets.push(`"updatedAt" = now()`);
  values.push(projectId, workspaceId);

  const { rows } = await pool.query<Project>(
    `UPDATE "project" SET ${sets.join(", ")} WHERE id = $${i} AND "workspaceId" = $${i + 1}
     RETURNING id, "workspaceId", name, slug, description, icon, status, "createdById", "createdAt", "updatedAt"`,
    values
  );
  return rows[0];
}

export async function deleteProject(workspaceId: string, projectId: string): Promise<void> {
  await pool.query(`DELETE FROM "project" WHERE id = $1 AND "workspaceId" = $2`, [projectId, workspaceId]);
}
