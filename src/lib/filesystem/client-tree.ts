// src/lib/filesystem/client-tree.ts
import type { ProjectNodeSummary, ProjectNodeTree } from "@/lib/filesystem/types";

/**
 * Client-side twin of queries.ts's buildTree. Deliberately duplicated
 * (rather than imported from queries.ts) because queries.ts pulls in
 * `pg` — a Node-only module that must never end up in a client
 * bundle. Both implementations are pure, small, and intentionally
 * kept in lockstep; if this drifts from queries.ts's version, tree
 * shape would differ between server-rendered and client-refetched
 * views, so treat any change to one as a change to both.
 */
export function buildTreeClient(nodes: ProjectNodeSummary[]): ProjectNodeTree[] {
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
