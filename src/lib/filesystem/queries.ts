// src/lib/filesystem/queries.ts
import { pool, isUniqueViolation } from "@/lib/db";
import type { ProjectNode, ProjectNodeSummary, ProjectNodeTree, NodeType } from "@/lib/filesystem/types";

export class DuplicateNameError extends Error {
  constructor(name: string) {
    super(`"${name}" already exists here.`);
    this.name = "DuplicateNameError";
  }
}

export class CycleError extends Error {
  constructor(message = "Can't move a folder into itself or one of its own subfolders.") {
    super(message);
    this.name = "CycleError";
  }
}

/** Postgres RAISE EXCEPTION ... USING ERRCODE = 'P0001' surfaces as this code — used by the cycle-prevention trigger in 006_project_nodes.sql. */
function isRaisedException(err: unknown): err is { code: string; message: string } {
  return typeof err === "object" && err !== null && "code" in err && (err as { code?: string }).code === "P0001";
}

const SUMMARY_COLUMNS = `
  id, "projectId", "parentId", type, name, size, path,
  "createdById", "createdAt", "updatedAt"
`;

const FULL_COLUMNS = `${SUMMARY_COLUMNS}, content`;

// ────────────────────────────────────────────────────────────
// Reads
// ────────────────────────────────────────────────────────────

/**
 * Every node in a project, flat — the tree UI assembles this into a
 * nested structure client-side (buildTree below) rather than paying
 * for a recursive query, since a single flat SELECT scoped by
 * projectId is both simpler and faster than a WITH RECURSIVE walk
 * when we're fetching the *entire* tree anyway (recursive CTEs earn
 * their keep for partial subtrees/ancestor chains, not "give me
 * everything under this project").
 */
export async function listProjectNodes(projectId: string): Promise<ProjectNodeSummary[]> {
  const { rows } = await pool.query<ProjectNodeSummary>(
    `SELECT ${SUMMARY_COLUMNS} FROM "project_node"
     WHERE "projectId" = $1
     ORDER BY type = 'file', lower(name)`, // folders before files, then alphabetical — standard explorer ordering
    [projectId]
  );
  return rows;
}

/** Assembles a flat node list into a nested tree, root nodes first. Pure function, no DB access — safe to call from a Server Component with data already fetched. */
export function buildTree(nodes: ProjectNodeSummary[]): ProjectNodeTree[] {
  const byId = new Map<string, ProjectNodeTree>();
  for (const node of nodes) byId.set(node.id, { ...node, children: [] });

  const roots: ProjectNodeTree[] = [];
  for (const node of nodes) {
    const entry = byId.get(node.id)!;
    if (node.parentId && byId.has(node.parentId)) {
      byId.get(node.parentId)!.children.push(entry);
    } else {
      roots.push(entry);
    }
  }
  return roots;
}

export async function getNodeById(projectId: string, nodeId: string): Promise<ProjectNode | null> {
  const { rows } = await pool.query<ProjectNode>(
    `SELECT ${FULL_COLUMNS} FROM "project_node" WHERE id = $1 AND "projectId" = $2 LIMIT 1`,
    [nodeId, projectId]
  );
  return rows[0] ?? null;
}

/** Summary-only variant (no content) — used by every code path that doesn't need the file body, e.g. rename/move/delete confirmations. */
export async function getNodeSummaryById(
  projectId: string,
  nodeId: string
): Promise<ProjectNodeSummary | null> {
  const { rows } = await pool.query<ProjectNodeSummary>(
    `SELECT ${SUMMARY_COLUMNS} FROM "project_node" WHERE id = $1 AND "projectId" = $2 LIMIT 1`,
    [nodeId, projectId]
  );
  return rows[0] ?? null;
}

/** All descendant IDs of a folder (not including itself) — used to pre-flight a cycle check with a friendly error before the DB trigger would reject it anyway. */
export async function getDescendantIds(projectId: string, nodeId: string): Promise<Set<string>> {
  const { rows } = await pool.query<{ id: string }>(
    `WITH RECURSIVE subtree AS (
       SELECT id FROM "project_node" WHERE id = $1 AND "projectId" = $2
       UNION ALL
       SELECT c.id FROM "project_node" c INNER JOIN subtree s ON c."parentId" = s.id
     )
     SELECT id FROM subtree WHERE id != $1`,
    [nodeId, projectId]
  );
  return new Set(rows.map((r) => r.id));
}

// ────────────────────────────────────────────────────────────
// Writes
// ────────────────────────────────────────────────────────────

interface CreateNodeInput {
  projectId: string;
  parentId: string | null;
  type: NodeType;
  name: string;
  content?: string;
  createdById: string;
}

export async function createNode(input: CreateNodeInput): Promise<ProjectNode> {
  try {
    const { rows } = await pool.query<ProjectNode>(
      `INSERT INTO "project_node" ("projectId", "parentId", type, name, content, "createdById")
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING ${FULL_COLUMNS}`,
      [input.projectId, input.parentId, input.type, input.name.trim(), input.type === "file" ? (input.content ?? "") : "", input.createdById]
    );
    return rows[0];
  } catch (err) {
    if (isUniqueViolation(err)) throw new DuplicateNameError(input.name.trim());
    throw err;
  }
}

/** Overwrites a file's full content — the write path auto-save (Part 3b/3c) will call on every debounced save. */
export async function updateNodeContent(
  projectId: string,
  nodeId: string,
  content: string
): Promise<ProjectNode> {
  const { rows } = await pool.query<ProjectNode>(
    `UPDATE "project_node" SET content = $1
     WHERE id = $2 AND "projectId" = $3 AND type = 'file'
     RETURNING ${FULL_COLUMNS}`,
    [content, nodeId, projectId]
  );
  if (!rows[0]) throw new Error("File not found.");
  return rows[0];
}

export async function renameNode(
  projectId: string,
  nodeId: string,
  newName: string
): Promise<ProjectNodeSummary> {
  try {
    const { rows } = await pool.query<ProjectNodeSummary>(
      `UPDATE "project_node" SET name = $1
       WHERE id = $2 AND "projectId" = $3
       RETURNING ${SUMMARY_COLUMNS}`,
      [newName.trim(), nodeId, projectId]
    );
    if (!rows[0]) throw new Error("Node not found.");
    return rows[0];
  } catch (err) {
    if (isUniqueViolation(err)) throw new DuplicateNameError(newName.trim());
    throw err;
  }
}

/**
 * Move a node to a new parent (or to the project root, if newParentId
 * is null), optionally renaming it in the same statement — this is
 * what drag-and-drop in the explorer calls. The cycle-prevention
 * trigger from 006_project_nodes.sql is the ultimate backstop; the
 * getDescendantIds pre-check in the API route exists purely to return
 * a clean 400 instead of surfacing a raw Postgres exception.
 */
export async function moveNode(
  projectId: string,
  nodeId: string,
  newParentId: string | null,
  newName?: string
): Promise<ProjectNodeSummary> {
  try {
    const { rows } = await pool.query<ProjectNodeSummary>(
      `UPDATE "project_node"
       SET "parentId" = $1${newName !== undefined ? `, name = $4` : ""}
       WHERE id = $2 AND "projectId" = $3
       RETURNING ${SUMMARY_COLUMNS}`,
      newName !== undefined
        ? [newParentId, nodeId, projectId, newName.trim()]
        : [newParentId, nodeId, projectId]
    );
    if (!rows[0]) throw new Error("Node not found.");
    return rows[0];
  } catch (err) {
    if (isUniqueViolation(err)) throw new DuplicateNameError(newName?.trim() ?? "that name");
    if (isRaisedException(err)) throw new CycleError(err.message);
    throw err;
  }
}

/** Relies on ON DELETE CASCADE — deleting a folder deletes its whole subtree in one statement. */
export async function deleteNode(projectId: string, nodeId: string): Promise<void> {
  await pool.query(`DELETE FROM "project_node" WHERE id = $1 AND "projectId" = $2`, [nodeId, projectId]);
}

/** True if `parentId` (a folder) exists in this project — used to validate create/move targets before writing. */
export async function folderExists(projectId: string, parentId: string): Promise<boolean> {
  const { rows } = await pool.query(
    `SELECT 1 FROM "project_node" WHERE id = $1 AND "projectId" = $2 AND type = 'folder' LIMIT 1`,
    [parentId, projectId]
  );
  return rows.length > 0;
}
