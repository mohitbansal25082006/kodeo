// src/lib/editor/tabs-store.ts
"use client";

import * as React from "react";
import type { ProjectNodeTree } from "@/lib/filesystem/types";

export interface EditorTab {
  nodeId: string;
  name: string;
  path: string;
  /** The file's contents as currently held in the editor buffer — starts as the server value, diverges once the user types. */
  buffer: string;
  /** The last value confirmed saved to the server. Comparing buffer !== savedContent is what drives the dirty dot; auto-save (use-auto-save.ts) updates this on a successful PATCH. */
  savedContent: string;
  loading: boolean;
  loadError: string | null;
  /** 1-based line to scroll to next time this tab is rendered — set when opened from a search-result click, cleared immediately after monaco-editor.tsx consumes it so it doesn't re-trigger on every re-render or on a later plain tab-switch. */
  revealLine: number | null;
}

export interface TabsState {
  tabs: EditorTab[];
  activeTabId: string | null;
}

type Action =
  | { type: "OPEN_START"; nodeId: string; name: string; path: string; revealLine: number | null }
  | { type: "OPEN_SUCCESS"; nodeId: string; content: string }
  | { type: "OPEN_ERROR"; nodeId: string; error: string }
  | { type: "ACTIVATE"; nodeId: string; revealLine?: number | null }
  | { type: "EDIT"; nodeId: string; buffer: string }
  | { type: "MARK_SAVED"; nodeId: string; content: string }
  | { type: "CLEAR_REVEAL"; nodeId: string }
  | { type: "CLOSE"; nodeId: string }
  | { type: "CLOSE_OTHERS"; nodeId: string }
  | { type: "CLOSE_ALL" }
  | { type: "RENAME"; nodeId: string; name: string; path: string }
  | { type: "RESTORE"; tabs: EditorTab[]; activeTabId: string | null };

function reducer(state: TabsState, action: Action): TabsState {
  switch (action.type) {
    case "OPEN_START": {
      const existing = state.tabs.find((t) => t.nodeId === action.nodeId);
      if (existing) {
        return {
          tabs: state.tabs.map((t) => (t.nodeId === action.nodeId ? { ...t, revealLine: action.revealLine ?? t.revealLine } : t)),
          activeTabId: action.nodeId,
        };
      }
      const newTab: EditorTab = {
        nodeId: action.nodeId,
        name: action.name,
        path: action.path,
        buffer: "",
        savedContent: "",
        loading: true,
        loadError: null,
        revealLine: action.revealLine,
      };
      return { tabs: [...state.tabs, newTab], activeTabId: action.nodeId };
    }
    case "OPEN_SUCCESS": {
      return {
        ...state,
        tabs: state.tabs.map((t) =>
          t.nodeId === action.nodeId
            ? { ...t, buffer: action.content, savedContent: action.content, loading: false, loadError: null }
            : t
        ),
      };
    }
    case "OPEN_ERROR": {
      return {
        ...state,
        tabs: state.tabs.map((t) => (t.nodeId === action.nodeId ? { ...t, loading: false, loadError: action.error } : t)),
      };
    }
    case "ACTIVATE": {
      if (!state.tabs.some((t) => t.nodeId === action.nodeId)) return state;
      return {
        ...state,
        activeTabId: action.nodeId,
        tabs:
          action.revealLine !== undefined
            ? state.tabs.map((t) => (t.nodeId === action.nodeId ? { ...t, revealLine: action.revealLine ?? null } : t))
            : state.tabs,
      };
    }
    case "EDIT": {
      return {
        ...state,
        tabs: state.tabs.map((t) => (t.nodeId === action.nodeId ? { ...t, buffer: action.buffer } : t)),
      };
    }
    case "MARK_SAVED": {
      return {
        ...state,
        tabs: state.tabs.map((t) => (t.nodeId === action.nodeId ? { ...t, savedContent: action.content } : t)),
      };
    }
    case "CLEAR_REVEAL": {
      return {
        ...state,
        tabs: state.tabs.map((t) => (t.nodeId === action.nodeId ? { ...t, revealLine: null } : t)),
      };
    }
    case "CLOSE": {
      const remaining = state.tabs.filter((t) => t.nodeId !== action.nodeId);
      let activeTabId = state.activeTabId;
      if (activeTabId === action.nodeId) {
        const closedIndex = state.tabs.findIndex((t) => t.nodeId === action.nodeId);
        // Activate the tab that was to the right, or failing that the new last tab — matches the convention set by every major code editor and browser tab strip.
        activeTabId = remaining[closedIndex]?.nodeId ?? remaining[remaining.length - 1]?.nodeId ?? null;
      }
      return { tabs: remaining, activeTabId };
    }
    case "CLOSE_OTHERS": {
      const kept = state.tabs.filter((t) => t.nodeId === action.nodeId);
      return { tabs: kept, activeTabId: action.nodeId };
    }
    case "CLOSE_ALL": {
      return { tabs: [], activeTabId: null };
    }
    case "RENAME": {
      return {
        ...state,
        tabs: state.tabs.map((t) => (t.nodeId === action.nodeId ? { ...t, name: action.name, path: action.path } : t)),
      };
    }
    case "RESTORE": {
      // Only used once, right after a project's session loads — see
      // useTabs' restoreSession below. Overwrites any tabs opened in
      // the brief window before restoration finished (there
      // shouldn't be any in practice, since the shell calls this
      // before rendering the explorer, but the overwrite is safe and
      // simple either way).
      return { tabs: action.tabs, activeTabId: action.activeTabId };
    }
    default:
      return state;
  }
}

/**
 * Owns which files are open as tabs, which one is active, each tab's
 * in-memory buffer vs. last-saved content, and (new in Part 3c) which
 * line to scroll to when a tab opens from a search result. Session
 * persistence (restoring which tabs were open on reload) and
 * auto-save (writing buffers back to the server) both live outside
 * this hook — in editor-shell.tsx and use-auto-save.ts respectively —
 * this hook is the single in-memory source of truth they both read
 * from and write to, so the tab bar, the Monaco pane, and the
 * session-persistence effect never disagree about what's open.
 */
export function useTabs() {
  const [state, dispatch] = React.useReducer(reducer, { tabs: [], activeTabId: null });

  const openFile = React.useCallback(
    async (
      node: Pick<ProjectNodeTree, "id" | "name" | "path">,
      fetchContent: () => Promise<{ content?: string; error?: string }>,
      revealLine: number | null = null
    ) => {
      dispatch({ type: "OPEN_START", nodeId: node.id, name: node.name, path: node.path, revealLine });
      const result = await fetchContent();
      if (result.error) {
        dispatch({ type: "OPEN_ERROR", nodeId: node.id, error: result.error });
      } else {
        dispatch({ type: "OPEN_SUCCESS", nodeId: node.id, content: result.content ?? "" });
      }
    },
    []
  );

  const activateTab = React.useCallback(
    (nodeId: string, revealLine?: number | null) => dispatch({ type: "ACTIVATE", nodeId, revealLine }),
    []
  );
  const editTab = React.useCallback((nodeId: string, buffer: string) => dispatch({ type: "EDIT", nodeId, buffer }), []);
  const markSaved = React.useCallback((nodeId: string, content: string) => dispatch({ type: "MARK_SAVED", nodeId, content }), []);
  const clearReveal = React.useCallback((nodeId: string) => dispatch({ type: "CLEAR_REVEAL", nodeId }), []);
  const closeTab = React.useCallback((nodeId: string) => dispatch({ type: "CLOSE", nodeId }), []);
  const closeOthers = React.useCallback((nodeId: string) => dispatch({ type: "CLOSE_OTHERS", nodeId }), []);
  const closeAll = React.useCallback(() => dispatch({ type: "CLOSE_ALL" }), []);
  const renameTab = React.useCallback(
    (nodeId: string, name: string, path: string) => dispatch({ type: "RENAME", nodeId, name, path }),
    []
  );
  const restoreTabs = React.useCallback(
    (tabs: EditorTab[], activeTabId: string | null) => dispatch({ type: "RESTORE", tabs, activeTabId }),
    []
  );

  const activeTab = state.tabs.find((t) => t.nodeId === state.activeTabId) ?? null;
  const isDirty = React.useCallback(
    (nodeId: string) => {
      const tab = state.tabs.find((t) => t.nodeId === nodeId);
      return tab ? tab.buffer !== tab.savedContent : false;
    },
    [state.tabs]
  );

  /** Cycles to the next/previous tab in strip order, wrapping around — powers Cmd/Ctrl+Tab and Cmd/Ctrl+Alt+Arrow from use-editor-shortcuts.ts. No-op with 0 or 1 tabs open. */
  const cycleTab = React.useCallback(
    (direction: 1 | -1) => {
      if (state.tabs.length < 2) return;
      const currentIndex = state.tabs.findIndex((t) => t.nodeId === state.activeTabId);
      const nextIndex = (currentIndex + direction + state.tabs.length) % state.tabs.length;
      dispatch({ type: "ACTIVATE", nodeId: state.tabs[nextIndex].nodeId });
    },
    [state.tabs, state.activeTabId]
  );

  return {
    tabs: state.tabs,
    activeTabId: state.activeTabId,
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
  };
}

export type UseTabsReturn = ReturnType<typeof useTabs>;
