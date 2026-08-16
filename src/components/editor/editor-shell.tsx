// src/components/editor/editor-shell.tsx
"use client";

import * as React from "react";
import { FileCode2 } from "lucide-react";
import { FileExplorer } from "@/components/editor/file-explorer";
import { TabBar } from "@/components/editor/tab-bar";
import { KodeoMonacoEditor } from "@/components/editor/monaco-editor";
import { useTabs } from "@/lib/editor/tabs-store";
import type { ProjectNodeTree } from "@/lib/filesystem/types";

interface EditorShellProps {
  workspaceId: string;
  projectId: string;
  canWrite: boolean;
}

/**
 * Part 3b's shell: file explorer sidebar + tab bar + Monaco pane.
 * Tab/buffer state lives in useTabs (src/lib/editor/tabs-store.ts);
 * this component's job is wiring that state to the network (fetching
 * a file's content on open) and to the two child components that
 * render it. Auto-save (writing edited buffers back to the server) is
 * deliberately not wired up yet — that's Part 3c. For now, edits live
 * only in the in-memory buffer and the tab's dirty dot, which is
 * still exactly the state Part 3c's save flow needs to read from.
 */
export function EditorShell({ workspaceId, projectId, canWrite }: EditorShellProps) {
  const {
    tabs,
    activeTabId,
    activeTab,
    openFile,
    activateTab,
    editTab,
    closeTab,
    closeOthers,
    closeAll,
    renameTab,
    isDirty,
  } = useTabs();

  const nodesBaseUrl = `/api/workspaces/${workspaceId}/projects/${projectId}/nodes`;

  async function handleOpenFile(node: ProjectNodeTree) {
    await openFile(node, async () => {
      try {
        const res = await fetch(`${nodesBaseUrl}/${node.id}`);
        const data = await res.json();
        if (!res.ok) return { error: data.error || "Couldn't load this file." };
        return { content: data.node.content as string };
      } catch {
        return { error: "Couldn't load this file. Check your connection." };
      }
    });
  }

  /**
   * When the explorer renames the currently-open file, its tab (and
   * the model backing it) need to track the new name/path so the
   * Monaco pane keeps editing the same buffer under its new identity
   * rather than silently going stale. The explorer doesn't know which
   * files are open as tabs — that's exactly the kind of cross-cutting
   * concern this shell exists to mediate.
   */
  function handleNodeRenamed(nodeId: string, name: string, path: string) {
    if (tabs.some((t) => t.nodeId === nodeId)) {
      renameTab(nodeId, name, path);
    }
  }

  /** Same idea for delete — an open tab pointing at a deleted file must close, or the user could keep "editing" a file that no longer exists. */
  function handleNodeDeleted(nodeId: string) {
    if (tabs.some((t) => t.nodeId === nodeId)) {
      closeTab(nodeId);
    }
  }

  return (
    <div className="flex h-[calc(100vh-13rem)] min-h-[480px] overflow-hidden rounded-2xl border border-border bg-bg-elevated">
      <div className="w-64 shrink-0 border-r border-border">
        <FileExplorer
          workspaceId={workspaceId}
          projectId={projectId}
          canWrite={canWrite}
          activeNodeId={activeTabId}
          onOpenFile={handleOpenFile}
          onNodeRenamed={handleNodeRenamed}
          onNodeDeleted={handleNodeDeleted}
        />
      </div>

      <div className="flex min-w-0 flex-1 flex-col">
        <TabBar
          tabs={tabs}
          activeTabId={activeTabId}
          isDirty={isDirty}
          onActivate={activateTab}
          onClose={closeTab}
          onCloseOthers={closeOthers}
          onCloseAll={closeAll}
        />

        <div className="relative flex-1">
          {!activeTab ? (
            <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-border bg-surface">
                <FileCode2 className="h-6 w-6 text-tertiary" />
              </div>
              <div>
                <p className="text-sm font-medium text-primary">No file open</p>
                <p className="mt-1 text-xs text-tertiary">Select a file from the sidebar to start editing.</p>
              </div>
            </div>
          ) : activeTab.loadError ? (
            <div className="flex h-full items-center justify-center px-6 text-center">
              <p className="text-sm text-danger">{activeTab.loadError}</p>
            </div>
          ) : activeTab.loading ? (
            <div className="flex h-full items-center justify-center">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-tertiary border-t-transparent" />
            </div>
          ) : (
            // Every open tab gets its own <KodeoMonacoEditor> mounted
            // (not just the active one) but only the active tab's is
            // visible — this is what makes the model-per-path cache in
            // monaco-editor.tsx actually pay off: switching tabs never
            // re-fetches or re-mounts Monaco, it just toggles which
            // already-live editor is on screen, so cursor/scroll/undo
            // state per file survives switching away and back within
            // the same session.
            tabs.map((tab) => (
              <div key={tab.nodeId} className="absolute inset-0" style={{ display: tab.nodeId === activeTabId ? "block" : "none" }}>
                {!tab.loading && !tab.loadError && (
                  <KodeoMonacoEditor
                    filePath={tab.path}
                    value={tab.buffer}
                    onChange={(value) => editTab(tab.nodeId, value)}
                    readOnly={!canWrite}
                  />
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
