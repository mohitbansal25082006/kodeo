// src/lib/site-url.ts

/**
 * The canonical app origin, trailing-slash-stripped the same way
 * src/lib/auth.ts strips it for Better Auth's baseURL/trustedOrigins
 * — see that file's comment for why a trailing slash silently breaks
 * origin matching. Used anywhere an absolute link needs to be built
 * outside of a request context (e.g. inside an email), where relative
 * URLs aren't an option.
 */
export function getSiteUrl(): string {
  const raw = process.env.NEXT_PUBLIC_APP_URL || "https://kodeo.website";
  return raw.endsWith("/") ? raw.slice(0, -1) : raw;
}

export function buildInviteUrl(token: string): string {
  return `${getSiteUrl()}/invite/${token}`;
}
