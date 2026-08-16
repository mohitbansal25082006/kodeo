// src/components/editor/file-explorer.tsx
"use client";

import * as React from "react";
import { FilePlus, FolderPlus, RefreshCw } from "lucide-react";
import { FileTree } from "@/components/editor/file-tree";
import { CreateNodeModal } from "@/components/editor/create-node-modal";
import { RenameNodeModal } from "@/components/editor/rename-node-modal";
import { ConfirmModal } from "@/components/workspace/confirm-modal";
import type { ProjectNodeTree, ProjectNodeSummary } from "@/lib/filesystem/types";
import { buildTreeClient } from "@/lib/filesystem/client-tree";

interface FileExplorerProps {
  workspaceId: string;
  projectId: string;
  canWrite: boolean;
  activeNodeId: string | null;
  onOpenFile: (node: ProjectNodeTree) => void;
  /** Bumped by the parent whenever it wants the explorer to force a refetch (e.g. after an external mutation). */
  refreshKey?: number;
}

type PendingCreate = { parentId: string | null; type: "file" | "folder" } | null;

export function FileExplorer({ workspaceId, projectId, canWrite, activeNodeId, onOpenFile, refreshKey }: FileExplorerProps) {
  const [nodes, setNodes] = React.useState<ProjectNodeSummary[] | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const [pendingCreate, setPendingCreate] = React.useState<PendingCreate>(null);
  const [renameTarget, setRenameTarget] = React.useState<ProjectNodeTree | null>(null);
  const [deleteTarget, setDeleteTarget] = React.useState<ProjectNodeTree | null>(null);
  const [deleteLoading, setDeleteLoading] = React.useState(false);
  const [deleteError, setDeleteError] = React.useState<string | null>(null);

  const baseUrl = `/api/workspaces/${workspaceId}/projects/${projectId}/nodes`;

  const fetchTree = React.useCallback(async () => {
    setError(null);
    try {
      const res = await fetch(baseUrl);
      if (!res.ok) throw new Error("Couldn't load files.");
      const data = await res.json();
      setNodes(data.nodes);
    } catch {
      setError("Couldn't load files. Check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }, [baseUrl]);

  React.useEffect(() => {
    setLoading(true);
    fetchTree();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchTree, refreshKey]);

  const tree = React.useMemo(() => (nodes ? buildTreeClient(nodes) : []), [nodes]);

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    setDeleteError(null);
    try {
      const res = await fetch(`${baseUrl}/${deleteTarget.id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setDeleteError(data.error || "Couldn't delete this item.");
        setDeleteLoading(false);
        return;
      }
      setDeleteTarget(null);
      await fetchTree();
    } finally {
      setDeleteLoading(false);
    }
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-border px-3 py-2.5">
        <span className="text-xs font-semibold uppercase tracking-wide text-tertiary">Files</span>
        <div className="flex items-center gap-0.5">
          <button
            onClick={fetchTree}
            className="flex h-6 w-6 items-center justify-center rounded-md text-tertiary transition-colors hover:bg-surface hover:text-primary"
            aria-label="Refresh"
            title="Refresh"
          >
            <RefreshCw className="h-3.5 w-3.5" />
          </button>
          {canWrite && (
            <>
              <button
                onClick={() => setPendingCreate({ parentId: null, type: "file" })}
                className="flex h-6 w-6 items-center justify-center rounded-md text-tertiary transition-colors hover:bg-surface hover:text-primary"
                aria-label="New file"
                title="New file"
              >
                <FilePlus className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => setPendingCreate({ parentId: null, type: "folder" })}
                className="flex h-6 w-6 items-center justify-center rounded-md text-tertiary transition-colors hover:bg-surface hover:text-primary"
                aria-label="New folder"
                title="New folder"
              >
                <FolderPlus className="h-3.5 w-3.5" />
              </button>
            </>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="space-y-1.5 px-3 py-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-6 animate-pulse rounded-md bg-surface" style={{ opacity: 1 - i * 0.1 }} />
            ))}
          </div>
        ) : error ? (
          <div className="px-4 py-8 text-center">
            <p className="text-xs text-danger">{error}</p>
            <button onClick={fetchTree} className="mt-2 text-xs font-medium text-accent hover:underline">
              Try again
            </button>
          </div>
        ) : (
          <FileTree
            tree={tree}
            activeNodeId={activeNodeId}
            canWrite={canWrite}
            onOpenFile={onOpenFile}
            onCreate={(parentId, type) => setPendingCreate({ parentId, type })}
            onRename={setRenameTarget}
            onDelete={setDeleteTarget}
          />
        )}
      </div>

      {pendingCreate && (
        <CreateNodeModal
          open
          type={pendingCreate.type}
          onClose={() => setPendingCreate(null)}
          onCreate={async (name) => {
            const res = await fetch(baseUrl, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ type: pendingCreate.type, name, parentId: pendingCreate.parentId }),
            });
            const data = await res.json();
            if (!res.ok) return { error: data.error || "Couldn't create this item." };
            setPendingCreate(null);
            await fetchTree();
            if (pendingCreate.type === "file" && data.node) {
              onOpenFile({ ...data.node, children: [] });
            }
            return {};
          }}
        />
      )}

      {renameTarget && (
        <RenameNodeModal
          open
          node={renameTarget}
          onClose={() => setRenameTarget(null)}
          onRename={async (name) => {
            const res = await fetch(`${baseUrl}/${renameTarget.id}`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ name }),
            });
            const data = await res.json();
            if (!res.ok) return { error: data.error || "Couldn't rename this item." };
            setRenameTarget(null);
            await fetchTree();
            return {};
          }}
        />
      )}

      {deleteTarget && (
        <ConfirmModal
          open
          title={`Delete ${deleteTarget.type}`}
          description={
            deleteTarget.type === "folder"
              ? `"${deleteTarget.name}" and everything inside it will be permanently deleted. This cannot be undone.`
              : `"${deleteTarget.name}" will be permanently deleted. This cannot be undone.`
          }
          confirmLabel={`Delete ${deleteTarget.type}`}
          danger
          loading={deleteLoading}
          error={deleteError}
          onConfirm={handleDelete}
          onClose={() => {
            setDeleteTarget(null);
            setDeleteError(null);
          }}
        />
      )}
    </div>
  );
}
