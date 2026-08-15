// src/lib/workspace/slug.ts

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 48);
}

export function isValidSlug(slug: string): boolean {
  return /^[a-z0-9]([a-z0-9-]{1,46}[a-z0-9])?$/.test(slug);
}

export function* slugCandidates(base: string): Generator<string> {
  const safeBase = base || "workspace";
  yield safeBase;
  for (let i = 2; i <= 50; i++) {
    yield `${safeBase}-${i}`;
  }
}
