// src/lib/workspace/slug.ts

/**
 * Turn a workspace name into a URL-safe slug candidate.
 * "Acme Corp 🚀" → "acme-corp"
 * Not guaranteed unique on its own — callers must check/retry against
 * the DB (see generateUniqueSlug below), same race-condition-aware
 * pattern used for usernames in src/app/api/profile/route.ts.
 */
export function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "") // strip accents
    .replace(/[^a-z0-9\s-]/g, "") // strip anything not alphanumeric/space/hyphen
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 48);
}

/**
 * Validate a slug the same way the DB's case-insensitive unique index
 * expects it — lowercase, alphanumeric + hyphens, 3-48 chars. Mirrors
 * the username regex in src/app/api/profile/route.ts for consistency.
 */
export function isValidSlug(slug: string): boolean {
  return /^[a-z0-9]([a-z0-9-]{1,46}[a-z0-9])?$/.test(slug);
}

/**
 * Given a desired base slug, produce candidates to try in order:
 * "acme-corp", "acme-corp-2", "acme-corp-3", ...
 * The caller (createWorkspace) tries these against the DB inside a
 * retry loop rather than pre-checking availability, for the same
 * race-condition reason documented throughout the codebase — only the
 * DB's unique index can atomically guarantee the final result.
 */
export function* slugCandidates(base: string): Generator<string> {
  const safeBase = base || "workspace";
  yield safeBase;
  for (let i = 2; i <= 50; i++) {
    yield `${safeBase}-${i}`;
  }
}
