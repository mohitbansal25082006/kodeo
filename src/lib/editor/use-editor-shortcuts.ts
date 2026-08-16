// src/lib/editor/use-editor-shortcuts.ts
"use client";

import * as React from "react";

interface EditorShortcutHandlers {
  onSave: () => void;
  onQuickOpen: () => void;
  onProjectSearch: () => void;
  onCloseTab: () => void;
  onNextTab: () => void;
  onPrevTab: () => void;
  onNewFile: () => void;
}

function isMac() {
  if (typeof navigator === "undefined") return false;
  return /Mac|iPod|iPhone|iPad/.test(navigator.platform);
}

/**
 * Registers shortcuts at the document level rather than inside
 * Monaco, because several of them (quick-open, project search,
 * next/prev tab) need to work no matter where focus currently is —
 * including when focus is in the file explorer or nowhere in
 * particular — not just while the cursor happens to be inside the
 * active editor pane. Monaco's own addCommand (used in Part 3b for
 * the in-editor Cmd/Ctrl+S) still owns shortcuts that only make sense
 * while actively typing; this hook is the layer above that.
 *
 * Mirrors VS Code's own bindings so they feel familiar:
 *   Cmd/Ctrl+S       save the active file
 *   Cmd/Ctrl+P       quick-open (fuzzy filename search)
 *   Cmd/Ctrl+Shift+F project-wide content search
 *   Cmd/Ctrl+W       close the active tab
 *   Cmd/Ctrl+Alt+Right / Ctrl+Tab       next tab
 *   Cmd/Ctrl+Alt+Left / Ctrl+Shift+Tab  previous tab
 *   Cmd/Ctrl+N       new file (at the project root)
 */
export function useEditorShortcuts(handlers: EditorShortcutHandlers, enabled: boolean) {
  const handlersRef = React.useRef(handlers);
  handlersRef.current = handlers;

  React.useEffect(() => {
    if (!enabled) return;

    function onKeyDown(e: KeyboardEvent) {
      const mod = isMac() ? e.metaKey : e.ctrlKey;
      if (!mod) return;

      const key = e.key.toLowerCase();

      if (key === "s") {
        e.preventDefault();
        handlersRef.current.onSave();
        return;
      }

      if (key === "p" && !e.shiftKey) {
        e.preventDefault();
        handlersRef.current.onQuickOpen();
        return;
      }

      if ((key === "f" && e.shiftKey) || (key === "p" && e.shiftKey)) {
        e.preventDefault();
        handlersRef.current.onProjectSearch();
        return;
      }

      if (key === "w") {
        e.preventDefault();
        handlersRef.current.onCloseTab();
        return;
      }

      if (key === "n" && !e.shiftKey) {
        e.preventDefault();
        handlersRef.current.onNewFile();
        return;
      }

      if (key === "tab") {
        e.preventDefault();
        if (e.shiftKey) handlersRef.current.onPrevTab();
        else handlersRef.current.onNextTab();
        return;
      }

      if (e.altKey && key === "arrowright") {
        e.preventDefault();
        handlersRef.current.onNextTab();
        return;
      }
      if (e.altKey && key === "arrowleft") {
        e.preventDefault();
        handlersRef.current.onPrevTab();
        return;
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [enabled]);
}
