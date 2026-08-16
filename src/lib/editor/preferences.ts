// src/lib/editor/preferences.ts

/**
 * Everything about how the editor looks/behaves for one user, stored
 * in the `editorPrefs` JSONB column Part 3a's migration reserved on
 * `user`. Deliberately global-per-user (not per-project) — matches
 * how every real IDE's editor settings work (VS Code's font size
 * isn't per-workspace either), and keeps this to one row instead of
 * needing a `user_id + project_id` preferences table for a feature
 * that's genuinely about "how I like my editor to look."
 */
export interface EditorPreferences {
  fontSize: number;
  tabSize: number;
  wordWrap: boolean;
  minimap: boolean;
  /** Debounced auto-save interval, in milliseconds. 0 disables auto-save entirely — Cmd/Ctrl+S still works when disabled. */
  autoSaveDelayMs: number;
}

export const DEFAULT_EDITOR_PREFERENCES: EditorPreferences = {
  fontSize: 13,
  tabSize: 2,
  wordWrap: true,
  minimap: false,
  autoSaveDelayMs: 1000,
};

export const FONT_SIZE_MIN = 10;
export const FONT_SIZE_MAX = 24;
export const TAB_SIZE_OPTIONS = [2, 4, 8] as const;
export const AUTO_SAVE_DELAY_OPTIONS = [
  { label: "Off", value: 0 },
  { label: "Fast (500ms)", value: 500 },
  { label: "Normal (1s)", value: 1000 },
  { label: "Slow (3s)", value: 3000 },
] as const;

/**
 * Clamps/coerces an arbitrary JSON value (what comes back from the
 * DB, or from a possibly-stale localStorage-free client) into a
 * well-formed EditorPreferences — every field independently falls
 * back to its default rather than the whole object being discarded
 * if one field is missing or malformed. This is what lets the
 * `editorPrefs` column safely start as `{}` (Part 3a's migration
 * default) and gradually pick up fields over time without ever
 * producing an invalid shape the UI has to guard against everywhere
 * it reads a preference.
 */
export function normalizeEditorPreferences(input: unknown): EditorPreferences {
  const raw = (typeof input === "object" && input !== null ? input : {}) as Record<string, unknown>;

  const fontSize =
    typeof raw.fontSize === "number" && Number.isFinite(raw.fontSize)
      ? Math.min(FONT_SIZE_MAX, Math.max(FONT_SIZE_MIN, Math.round(raw.fontSize)))
      : DEFAULT_EDITOR_PREFERENCES.fontSize;

  const tabSize =
    typeof raw.tabSize === "number" && (TAB_SIZE_OPTIONS as readonly number[]).includes(raw.tabSize)
      ? raw.tabSize
      : DEFAULT_EDITOR_PREFERENCES.tabSize;

  const wordWrap = typeof raw.wordWrap === "boolean" ? raw.wordWrap : DEFAULT_EDITOR_PREFERENCES.wordWrap;
  const minimap = typeof raw.minimap === "boolean" ? raw.minimap : DEFAULT_EDITOR_PREFERENCES.minimap;

  const validDelays = AUTO_SAVE_DELAY_OPTIONS.map((o) => o.value) as number[];
  const autoSaveDelayMs =
    typeof raw.autoSaveDelayMs === "number" && validDelays.includes(raw.autoSaveDelayMs)
      ? raw.autoSaveDelayMs
      : DEFAULT_EDITOR_PREFERENCES.autoSaveDelayMs;

  return { fontSize, tabSize, wordWrap, minimap, autoSaveDelayMs };
}

// ────────────────────────────────────────────────────────────
// Session restoration — which tabs were open, per project
// ────────────────────────────────────────────────────────────

/** Everything needed to restore a project's tab strip on reload. Keyed by projectId inside `editorPrefs.openTabsByProject` so switching between projects doesn't clobber each other's session. */
export interface PersistedProjectSession {
  openNodeIds: string[];
  activeNodeId: string | null;
}

export interface EditorPrefsRecord {
  preferences: EditorPreferences;
  openTabsByProject: Record<string, PersistedProjectSession>;
}

export function normalizeEditorPrefsRecord(input: unknown): EditorPrefsRecord {
  const raw = (typeof input === "object" && input !== null ? input : {}) as Record<string, unknown>;

  const openTabsByProject: Record<string, PersistedProjectSession> = {};
  if (typeof raw.openTabsByProject === "object" && raw.openTabsByProject !== null) {
    for (const [projectId, value] of Object.entries(raw.openTabsByProject as Record<string, unknown>)) {
      if (typeof value !== "object" || value === null) continue;
      const v = value as Record<string, unknown>;
      const openNodeIds = Array.isArray(v.openNodeIds) ? v.openNodeIds.filter((x): x is string => typeof x === "string") : [];
      const activeNodeId = typeof v.activeNodeId === "string" ? v.activeNodeId : null;
      openTabsByProject[projectId] = { openNodeIds, activeNodeId };
    }
  }

  return {
    preferences: normalizeEditorPreferences(raw.preferences),
    openTabsByProject,
  };
}
