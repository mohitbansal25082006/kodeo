// src/components/auth/avatar-picker.tsx
"use client";

import * as React from "react";
import { Dices, Check, ImageOff } from "lucide-react";
import { cn } from "@/lib/utils";

interface AvatarPickerProps {
  seed: string;
  value: string; // currently selected avatar URL
  onChange: (url: string) => void;
}

/**
 * DiceBear (dicebear.com) is a free, open-source avatar API — no API
 * key, no account required. We offer a handful of styles themed to
 * KODEO's palette via the backgroundColor param, seeded off the
 * user's name/username so results are deterministic and reproducible.
 *
 * Note: these are rendered with a plain <img> tag rather than
 * next/image. next/image's optimizer pipeline (even with
 * `unoptimized`) is unreliable for external SVGs whose URL doesn't
 * end in a literal ".svg" file extension (DiceBear's URLs end in
 * "/svg?params", which next/image's SVG auto-detection doesn't
 * recognize) — this caused the avatars to fail to render entirely.
 * A plain <img> has no such restriction and is what DiceBear's own
 * docs recommend.
 */
const STYLES = ["glass", "identicon", "shapes", "thumbs", "bottts", "rings"] as const;

function buildUrl(style: string, seed: string, variant = 0) {
  const params = new URLSearchParams({
    seed: `${seed}-${variant}`,
    backgroundColor: "0a0a0a,111111,1a1a1a",
    backgroundType: "solid",
  });
  return `https://api.dicebear.com/10.x/${style}/svg?${params.toString()}`;
}

function AvatarImage({ src, alt }: { src: string; alt: string }) {
  const [status, setStatus] = React.useState<"loading" | "loaded" | "error">("loading");

  // Reset status whenever the URL itself changes (shuffle / seed change).
  React.useEffect(() => {
    setStatus("loading");
  }, [src]);

  return (
    <>
      {status === "loading" && (
        <div className="absolute inset-0 animate-pulse bg-surface-hover" />
      )}
      {status === "error" && (
        <div className="absolute inset-0 flex items-center justify-center bg-surface-hover text-tertiary">
          <ImageOff className="h-4 w-4" />
        </div>
      )}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={alt}
        loading="lazy"
        onLoad={() => setStatus("loaded")}
        onError={() => setStatus("error")}
        className={cn(
          "absolute inset-0 h-full w-full object-cover transition-opacity duration-200",
          status === "loaded" ? "opacity-100" : "opacity-0"
        )}
      />
    </>
  );
}

export function AvatarPicker({ seed, value, onChange }: AvatarPickerProps) {
  const effectiveSeed = seed || "kodeo-user";
  const [variant, setVariant] = React.useState(0);

  const options = React.useMemo(
    () => STYLES.map((style) => ({ style, url: buildUrl(style, effectiveSeed, variant) })),
    [effectiveSeed, variant]
  );

  // Keep the selection in sync with the first option by default.
  React.useEffect(() => {
    if (!value) {
      onChange(options[0].url);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [effectiveSeed]);

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <span className="text-sm font-medium text-secondary">Profile picture</span>
        <button
          type="button"
          onClick={() => setVariant((v) => v + 1)}
          className="inline-flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1 text-xs font-medium text-secondary transition-colors hover:border-border-strong hover:text-primary"
        >
          <Dices className="h-3.5 w-3.5" />
          Shuffle
        </button>
      </div>
      <div className="grid grid-cols-6 gap-2.5">
        {options.map(({ style, url }) => {
          const selected = value === url;
          return (
            <button
              key={style}
              type="button"
              onClick={() => onChange(url)}
              className={cn(
                "relative aspect-square overflow-hidden rounded-xl border transition-all duration-150",
                selected
                  ? "border-accent ring-2 ring-accent/30"
                  : "border-border hover:border-border-strong"
              )}
              aria-label={`Select ${style} avatar`}
            >
              <AvatarImage src={url} alt="" />
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
        Free avatars via DiceBear — pick a style or shuffle for a new look.
      </p>
    </div>
  );
}