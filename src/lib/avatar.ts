// src/lib/avatar.ts
import multiavatar from "@multiavatar/multiavatar/esm";

/**
 * The `image` field on a user can be one of two very different things:
 *
 *   1. A real photo URL — set automatically when someone signs up via
 *      Google or GitHub OAuth (e.g. "https://lh3.googleusercontent.com/...").
 *   2. A Multiavatar seed identifier — set by the avatar picker in
 *      onboarding/profile (e.g. "jane-r0-3"), NOT a URL at all.
 *
 * Anywhere a user's avatar is displayed, use isAvatarUrl() to tell
 * these apart, and getAvatarSvg() to render case 2 as inline SVG.
 */

export function isAvatarUrl(image: string | null | undefined): boolean {
  if (!image) return false;
  return image.startsWith("http://") || image.startsWith("https://");
}

export function getAvatarSvg(seedId: string): string {
  return multiavatar(seedId);
}