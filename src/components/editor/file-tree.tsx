// src/components/editor/file-tree.tsx
"use client";

import * as React from "react";
import {
  ChevronRight,
  Folder,
  FolderOpen,
  File as FileIcon,
  FileJson,
  FileCode2,
  FileText,
  Plus,
  FolderPlus,
  MoreHorizontal,
  Pencil,
  Trash2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { ProjectNodeTree } from "@/lib/filesystem/types";

interface FileTreeProps {
  tree: ProjectNodeTree[];
  activeNodeId: string | null;
  canWrite: boolean;
  onOpenFile: (node: ProjectNodeTree) => void;
  onCreate: (parentId: string | null, type: "file" | "folder") => void;
  onRename: (node: ProjectNodeTree) => void;
  onDelete: (node: ProjectNodeTree) => void;
}

/** Icon chosen by extension family — kept intentionally coarse (not a 1:1 icon-per-language set) so the tree stays visually calm at a glance rather than turning into an icon-font showcase. */
function iconForFile(name: string) {
  const lower = name.toLowerCase();
  const ext = lower.includes(".") ? lower.slice(lower.lastIndexOf(".") + 1) : "";
  if (ext === "json" || ext === "jsonc") return FileJson;
  if (["js", "jsx", "ts", "tsx", "mjs", "cjs", "py", "go", "rs", "java", "c", "cpp", "cs", "php", "rb", "swift", "kt"].includes(ext)) {
    return FileCode2;
  }
  if (["md", "mdx", "txt"].includes(ext)) return FileText;
  return FileIcon;
}

export function FileTree({ tree, activeNodeId, canWrite, onOpenFile, onCreate, onRename, onDelete }: FileTreeProps) {
  const [expanded, setExpanded] = React.useState<Set<string>>(new Set());

  function toggle(id: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  if (tree.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 px-4 py-10 text-center">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-surface">
          <FolderPlus className="h-4 w-4 text-tertiary" />
        </div>
        <p className="text-xs text-tertiary">No files yet.</p>
        {canWrite && (
          <div className="flex gap-1.5">
            <button
              onClick={() => onCreate(null, "file")}
              className="rounded-lg border border-border bg-surface px-2.5 py-1.5 text-xs font-medium text-secondary transition-colors hover:border-border-strong hover:text-primary"
            >
              New file
            </button>
            <button
              onClick={() => onCreate(null, "folder")}
              className="rounded-lg border border-border bg-surface px-2.5 py-1.5 text-xs font-medium text-secondary transition-colors hover:border-border-strong hover:text-primary"
            >
              New folder
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="select-none px-1.5 py-2">
      {tree.map((node) => (
        <TreeNode
          key={node.id}
          node={node}
          depth={0}
          expanded={expanded}
          activeNodeId={activeNodeId}
          canWrite={canWrite}
          onToggle={toggle}
          onOpenFile={onOpenFile}
          onCreate={onCreate}
          onRename={onRename}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}

interface TreeNodeProps {
  node: ProjectNodeTree;
  depth: number;
  expanded: Set<string>;
  activeNodeId: string | null;
  canWrite: boolean;
  onToggle: (id: string) => void;
  onOpenFile: (node: ProjectNodeTree) => void;
  onCreate: (parentId: string | null, type: "file" | "folder") => void;
  onRename: (node: ProjectNodeTree) => void;
  onDelete: (node: ProjectNodeTree) => void;
}

function TreeNode({ node, depth, expanded, activeNodeId, canWrite, onToggle, onOpenFile, onCreate, onRename, onDelete }: TreeNodeProps) {
  const [menuOpen, setMenuOpen] = React.useState(false);
  const isOpen = expanded.has(node.id);
  const isActive = activeNodeId === node.id;
  const Icon = node.type === "folder" ? (isOpen ? FolderOpen : Folder) : iconForFile(node.name);

  function handleClick() {
    if (node.type === "folder") onToggle(node.id);
    else onOpenFile(node);
  }

  return (
    <div>
      <div
        className={cn(
          "group relative flex items-center gap-1 rounded-lg px-1.5 py-1 text-sm transition-colors",
          isActive ? "bg-accent-dim/50 text-accent" : "text-secondary hover:bg-surface hover:text-primary"
        )}
        style={{ paddingLeft: `${depth * 14 + 6}px` }}
      >
        <button onClick={handleClick} className="flex min-w-0 flex-1 items-center gap-1.5 py-0.5 text-left">
          {node.type === "folder" ? (
            <ChevronRight
              className={cn("h-3.5 w-3.5 shrink-0 text-tertiary transition-transform duration-150", isOpen && "rotate-90")}
            />
          ) : (
            <span className="w-3.5 shrink-0" />
          )}
          <Icon className={cn("h-3.5 w-3.5 shrink-0", node.type === "folder" ? "text-accent/70" : "text-tertiary")} />
          <span className="truncate">{node.name}</span>
        </button>

        {canWrite && (
          <div className="relative shrink-0">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setMenuOpen((v) => !v);
              }}
              className="flex h-6 w-6 items-center justify-center rounded-md text-tertiary opacity-0 transition-opacity hover:bg-surface-hover hover:text-primary group-hover:opacity-100"
              aria-label="Node options"
            >
              <MoreHorizontal className="h-3.5 w-3.5" />
            </button>

            {menuOpen && (
              <>
                <div className="fixed inset-0 z-20" onClick={() => setMenuOpen(false)} />
                <div className="absolute right-0 top-7 z-30 w-44 rounded-xl border border-border bg-bg-elevated p-1.5 shadow-elevated">
                  {node.type === "folder" && (
                    <>
                      <button
                        onClick={() => {
                          setMenuOpen(false);
                          onCreate(node.id, "file");
                        }}
                        className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-sm font-medium text-secondary transition-colors hover:bg-surface hover:text-primary"
                      >
                        <Plus className="h-3.5 w-3.5" />
                        New file
                      </button>
                      <button
                        onClick={() => {
                          setMenuOpen(false);
                          onCreate(node.id, "folder");
                        }}
                        className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-sm font-medium text-secondary transition-colors hover:bg-surface hover:text-primary"
                      >
                        <FolderPlus className="h-3.5 w-3.5" />
                        New folder
                      </button>
                      <div className="my-1 h-px bg-border" />
                    </>
                  )}
                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      onRename(node);
                    }}
                    className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-sm font-medium text-secondary transition-colors hover:bg-surface hover:text-primary"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                    Rename
                  </button>
                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      onDelete(node);
                    }}
                    className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-sm font-medium text-danger transition-colors hover:bg-danger/10"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Delete
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {node.type === "folder" && isOpen && node.children.length > 0 && (
        <div>
          {node.children.map((child) => (
            <TreeNode
              key={child.id}
              node={child}
              depth={depth + 1}
              expanded={expanded}
              activeNodeId={activeNodeId}
              canWrite={canWrite}
              onToggle={onToggle}
              onOpenFile={onOpenFile}
              onCreate={onCreate}
              onRename={onRename}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
}
