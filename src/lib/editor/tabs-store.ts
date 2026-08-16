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
  /** The last value confirmed saved to the server. Comparing buffer !== savedContent is what drives the dirty dot; Part 3c's auto-save updates this on a successful PATCH. */
  savedContent: string;
  loading: boolean;
  loadError: string | null;
}

export interface TabsState {
  tabs: EditorTab[];
  activeTabId: string | null;
}

type Action =
  | { type: "OPEN_START"; nodeId: string; name: string; path: string }
  | { type: "OPEN_SUCCESS"; nodeId: string; content: string }
  | { type: "OPEN_ERROR"; nodeId: string; error: string }
  | { type: "ACTIVATE"; nodeId: string }
  | { type: "EDIT"; nodeId: string; buffer: string }
  | { type: "MARK_SAVED"; nodeId: string; content: string }
  | { type: "CLOSE"; nodeId: string }
  | { type: "CLOSE_OTHERS"; nodeId: string }
  | { type: "CLOSE_ALL" }
  | { type: "RENAME"; nodeId: string; name: string; path: string };

function reducer(state: TabsState, action: Action): TabsState {
  switch (action.type) {
    case "OPEN_START": {
      const existing = state.tabs.find((t) => t.nodeId === action.nodeId);
      if (existing) {
        return { tabs: state.tabs, activeTabId: action.nodeId };
      }
      const newTab: EditorTab = {
        nodeId: action.nodeId,
        name: action.name,
        path: action.path,
        buffer: "",
        savedContent: "",
        loading: true,
        loadError: null,
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
      return { ...state, activeTabId: action.nodeId };
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
    default:
      return state;
  }
}

/**
 * Owns which files are open as tabs, which one is active, and each
 * tab's in-memory buffer vs. last-saved content. Deliberately holds
 * no persistence of its own — Part 3c's auto-save writes buffers back
 * to the server, and restoring which tabs were open across reloads
 * (via the `editorPrefs` column reserved in Part 3a's migration) is
 * also 3c's concern. This hook is the single source of truth the
 * tab bar and the Monaco pane both read from, so they never disagree
 * about what's open or what's dirty.
 */
export function useTabs() {
  const [state, dispatch] = React.useReducer(reducer, { tabs: [], activeTabId: null });

  const openFile = React.useCallback(
    async (node: Pick<ProjectNodeTree, "id" | "name" | "path">, fetchContent: () => Promise<{ content?: string; error?: string }>) => {
      dispatch({ type: "OPEN_START", nodeId: node.id, name: node.name, path: node.path });
      const result = await fetchContent();
      if (result.error) {
        dispatch({ type: "OPEN_ERROR", nodeId: node.id, error: result.error });
      } else {
        dispatch({ type: "OPEN_SUCCESS", nodeId: node.id, content: result.content ?? "" });
      }
    },
    []
  );

  const activateTab = React.useCallback((nodeId: string) => dispatch({ type: "ACTIVATE", nodeId }), []);
  const editTab = React.useCallback((nodeId: string, buffer: string) => dispatch({ type: "EDIT", nodeId, buffer }), []);
  const markSaved = React.useCallback((nodeId: string, content: string) => dispatch({ type: "MARK_SAVED", nodeId, content }), []);
  const closeTab = React.useCallback((nodeId: string) => dispatch({ type: "CLOSE", nodeId }), []);
  const closeOthers = React.useCallback((nodeId: string) => dispatch({ type: "CLOSE_OTHERS", nodeId }), []);
  const closeAll = React.useCallback(() => dispatch({ type: "CLOSE_ALL" }), []);
  const renameTab = React.useCallback(
    (nodeId: string, name: string, path: string) => dispatch({ type: "RENAME", nodeId, name, path }),
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

  return {
    tabs: state.tabs,
    activeTabId: state.activeTabId,
    activeTab,
    openFile,
    activateTab,
    editTab,
    markSaved,
    closeTab,
    closeOthers,
    closeAll,
    renameTab,
    isDirty,
  };
}

export type UseTabsReturn = ReturnType<typeof useTabs>;
