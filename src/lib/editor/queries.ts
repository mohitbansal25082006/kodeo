// src/lib/editor/queries.ts
import { pool } from "@/lib/db";
import { normalizeEditorPrefsRecord, type EditorPrefsRecord, type PersistedProjectSession } from "@/lib/editor/preferences";

export async function getEditorPrefs(userId: string): Promise<EditorPrefsRecord> {
  const { rows } = await pool.query<{ editorPrefs: unknown }>(
    `SELECT "editorPrefs" FROM "user" WHERE id = $1 LIMIT 1`,
    [userId]
  );
  return normalizeEditorPrefsRecord(rows[0]?.editorPrefs ?? {});
}

/**
 * Merges a partial update into the user's stored preferences object
 * (fetch-modify-write rather than a JSONB patch operator) so a
 * preferences-only save from one tab of the browser doesn't clobber
 * a concurrent tab-session save from another, and vice versa — both
 * writers read the current full record, patch their slice, and write
 * the whole thing back. This isn't fully race-proof under true
 * concurrent writes (last write still wins between the read and the
 * write), but editor preferences and tab-session state are both
 * low-stakes, single-user, frequently-overwritten data where an
 * occasional lost update is a non-issue — nothing here is the kind of
 * financial/ownership invariant Part 2's transactional writes protect.
 */
export async function updateEditorPreferences(
  userId: string,
  patch: Partial<EditorPrefsRecord["preferences"]>
): Promise<EditorPrefsRecord> {
  const current = await getEditorPrefs(userId);
  const next: EditorPrefsRecord = {
    ...current,
    preferences: { ...current.preferences, ...patch },
  };
  await pool.query(`UPDATE "user" SET "editorPrefs" = $1, "updatedAt" = now() WHERE id = $2`, [
    JSON.stringify(next),
    userId,
  ]);
  return next;
}

export async function saveProjectSession(
  userId: string,
  projectId: string,
  session: PersistedProjectSession
): Promise<void> {
  const current = await getEditorPrefs(userId);
  const next: EditorPrefsRecord = {
    ...current,
    openTabsByProject: { ...current.openTabsByProject, [projectId]: session },
  };
  await pool.query(`UPDATE "user" SET "editorPrefs" = $1, "updatedAt" = now() WHERE id = $2`, [
    JSON.stringify(next),
    userId,
  ]);
}
