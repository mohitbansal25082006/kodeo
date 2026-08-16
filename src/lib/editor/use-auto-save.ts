// src/lib/editor/use-auto-save.ts
"use client";

import * as React from "react";

export type SaveStatus = "idle" | "saving" | "saved" | "error";

interface UseAutoSaveOptions {
  /** Debounce delay in ms. 0 disables the debounced path entirely — only explicit flush() calls (Cmd/Ctrl+S) save. */
  delayMs: number;
  onSave: (nodeId: string, content: string) => Promise<{ error?: string }>;
  onSaved?: (nodeId: string, content: string) => void;
}

/**
 * One auto-save controller shared across every open tab, keyed by
 * nodeId — a single instance rather than one hook call per tab,
 * because tabs come and go dynamically and hooks can't be called
 * conditionally per array item. Each nodeId gets its own debounce
 * timer so editing one file doesn't reset or interfere with a
 * pending save on another; switching tabs never cancels an in-flight
 * save on the tab you switched away from.
 */
export function useAutoSave({ delayMs, onSave, onSaved }: UseAutoSaveOptions) {
  const timers = React.useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());
  const [statusByNode, setStatusByNode] = React.useState<Map<string, SaveStatus>>(new Map());
  const [errorByNode, setErrorByNode] = React.useState<Map<string, string>>(new Map());

  // Always-current refs so the debounced callback fires with the
  // latest onSave/onSaved without needing to be re-created (and thus
  // re-debounced) every time a parent re-render passes new function
  // identities.
  const onSaveRef = React.useRef(onSave);
  onSaveRef.current = onSave;
  const onSavedRef = React.useRef(onSaved);
  onSavedRef.current = onSaved;

  function setStatus(nodeId: string, status: SaveStatus) {
    setStatusByNode((prev) => {
      const next = new Map(prev);
      next.set(nodeId, status);
      return next;
    });
  }

  const performSave = React.useCallback(async (nodeId: string, content: string) => {
    setStatus(nodeId, "saving");
    const result = await onSaveRef.current(nodeId, content);
    if (result.error) {
      setStatus(nodeId, "error");
      setErrorByNode((prev) => {
        const next = new Map(prev);
        next.set(nodeId, result.error!);
        return next;
      });
      return;
    }
    setErrorByNode((prev) => {
      if (!prev.has(nodeId)) return prev;
      const next = new Map(prev);
      next.delete(nodeId);
      return next;
    });
    setStatus(nodeId, "saved");
    onSavedRef.current?.(nodeId, content);
  }, []);

  /** Called on every buffer change. Resets that file's debounce timer; does nothing if auto-save is off (delayMs === 0), leaving saves entirely to explicit flush() calls. */
  const scheduleSave = React.useCallback(
    (nodeId: string, content: string) => {
      const existing = timers.current.get(nodeId);
      if (existing) clearTimeout(existing);

      if (delayMs <= 0) return;

      setStatus(nodeId, "idle");
      const timer = setTimeout(() => {
        timers.current.delete(nodeId);
        performSave(nodeId, content);
      }, delayMs);
      timers.current.set(nodeId, timer);
    },
    [delayMs, performSave]
  );

  /** Cancels any pending debounce and saves immediately — what Cmd/Ctrl+S calls, and what a tab close / navigate-away should call so nothing is silently lost. */
  const flush = React.useCallback(
    (nodeId: string, content: string) => {
      const existing = timers.current.get(nodeId);
      if (existing) {
        clearTimeout(existing);
        timers.current.delete(nodeId);
      }
      return performSave(nodeId, content);
    },
    [performSave]
  );

  // Cleanup: clear every pending timer on unmount so a save doesn't
  // fire (and call setState) after the component tree is gone.
  React.useEffect(() => {
    const timersMap = timers.current;
    return () => {
      timersMap.forEach((t) => clearTimeout(t));
      timersMap.clear();
    };
  }, []);

  const getStatus = React.useCallback((nodeId: string): SaveStatus => statusByNode.get(nodeId) ?? "idle", [statusByNode]);
  const getError = React.useCallback((nodeId: string): string | null => errorByNode.get(nodeId) ?? null, [errorByNode]);

  return { scheduleSave, flush, getStatus, getError };
}

export type UseAutoSaveReturn = ReturnType<typeof useAutoSave>;
