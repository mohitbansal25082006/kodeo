// src/components/editor/search-modal.tsx
"use client";

import * as React from "react";
import { Search, FileCode2, X, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { FileSearchResult, ContentSearchMatch } from "@/lib/filesystem/search";

interface SearchModalProps {
  open: boolean;
  /** Which tab is active when the modal opens — Cmd+P opens on "files", Cmd+Shift+F opens on "content". The user can still switch tabs inside the modal either way. */
  initialMode: "files" | "content";
  workspaceId: string;
  projectId: string;
  onClose: () => void;
  onOpenFile: (nodeId: string, line?: number) => void;
}

/**
 * A single modal serving both quick-open (Cmd/Ctrl+P) and project
 * search (Cmd/Ctrl+Shift+F) rather than two separate dialogs — they
 * share the exact same shell (search input, results list, keyboard
 * navigation, close-on-escape) and users expect exactly this
 * combined experience from every IDE that has both (VS Code's
 * Ctrl+P and Ctrl+Shift+F feel like two modes of one tool, not two
 * unrelated features). Splitting them into separate components would
 * duplicate all of that shell for no benefit.
 */
export function SearchModal({ open, initialMode, workspaceId, projectId, onClose, onOpenFile }: SearchModalProps) {
  const [mode, setMode] = React.useState<"files" | "content">(initialMode);
  const [query, setQuery] = React.useState("");
  const [fileResults, setFileResults] = React.useState<FileSearchResult[]>([]);
  const [contentResults, setContentResults] = React.useState<ContentSearchMatch[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [selectedIndex, setSelectedIndex] = React.useState(0);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const debounceRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  React.useEffect(() => {
    if (open) {
      setMode(initialMode);
      setQuery("");
      setFileResults([]);
      setContentResults([]);
      setSelectedIndex(0);
      const t = setTimeout(() => inputRef.current?.focus(), 50);
      return () => clearTimeout(t);
    }
  }, [open, initialMode]);

  const runSearch = React.useCallback(
    async (term: string, searchMode: "files" | "content") => {
      if (searchMode === "files" && term.trim().length === 0) {
        setFileResults([]);
        return;
      }
      if (searchMode === "content" && term.trim().length < 2) {
        setContentResults([]);
        return;
      }

      setLoading(true);
      try {
        const res = await fetch(
          `/api/workspaces/${workspaceId}/projects/${projectId}/search?mode=${searchMode}&q=${encodeURIComponent(term)}`
        );
        const data = await res.json();
        if (searchMode === "files") setFileResults(data.files ?? []);
        else setContentResults(data.matches ?? []);
      } catch {
        // A failed search just shows an empty result set — this is a
        // lightweight, retry-by-typing-again feature, not worth a
        // dedicated error banner that would outlive the next keystroke.
        if (searchMode === "files") setFileResults([]);
        else setContentResults([]);
      } finally {
        setLoading(false);
      }
    },
    [workspaceId, projectId]
  );

  React.useEffect(() => {
    if (!open) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => runSearch(query, mode), 200);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, mode, open]);

  React.useEffect(() => {
    setSelectedIndex(0);
  }, [fileResults, contentResults]);

  const resultCount = mode === "files" ? fileResults.length : contentResults.length;

  function selectResult(index: number) {
    if (mode === "files") {
      const file = fileResults[index];
      if (file) {
        onOpenFile(file.id);
        onClose();
      }
    } else {
      const match = contentResults[index];
      if (match) {
        onOpenFile(match.nodeId, match.line);
        onClose();
      }
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Escape") {
      onClose();
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((i) => Math.min(i + 1, resultCount - 1));
      return;
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((i) => Math.max(i - 1, 0));
      return;
    }
    if (e.key === "Enter") {
      e.preventDefault();
      selectResult(selectedIndex);
      return;
    }
    if (e.key === "Tab") {
      e.preventDefault();
      setMode((m) => (m === "files" ? "content" : "files"));
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-[12vh]">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in" onClick={onClose} />
      <div className="relative flex max-h-[60vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-border bg-bg-elevated shadow-elevated animate-scale-in">
        <div className="flex items-center border-b border-border px-4 py-3">
          <Search className="h-4 w-4 shrink-0 text-tertiary" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={mode === "files" ? "Go to file..." : "Search in project files..."}
            className="ml-2.5 flex-1 bg-transparent text-sm text-primary outline-none placeholder:text-tertiary"
            autoComplete="off"
            spellCheck={false}
          />
          {loading && <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin text-tertiary" />}
          <button
            onClick={onClose}
            className="ml-2 flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-tertiary transition-colors hover:bg-surface hover:text-primary"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>

        <div className="flex gap-1 border-b border-border px-3 py-2">
          {(["files", "content"] as const).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={cn(
                "rounded-lg px-2.5 py-1 text-xs font-medium transition-colors",
                mode === m ? "bg-accent-dim/50 text-accent" : "text-tertiary hover:bg-surface hover:text-secondary"
              )}
            >
              {m === "files" ? "Files" : "In files"}
            </button>
          ))}
          <span className="ml-auto self-center text-[10px] text-tertiary">Tab to switch</span>
        </div>

        <div className="flex-1 overflow-y-auto p-1.5">
          {mode === "files" ? (
            fileResults.length === 0 ? (
              <EmptyState hasQuery={query.trim().length > 0} label="No matching files." hint="Type to search file names." />
            ) : (
              fileResults.map((file, index) => (
                <button
                  key={file.id}
                  onClick={() => selectResult(index)}
                  onMouseEnter={() => setSelectedIndex(index)}
                  className={cn(
                    "flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left transition-colors",
                    index === selectedIndex ? "bg-accent-dim/50" : "hover:bg-surface"
                  )}
                >
                  <FileCode2 className="h-3.5 w-3.5 shrink-0 text-tertiary" />
                  <div className="min-w-0 flex-1">
                    <div className={cn("truncate text-sm", index === selectedIndex ? "text-accent" : "text-primary")}>
                      {file.name}
                    </div>
                    <div className="truncate text-[11px] text-tertiary">{file.path}</div>
                  </div>
                </button>
              ))
            )
          ) : contentResults.length === 0 ? (
            <EmptyState
              hasQuery={query.trim().length > 0}
              label={query.trim().length > 0 && query.trim().length < 2 ? "Keep typing (2+ characters)..." : "No matches found."}
              hint="Search across every file's contents."
            />
          ) : (
            contentResults.map((match, index) => (
              <button
                key={`${match.nodeId}-${match.line}-${index}`}
                onClick={() => selectResult(index)}
                onMouseEnter={() => setSelectedIndex(index)}
                className={cn(
                  "flex w-full items-start gap-2.5 rounded-xl px-3 py-2 text-left transition-colors",
                  index === selectedIndex ? "bg-accent-dim/50" : "hover:bg-surface"
                )}
              >
                <FileCode2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-tertiary" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline gap-1.5">
                    <span className={cn("truncate text-sm", index === selectedIndex ? "text-accent" : "text-primary")}>
                      {match.name}
                    </span>
                    <span className="shrink-0 text-[11px] text-tertiary">:{match.line}</span>
                  </div>
                  <div className="truncate font-mono-tech text-[11px] text-secondary">{match.snippet}</div>
                </div>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function EmptyState({ hasQuery, label, hint }: { hasQuery: boolean; label: string; hint: string }) {
  return (
    <div className="px-4 py-10 text-center">
      <p className="text-xs text-tertiary">{hasQuery ? label : hint}</p>
    </div>
  );
}
