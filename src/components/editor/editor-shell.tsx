// src/components/editor/editor-shell.tsx
"use client";

import * as React from "react";
import { FileCode2, Search, Settings2 } from "lucide-react";
import { FileExplorer } from "@/components/editor/file-explorer";
import { TabBar } from "@/components/editor/tab-bar";
import { KodeoMonacoEditor } from "@/components/editor/monaco-editor";
import { SearchModal } from "@/components/editor/search-modal";
import { PreferencesPanel } from "@/components/editor/preferences-panel";
import { SaveStatusIndicator } from "@/components/editor/save-status";
import { useTabs, type EditorTab } from "@/lib/editor/tabs-store";
import { useAutoSave } from "@/lib/editor/use-auto-save";
import { useEditorShortcuts } from "@/lib/editor/use-editor-shortcuts";
import { DEFAULT_EDITOR_PREFERENCES, type EditorPreferences } from "@/lib/editor/preferences";
import type { ProjectNodeTree } from "@/lib/filesystem/types";

interface EditorShellProps {
  workspaceId: string;
  projectId: string;
  canWrite: boolean;
}

/**
 * Part 3c's shell wires together everything the last two parts built
 * in isolation: tab/buffer state (useTabs), debounced saving
 * (useAutoSave) against Part 3a's content-PATCH endpoint, global
 * shortcuts (useEditorShortcuts), the search/quick-open modal, the
 * preferences panel, and session restoration against the
 * `editorPrefs` column Part 3a's migration reserved. Nothing below
 * this component needed to change to support any of that — the
 * seams were deliberately left ready in 3a/3b (the PATCH endpoint's
 * content-only branch, the `onSaveShortcut` prop, `editorPrefs`)
 * specifically so this part could be pure wiring, not rearchitecture.
 */
export function EditorShell({ workspaceId, projectId, canWrite }: EditorShellProps) {
  const {
    tabs,
    activeTabId,
    activeTab,
    openFile,
    activateTab,
    editTab,
    markSaved,
    clearReveal,
    closeTab,
    closeOthers,
    closeAll,
    renameTab,
    restoreTabs,
    isDirty,
    cycleTab,
  } = useTabs();

  const [preferences, setPreferences] = React.useState<EditorPreferences>(DEFAULT_EDITOR_PREFERENCES);
  const [preferencesOpen, setPreferencesOpen] = React.useState(false);
  const [searchState, setSearchState] = React.useState<{ open: boolean; mode: "files" | "content" }>({
    open: false,
    mode: "files",
  });
  const [newFileSignal, setNewFileSignal] = React.useState(0);
  const [sessionRestored, setSessionRestored] = React.useState(false);

  const nodesBaseUrl = `/api/workspaces/${workspaceId}/projects/${projectId}/nodes`;
  const sessionUrl = `/api/workspaces/${workspaceId}/projects/${projectId}/session`;

  // ── Load preferences once on mount ──────────────────────────────
  React.useEffect(() => {
    let cancelled = false;
    fetch("/api/user/editor-prefs")
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled && data.preferences) setPreferences(data.preferences);
      })
      .catch(() => {
        // Preferences failing to load just means editing continues
        // with sane defaults — not worth surfacing an error for.
      });
    return () => {
      cancelled = true;
    };
  }, []);

  function handlePreferencesChange(patch: Partial<EditorPreferences>) {
    setPreferences((prev) => {
      const next = { ...prev, ...patch };
      fetch("/api/user/editor-prefs", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      }).catch(() => {
        // A failed preferences save just means it reverts to the old
        // value next reload — the in-session UI already reflects the
        // change, and retrying silently on every keystroke of a
        // slider would be more disruptive than occasionally losing a
        // font-size tweak to a flaky connection.
      });
      return next;
    });
  }

  // ── Session restoration: reopen the tabs this user had open last
  // time, once, on mount ──────────────────────────────────────────
  React.useEffect(() => {
    let cancelled = false;

    async function restore() {
      try {
        const res = await fetch(sessionUrl);
        const data = await res.json();
        const nodeIds: string[] = data.session?.openNodeIds ?? [];
        const activeId: string | null = data.session?.activeNodeId ?? null;
        if (cancelled || nodeIds.length === 0) {
          setSessionRestored(true);
          return;
        }

        // Fetch every previously-open file's current content in
        // parallel rather than sequentially re-running the full
        // openFile flow per tab — this is a one-time bulk load on
        // mount, not the steady-state "open one file" path, so it
        // deserves its own faster route to a fully-populated tab
        // strip instead of N dispatched round-trips.
        const results = await Promise.all(
          nodeIds.map(async (nodeId) => {
            try {
              const r = await fetch(`${nodesBaseUrl}/${nodeId}`);
              if (!r.ok) return null;
              const d = await r.json();
              return d.node as { id: string; name: string; path: string; content: string };
            } catch {
              return null;
            }
          })
        );

        const restoredTabs: EditorTab[] = results
          .filter((n): n is NonNullable<typeof n> => n !== null)
          .map((n) => ({
            nodeId: n.id,
            name: n.name,
            path: n.path,
            buffer: n.content,
            savedContent: n.content,
            loading: false,
            loadError: null,
            revealLine: null,
          }));

        if (!cancelled && restoredTabs.length > 0) {
          const validActiveId = restoredTabs.some((t) => t.nodeId === activeId) ? activeId : restoredTabs[0].nodeId;
          restoreTabs(restoredTabs, validActiveId);
        }
      } finally {
        if (!cancelled) setSessionRestored(true);
      }
    }

    restore();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Persist the open-tabs set whenever it changes, after the
  // initial restore has finished (so restoration doesn't immediately
  // re-save the exact state it just loaded) ──────────────────────
  const sessionSaveTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  React.useEffect(() => {
    if (!sessionRestored) return;
    if (sessionSaveTimer.current) clearTimeout(sessionSaveTimer.current);
    sessionSaveTimer.current = setTimeout(() => {
      fetch(sessionUrl, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ openNodeIds: tabs.map((t) => t.nodeId), activeNodeId: activeTabId }),
      }).catch(() => {
        // Session bookkeeping, not user-visible content — a failed
        // write here just means the next reload starts with an
        // older tab set, which is a minor inconvenience, not data
        // loss (auto-save already covers actual file content).
      });
    }, 800);
    return () => {
      if (sessionSaveTimer.current) clearTimeout(sessionSaveTimer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tabs.map((t) => t.nodeId).join(","), activeTabId, sessionRestored]);

  // ── Auto-save ────────────────────────────────────────────────────
  const { scheduleSave, flush, getStatus, getError } = useAutoSave({
    delayMs: preferences.autoSaveDelayMs,
    onSave: async (nodeId, content) => {
      const res = await fetch(`${nodesBaseUrl}/${nodeId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        return { error: data.error || "Couldn't save this file." };
      }
      return {};
    },
    onSaved: (nodeId, content) => markSaved(nodeId, content),
  });

  function handleBufferChange(tab: EditorTab, value: string) {
    editTab(tab.nodeId, value);
    scheduleSave(tab.nodeId, value);
  }

  function handleSaveActive() {
    if (activeTab) flush(activeTab.nodeId, activeTab.buffer);
  }

  // ── Opening files (from the explorer or from search results) ────
  async function handleOpenFile(node: ProjectNodeTree, revealLine: number | null = null) {
    await openFile(
      node,
      async () => {
        try {
          const res = await fetch(`${nodesBaseUrl}/${node.id}`);
          const data = await res.json();
          if (!res.ok) return { error: data.error || "Couldn't load this file." };
          return { content: data.node.content as string };
        } catch {
          return { error: "Couldn't load this file. Check your connection." };
        }
      },
      revealLine
    );
  }

  function handleOpenFromSearch(nodeId: string, line?: number) {
    const existingTab = tabs.find((t) => t.nodeId === nodeId);
    if (existingTab) {
      // Already open — just switch to it and ask Monaco to scroll to
      // the matched line, via the same revealLine mechanism a fresh
      // open uses (tabs-store.ts's ACTIVATE action accepts one too,
      // for exactly this "jump within an already-open file" case).
      activateTab(nodeId, line ?? null);
      return;
    }
    // We only have an id from search results, not a full
    // ProjectNodeTree — a minimal shape is enough since openFile only
    // reads id/name/path, and the name/path are cosmetic until the
    // fetch resolves and OPEN_SUCCESS fills in real content.
    handleOpenFile({ id: nodeId, name: "", path: "", type: "file", children: [] } as unknown as ProjectNodeTree, line ?? null);
  }

  function handleNodeRenamed(nodeId: string, name: string, path: string) {
    if (tabs.some((t) => t.nodeId === nodeId)) renameTab(nodeId, name, path);
  }

  function handleNodeDeleted(nodeId: string) {
    if (tabs.some((t) => t.nodeId === nodeId)) closeTab(nodeId);
  }

  // ── Keyboard shortcuts ───────────────────────────────────────────
  useEditorShortcuts(
    {
      onSave: handleSaveActive,
      onQuickOpen: () => setSearchState({ open: true, mode: "files" }),
      onProjectSearch: () => setSearchState({ open: true, mode: "content" }),
      onCloseTab: () => activeTabId && closeTab(activeTabId),
      onNextTab: () => cycleTab(1),
      onPrevTab: () => cycleTab(-1),
      onNewFile: () => setNewFileSignal((n) => n + 1),
    },
    true
  );

  const activeSaveStatus = activeTab ? getStatus(activeTab.nodeId) : "idle";
  const activeSaveError = activeTab ? getError(activeTab.nodeId) : null;

  return (
    <div className="flex h-[calc(100vh-13rem)] min-h-[480px] overflow-hidden rounded-2xl border border-border bg-bg-elevated">
      <div className="w-64 shrink-0 border-r border-border">
        <FileExplorer
          workspaceId={workspaceId}
          projectId={projectId}
          canWrite={canWrite}
          activeNodeId={activeTabId}
          onOpenFile={(node) => handleOpenFile(node)}
          onNodeRenamed={handleNodeRenamed}
          onNodeDeleted={handleNodeDeleted}
          requestNewFileSignal={newFileSignal}
        />
      </div>

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-stretch border-b border-border">
          <div className="min-w-0 flex-1">
            <TabBar
              tabs={tabs}
              activeTabId={activeTabId}
              isDirty={isDirty}
              onActivate={activateTab}
              onClose={(nodeId) => {
                const tab = tabs.find((t) => t.nodeId === nodeId);
                if (tab && isDirty(nodeId)) flush(nodeId, tab.buffer);
                closeTab(nodeId);
              }}
              onCloseOthers={closeOthers}
              onCloseAll={closeAll}
            />
          </div>
          <div className="flex shrink-0 items-center gap-1 px-2">
            <button
              onClick={() => setSearchState({ open: true, mode: "files" })}
              className="flex h-7 w-7 items-center justify-center rounded-lg text-tertiary transition-colors hover:bg-surface hover:text-primary"
              aria-label="Search project"
              title="Search (Cmd/Ctrl+P)"
            >
              <Search className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => setPreferencesOpen(true)}
              className="flex h-7 w-7 items-center justify-center rounded-lg text-tertiary transition-colors hover:bg-surface hover:text-primary"
              aria-label="Editor preferences"
              title="Editor preferences"
            >
              <Settings2 className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        <div className="relative flex-1">
          {!activeTab ? (
            <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-border bg-surface">
                <FileCode2 className="h-6 w-6 text-tertiary" />
              </div>
              <div>
                <p className="text-sm font-medium text-primary">No file open</p>
                <p className="mt-1 text-xs text-tertiary">
                  Select a file, or press <kbd className="rounded border border-border bg-surface px-1 py-0.5 font-mono-tech text-[10px]">⌘P</kbd> to search.
                </p>
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
            // state per file survives switching away and back.
            tabs.map((tab) => (
              <div key={tab.nodeId} className="absolute inset-0" style={{ display: tab.nodeId === activeTabId ? "block" : "none" }}>
                {!tab.loading && !tab.loadError && (
                  <KodeoMonacoEditor
                    filePath={tab.path}
                    value={tab.buffer}
                    onChange={(value) => handleBufferChange(tab, value)}
                    readOnly={!canWrite}
                    preferences={preferences}
                    onSaveShortcut={handleSaveActive}
                    revealLine={tab.revealLine}
                    onRevealHandled={() => clearReveal(tab.nodeId)}
                  />
                )}
              </div>
            ))
          )}
        </div>

        <div className="flex items-center justify-between border-t border-border px-3 py-1.5">
          <span className="truncate font-mono-tech text-[11px] text-tertiary">{activeTab?.path ?? ""}</span>
          <SaveStatusIndicator status={activeSaveStatus} error={activeSaveError} />
        </div>
      </div>

      <SearchModal
        open={searchState.open}
        initialMode={searchState.mode}
        workspaceId={workspaceId}
        projectId={projectId}
        onClose={() => setSearchState((s) => ({ ...s, open: false }))}
        onOpenFile={handleOpenFromSearch}
      />

      <PreferencesPanel
        open={preferencesOpen}
        preferences={preferences}
        onClose={() => setPreferencesOpen(false)}
        onChange={handlePreferencesChange}
      />
    </div>
  );
}
