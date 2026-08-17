/**
 * Runtime shim standing in for y-monaco's broken static import of
 * "monaco-editor/esm/vs/editor/editor.api.js" — see next.config.ts's
 * top comment for the full root-cause explanation and why this file
 * exists instead of a plain webpack alias.
 *
 * y-monaco only reads three members off that namespace at runtime:
 * monaco.Range, monaco.Selection, monaco.SelectionDirection. This
 * shim re-exports those from the ALREADY-RUNNING monaco instance
 * that @monaco-editor/react's own loader (@monaco-editor/loader)
 * mounts onto `window.monaco` once Monaco finishes loading — the
 * exact same instance the visible <Editor> is built from, which is
 * what MonacoBinding needs (a second, separately-bundled copy of
 * monaco-editor would be a DIFFERENT class instance, and
 * `editor instanceof monaco.Selection`-style checks inside Monaco's
 * own code would break across the two copies — plus it would double
 * the client bundle size for no benefit).
 *
 * Reached via: y-monaco's patched import of "__kodeo_monaco_shim__"
 * (patches/y-monaco+0.1.6.patch) → aliased to this file in
 * next.config.ts's webpack.resolve.alias.
 */
function getRuntimeMonaco() {
  if (typeof window === "undefined" || !window.monaco) {
    throw new Error(
      "[monaco-editor-api-shim] window.monaco is not yet available. " +
        "This shim must only be imported after @monaco-editor/react has " +
        "finished mounting an editor (e.g. from inside use-monaco-binding.ts, " +
        "which only runs once a Monaco editor instance already exists)."
    );
  }
  return window.monaco;
}

// Getters (not eagerly-read values) so this module can be imported
// at any time — the underlying window.monaco lookup only happens
// when a consumer actually reads .Range / .Selection / etc, by which
// point Monaco is guaranteed to be loaded (y-monaco's MonacoBinding
// is only ever constructed after mount — see use-monaco-binding.ts).
export const Range = new Proxy(function () {}, {
  construct(_target, args) {
    const RealRange = getRuntimeMonaco().Range;
    return new RealRange(...args);
  },
  get(_target, prop) {
    return getRuntimeMonaco().Range[prop];
  },
});

export const Selection = new Proxy(function () {}, {
  construct(_target, args) {
    const RealSelection = getRuntimeMonaco().Selection;
    return new RealSelection(...args);
  },
  get(_target, prop) {
    return getRuntimeMonaco().Selection[prop];
  },
});

export const SelectionDirection = new Proxy(
  {},
  {
    get(_target, prop) {
      return getRuntimeMonaco().SelectionDirection[prop];
    },
  }
);
