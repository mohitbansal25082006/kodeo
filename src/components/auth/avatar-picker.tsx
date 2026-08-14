// src/components/auth/avatar-picker.tsx
"use client";

import * as React from "react";
import multiavatar from "@multiavatar/multiavatar/esm";
import { Dices, Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface AvatarPickerProps {
  seed: string;
  value: string; // currently selected avatar identifier (not a URL — see note below)
  onChange: (avatarId: string) => void;
}

/**
 * Avatars are generated with Multiavatar (multiavatar.com) — a free,
 * open-source, multicultural human-persona avatar generator.
 *
 * IMPORTANT ARCHITECTURE NOTE: Multiavatar's hosted HTTP API
 * (api.multiavatar.com) was shut down by its maintainers. It's now
 * distributed only as an npm package (@multiavatar/multiavatar) that
 * generates SVG markup locally, in-process — there is no remote
 * request at all. This is actually more reliable than the previous
 * DiceBear-via-remote-<img> approach: there's no external network
 * call that can fail, get rate-limited, get blocked by an ad-blocker,
 * or go down, because nothing ever leaves the browser/server.
 *
 * Because generation is local and synchronous, `value` stores just the
 * avatar's identifier string (e.g. "kodeo-jane-2"), NOT a URL. The SVG
 * itself is regenerated on demand anywhere it's displayed by calling
 * multiavatar(id). See src/lib/avatar.ts for the shared helper used
 * by both this picker and any other place an avatar needs rendering
 * (sidebar, profile header, etc).
 */
const VARIANT_COUNT = 6;

function buildAvatarId(seed: string, variant: number) {
  return `${seed}-${variant}`;
}

function AvatarSvg({ avatarId, className }: { avatarId: string; className?: string }) {
  const svgMarkup = React.useMemo(() => multiavatar(avatarId), [avatarId]);
  return (
    <div
      className={className}
      // multiavatar() returns static, locally-generated SVG markup with
      // no user-controlled content (the seed only selects among a fixed
      // set of 12 billion pre-authored shape/color combinations, it is
      // not reflected into attributes or scripts), so this is safe.
      dangerouslySetInnerHTML={{ __html: svgMarkup }}
    />
  );
}

export function AvatarPicker({ seed, value, onChange }: AvatarPickerProps) {
  // IMPORTANT: the seed is captured ONCE on mount (via useState's lazy
  // initializer) and never updated again in response to the `seed` prop
  // changing. If this instead read `seed` live on every render, typing
  // in a username field that feeds `seed` (as onboarding does) would
  // regenerate the entire avatar grid on every keystroke — visually
  // this looked like the avatars "auto-shuffling" while typing, since
  // each keystroke produced a brand new set of 6 avatars and the
  // previously-selected one no longer matched anything in the new set.
  // Only the explicit Shuffle button (or a real prop change from a
  // parent that intentionally wants a new seed, e.g. switching users)
  // should regenerate the grid.
  const [lockedSeed] = React.useState(() => seed || "kodeo-user");
  const [round, setRound] = React.useState(0);

  const options = React.useMemo(
    () =>
      Array.from({ length: VARIANT_COUNT }, (_, i) =>
        buildAvatarId(`${lockedSeed}-r${round}`, i)
      ),
    [lockedSeed, round]
  );

  // Keep the selection in sync with the first option by default, but
  // only once, on mount — not every time options regenerate.
  const didInitRef = React.useRef(false);
  React.useEffect(() => {
    if (!didInitRef.current && !value) {
      didInitRef.current = true;
      onChange(options[0]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <span className="text-sm font-medium text-secondary">Profile picture</span>
        <button
          type="button"
          onClick={() => setRound((r) => r + 1)}
          className="inline-flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1 text-xs font-medium text-secondary transition-colors hover:border-border-strong hover:text-primary"
        >
          <Dices className="h-3.5 w-3.5" />
          Shuffle
        </button>
      </div>
      <div className="grid grid-cols-4 gap-2 xs:grid-cols-6 xs:gap-2.5">
        {options.map((avatarId) => {
          const selected = value === avatarId;
          return (
            <button
              key={avatarId}
              type="button"
              onClick={() => onChange(avatarId)}
              className={cn(
                "relative aspect-square overflow-hidden rounded-xl border bg-surface-hover transition-all duration-150",
                selected
                  ? "border-accent ring-2 ring-accent/30"
                  : "border-border hover:border-border-strong"
              )}
              aria-label={`Select avatar ${avatarId}`}
            >
              <AvatarSvg avatarId={avatarId} className="absolute inset-0 h-full w-full [&>svg]:h-full [&>svg]:w-full" />
              {selected && (
                <span className="absolute right-1 top-1 z-10 flex h-4 w-4 items-center justify-center rounded-full bg-accent">
                  <Check className="h-2.5 w-2.5 text-[#08090a]" strokeWidth={3} />
                </span>
              )}
            </button>
          );
        })}
      </div>
      <p className="mt-2 text-xs text-tertiary">
        Free human-persona avatars via Multiavatar — pick a style or shuffle for new options.
      </p>
    </div>
  );
}