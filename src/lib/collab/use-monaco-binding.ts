"use client";

import * as React from "react";
import type { editor as MonacoEditorNS } from "monaco-editor";
import { MonacoBinding } from "y-monaco";
import type { CollabProvider } from "@/lib/collab/collab-provider";

/**
 * Owns the lifecycle of exactly one `y-monaco` `MonacoBinding` — the
 * object that keeps a Monaco text model and a Yjs `Y.Text` in sync in
 * both directions (local keystrokes → Yjs updates; remote Yjs updates
 * → Monaco model edits, including remote cursor/selection decorations
 * via the shared `awareness` instance).
 *
 * Bound once per (Monaco editor instance, CollabProvider) pair.
 * Rebinding needs to happen if either the underlying Monaco model or
 * the provider changes identity — both are covered by this hook's
 * dependency array, mirroring the `key={filePath}` remount behavior
 * `monaco-editor.tsx` already forces on the outer <Editor> so a
 * MonacoBinding is never left attached to a stale, disposed model.
 *
 * Deliberately a separate hook (not inlined into monaco-editor.tsx's
 * onMount) so its cleanup ordering is explicit and testable in
 * isolation: MonacoBinding must be destroyed BEFORE the Monaco editor
 * instance itself is disposed, or it can throw while trying to
 * unregister listeners from an already-torn-down model.
 */
export function useMonacoBinding(
  editorInstance: MonacoEditorNS.IStandaloneCodeEditor | null,
  provider: CollabProvider | null,
  readOnly: boolean
): void {
  React.useEffect(() => {
    if (!editorInstance || !provider) return;

    const model = editorInstance.getModel();
    if (!model) return;

    // "monaco" is the shared Y.Text name — must match the server's
    // hydration call exactly (see ws-server's room.ts:
    // `this.doc.getText("monaco")`), since a Y.Doc can hold multiple
    // named shared types and both ends need to agree on which one
    // represents this file's text.
    const yText = provider.doc.getText("monaco");

    const binding = new MonacoBinding(
      yText,
      model,
      new Set([editorInstance]),
      provider.awareness
    );

    return () => {
      binding.destroy();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editorInstance, provider]);

  // readOnly is enforced independently of the binding itself —
  // MonacoBinding doesn't take a readOnly flag; the server already
  // refuses to apply content-changing sync messages from a read-only
  // connection (see ws-server's room.ts handleMessage), but setting
  // Monaco's own readOnly option too means a viewer's local keystrokes
  // never even reach the binding in the first place, which is both
  // better UX (no local edit that then silently reverts) and defense
  // in depth.
  React.useEffect(() => {
    if (!editorInstance) return;
    editorInstance.updateOptions({ readOnly });
  }, [editorInstance, readOnly]);
}
