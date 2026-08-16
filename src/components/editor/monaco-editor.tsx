// src/components/editor/monaco-editor.tsx
"use client";

import * as React from "react";
import dynamic from "next/dynamic";
import type { OnMount, OnChange, BeforeMount } from "@monaco-editor/react";
import { Loader2 } from "lucide-react";
import { KODEO_DARK_THEME, KODEO_MONACO_THEME_ID } from "@/lib/editor/monaco-theme";
import { getLanguageForFile } from "@/lib/filesystem/types";
import { DEFAULT_EDITOR_PREFERENCES, type EditorPreferences } from "@/lib/editor/preferences";

/**
 * Monaco only runs in the browser (it reaches for `window`/`navigator`
 * at import time to spin up its web workers), so it must never be
 * part of the server-rendered bundle. `ssr: false` is the documented,
 * standard fix — see @monaco-editor/react's own guidance and every
 * Next.js App Router integration guide for it.
 */
const MonacoEditor = dynamic(() => import("@monaco-editor/react").then((m) => m.default), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center">
      <Loader2 className="h-5 w-5 animate-spin text-tertiary" />
    </div>
  ),
});

interface KodeoMonacoEditorProps {
  /** The file's project-relative path, e.g. "src/lib/utils.ts" — passed straight through as Monaco's `path` prop. */
  filePath: string;
  value: string;
  onChange: (value: string) => void;
  readOnly?: boolean;
  preferences?: EditorPreferences;
  /** Fired on Cmd/Ctrl+S while the editor has focus. The document-level shortcut in use-editor-shortcuts.ts handles Cmd/Ctrl+S everywhere else; this one covers the case where Monaco itself would otherwise eat the keystroke before it bubbles up. */
  onSaveShortcut?: () => void;
  /** 1-based line number to scroll to and highlight on mount/update — set when the pane opens as the result of a search-result click (search-modal.tsx). Consumed once; onRevealHandled tells the parent to clear it so it doesn't re-trigger on a later plain tab-switch. */
  revealLine?: number | null;
  /** Called immediately after a non-null revealLine has been acted on — the parent (editor-shell.tsx) uses this to clear the tab's revealLine in the tabs store. */
  onRevealHandled?: () => void;
}

/**
 * Thin wrapper around @monaco-editor/react's <Editor>. The `path`
 * prop is what makes multi-tab editing work correctly: Monaco creates
 * (and caches) one text model per unique path, and each model tracks
 * its own undo/redo stack, cursor position, and scroll offset
 * independently. Switching tabs by changing `path` on the same
 * mounted <Editor> reuses that file's existing model instead of
 * recreating it — so undo history and cursor position survive
 * switching away and back, exactly like a real IDE. Swapping a single
 * controlled `value` on tab change (the naive approach) would lose
 * all of that on every switch.
 */
export function KodeoMonacoEditor({
  filePath,
  value,
  onChange,
  readOnly = false,
  preferences = DEFAULT_EDITOR_PREFERENCES,
  onSaveShortcut,
  revealLine,
  onRevealHandled,
}: KodeoMonacoEditorProps) {
  const onSaveShortcutRef = React.useRef(onSaveShortcut);
  onSaveShortcutRef.current = onSaveShortcut;
  const onRevealHandledRef = React.useRef(onRevealHandled);
  onRevealHandledRef.current = onRevealHandled;
  const editorRef = React.useRef<Parameters<OnMount>[0] | null>(null);

  const handleBeforeMount: BeforeMount = (monaco) => {
    monaco.editor.defineTheme(KODEO_MONACO_THEME_ID, KODEO_DARK_THEME);
  };

  const handleMount: OnMount = (editor, monaco) => {
    editorRef.current = editor;

    // Cmd/Ctrl+S inside the editor is intercepted here rather than
    // only relying on the document-level listener, so Monaco's own
    // keybinding system (which already owns every other Ctrl/Cmd
    // shortcut inside the editor, e.g. Ctrl+F for in-file find) is
    // the single source of truth for what a keypress does while
    // typing, and the save reliably fires even if something inside
    // Monaco would otherwise have swallowed the event first.
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
      onSaveShortcutRef.current?.();
    });

    if (revealLine) {
      editor.revealLineInCenter(revealLine);
      editor.setPosition({ lineNumber: revealLine, column: 1 });
      editor.focus();
      onRevealHandledRef.current?.();
    }
  };

  const handleChange: OnChange = (newValue) => {
    onChange(newValue ?? "");
  };

  // Jump to a new line when revealLine changes on an already-mounted
  // editor (e.g. clicking a second search result for a file that's
  // already open) — handleMount only covers the initial mount.
  React.useEffect(() => {
    if (revealLine && editorRef.current) {
      editorRef.current.revealLineInCenter(revealLine);
      editorRef.current.setPosition({ lineNumber: revealLine, column: 1 });
      editorRef.current.focus();
      onRevealHandledRef.current?.();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [revealLine]);

  return (
    <MonacoEditor
      key={filePath /* forces a clean remount if the path itself changes identity in a way Monaco's internal diffing wouldn't catch, e.g. after a rename swaps which model backs this pane */}
      path={filePath}
      language={getLanguageForFile(filePath)}
      value={value}
      theme={KODEO_MONACO_THEME_ID}
      beforeMount={handleBeforeMount}
      onMount={handleMount}
      onChange={handleChange}
      options={{
        readOnly,
        fontSize: preferences.fontSize,
        tabSize: preferences.tabSize,
        wordWrap: preferences.wordWrap ? "on" : "off",
        minimap: { enabled: preferences.minimap },
        fontFamily: "var(--font-mono), ui-monospace, monospace",
        fontLigatures: true,
        automaticLayout: true,
        scrollBeyondLastLine: false,
        smoothScrolling: true,
        cursorBlinking: "smooth",
        cursorSmoothCaretAnimation: "on",
        padding: { top: 12, bottom: 12 },
        renderLineHighlight: "line",
        occurrencesHighlight: "singleFile",
        bracketPairColorization: { enabled: true },
        guides: { indentation: true, bracketPairs: false },
        scrollbar: { verticalScrollbarSize: 10, horizontalScrollbarSize: 10 },
      }}
    />
  );
}
