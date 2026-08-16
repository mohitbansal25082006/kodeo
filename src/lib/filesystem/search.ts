// src/lib/filesystem/search.ts
import { pool } from "@/lib/db";

export interface FileSearchResult {
  id: string;
  name: string;
  path: string;
}

export interface ContentSearchMatch {
  nodeId: string;
  name: string;
  path: string;
  /** 1-based line number of the match, for display and for jumping the editor to the right place on click. */
  line: number;
  /** A short snippet of the matching line, trimmed — never the whole file, this is a locator not a preview. */
  snippet: string;
}

/**
 * Filename search (quick-open / Cmd+P): case-insensitive substring
 * match against name and full path, files only (folders aren't
 * "openable" the way quick-open means it). A plain ILIKE is
 * deliberately used over trigram/fuzzy matching — project sizes here
 * don't approach the scale where ILIKE '%term%' becomes a real cost,
 * and keeping this endpoint boring is worth more than a marginally
 * smarter ranking algorithm for what is, after all, autocomplete over
 * a few hundred filenames at most.
 */
export async function searchFilesByName(projectId: string, term: string, limit = 30): Promise<FileSearchResult[]> {
  const trimmed = term.trim();
  if (!trimmed) return [];

  const { rows } = await pool.query<FileSearchResult>(
    `SELECT id, name, path FROM "project_node"
     WHERE "projectId" = $1 AND type = 'file' AND (name ILIKE $2 OR path ILIKE $2)
     ORDER BY
       -- Exact-prefix matches on the filename itself rank above matches
       -- that only hit the path or a mid-string substring, so typing
       -- "button" surfaces button.tsx before a deeply-nested file that
       -- merely contains "button" somewhere in its folder path.
       (name ILIKE $3) DESC,
       length(path) ASC,
       lower(name) ASC
     LIMIT $4`,
    [projectId, `%${trimmed}%`, `${trimmed}%`, limit]
  );
  return rows;
}

/**
 * In-content search across every file in a project. Uses Postgres's
 * POSITION/substring on the stored TEXT column rather than a
 * full-text-search index (tsvector) — full-text search tokenizes on
 * word boundaries and stems words, which is wrong for source code
 * search (searching "getUser" shouldn't be stemmed, and matching
 * inside identifiers/punctuation matters); a plain substring scan is
 * both simpler and more correct for this use case at KODEO's current
 * scale. If projects grow large enough for this to become slow, the
 * fix is a dedicated code-search index (e.g. trigram via pg_trgm),
 * not tsvector.
 */
export async function searchFileContents(
  projectId: string,
  term: string,
  limit = 50
): Promise<ContentSearchMatch[]> {
  const trimmed = term.trim();
  if (trimmed.length < 2) return []; // avoid a table scan on a single character, which would return a firehose of noise anyway

  const { rows } = await pool.query<{ id: string; name: string; path: string; content: string }>(
    `SELECT id, name, path, content FROM "project_node"
     WHERE "projectId" = $1 AND type = 'file' AND content ILIKE $2
     ORDER BY lower(path) ASC
     LIMIT 200`, // cap files scanned for snippet extraction; the per-match `limit` below caps results actually returned
    [projectId, `%${trimmed}%`]
  );

  const matches: ContentSearchMatch[] = [];
  const lowerTerm = trimmed.toLowerCase();

  outer: for (const row of rows) {
    const lines = row.content.split("\n");
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].toLowerCase().includes(lowerTerm)) {
        matches.push({
          nodeId: row.id,
          name: row.name,
          path: row.path,
          line: i + 1,
          snippet: lines[i].trim().slice(0, 160),
        });
        if (matches.length >= limit) break outer;
      }
    }
  }

  return matches;
}
