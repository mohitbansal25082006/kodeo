// src/components/editor/editor-shell.tsx
"use client";

import * as React from "react";
import { FileCode2, Loader2 } from "lucide-react";
import { FileExplorer } from "@/components/editor/file-explorer";
import type { ProjectNodeTree } from "@/lib/filesystem/types";

interface EditorShellProps {
  workspaceId: string;
  projectId: string;
  canWrite: boolean;
}

interface OpenFileState {
  node: ProjectNodeTree;
  content: string;
  loading: boolean;
  error: string | null;
}

/**
 * Part 3a ships the file system + explorer end-to-end, wired to a
 * read-only preview pane so the whole loop (create → browse → open →
 * see contents → rename → delete) is already usable and testable.
 * Part 3b replaces only the right-hand pane's contents with Monaco —
 * this component's shape (sidebar + active-file state) is exactly
 * what 3b's tab bar builds on, not a throwaway placeholder.
 */
export function EditorShell({ workspaceId, projectId, canWrite }: EditorShellProps) {
  const [openFile, setOpenFile] = React.useState<OpenFileState | null>(null);

  async function handleOpenFile(node: ProjectNodeTree) {
    setOpenFile({ node, content: "", loading: true, error: null });
    try {
      const res = await fetch(`/api/workspaces/${workspaceId}/projects/${projectId}/nodes/${node.id}`);
      const data = await res.json();
      if (!res.ok) {
        setOpenFile({ node, content: "", loading: false, error: data.error || "Couldn't load this file." });
        return;
      }
      setOpenFile({ node, content: data.node.content, loading: false, error: null });
    } catch {
      setOpenFile({ node, content: "", loading: false, error: "Couldn't load this file. Check your connection." });
    }
  }

  return (
    <div className="flex h-[calc(100vh-13rem)] min-h-[420px] overflow-hidden rounded-2xl border border-border bg-bg-elevated">
      <div className="w-64 shrink-0 border-r border-border">
        <FileExplorer
          workspaceId={workspaceId}
          projectId={projectId}
          canWrite={canWrite}
          activeNodeId={openFile?.node.id ?? null}
          onOpenFile={handleOpenFile}
        />
      </div>

      <div className="flex min-w-0 flex-1 flex-col">
        {!openFile ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-border bg-surface">
              <FileCode2 className="h-6 w-6 text-tertiary" />
            </div>
            <div>
              <p className="text-sm font-medium text-primary">No file open</p>
              <p className="mt-1 text-xs text-tertiary">Select a file from the sidebar to view it.</p>
            </div>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-2 border-b border-border px-4 py-2.5">
              <FileCode2 className="h-3.5 w-3.5 shrink-0 text-tertiary" />
              <span className="truncate font-mono-tech text-xs text-secondary">{openFile.node.path}</span>
            </div>
            <div className="flex-1 overflow-auto">
              {openFile.loading ? (
                <div className="flex h-full items-center justify-center">
                  <Loader2 className="h-5 w-5 animate-spin text-tertiary" />
                </div>
              ) : openFile.error ? (
                <div className="flex h-full items-center justify-center px-6 text-center">
                  <p className="text-sm text-danger">{openFile.error}</p>
                </div>
              ) : openFile.content === "" ? (
                <div className="flex h-full items-center justify-center px-6 text-center">
                  <p className="text-xs text-tertiary">This file is empty.</p>
                </div>
              ) : (
                <pre className="whitespace-pre-wrap break-words p-4 font-mono-tech text-[13px] leading-relaxed text-secondary">
                  {openFile.content}
                </pre>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
