// src/components/workspace/workspace-icon.tsx
"use client";

import * as React from "react";
import { getAvatarSvg } from "@/lib/avatar";
import { cn } from "@/lib/utils";

interface WorkspaceIconProps {
  icon?: string | null;
  name: string;
  className?: string;
}

// A small fixed palette keyed off the workspace name so the same
// workspace always gets the same fallback color across renders,
// without needing to store a color in the DB. Deliberately reuses
// hues already present in the KODEO theme system (design-tokens.ts /
// theme-definitions.ts) so untitled/icon-less workspaces still feel
// on-brand instead of introducing new colors into the palette.
const FALLBACK_PALETTE = [
  { bg: "#3a4022", fg: "#d7fb43" }, // accent-dim / accent
  { bg: "#1c2c42", fg: "#60a5fa" }, // ocean/midnight family
  { bg: "#1c3427", fg: "#4ade80" }, // forest family
  { bg: "#3a1c1c", fg: "#f87171" }, // crimson family
  { bg: "#2c2242", fg: "#a78bfa" }, // violet family
  { bg: "#3a2c12", fg: "#fbbf24" }, // amber family
];

function paletteIndexForName(name: string): number {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
  }
  return hash % FALLBACK_PALETTE.length;
}

/**
 * Renders a workspace's icon. Same two-shape distinction as user
 * avatars in src/lib/avatar.ts — `icon` is either a Multiavatar seed
 * (render as inline SVG) or absent (fall back to a colored initial).
 * Workspaces never have an OAuth-photo-style URL, so there's no third
 * case to handle here unlike UserAvatar.
 */
export function WorkspaceIcon({ icon, name, className }: WorkspaceIconProps) {
  const svgMarkup = React.useMemo(() => {
    if (icon) return getAvatarSvg(icon);
    return null;
  }, [icon]);

  if (svgMarkup) {
    return (
      <div
        className={cn("h-full w-full overflow-hidden rounded-[10px] [&>svg]:h-full [&>svg]:w-full", className)}
        dangerouslySetInnerHTML={{ __html: svgMarkup }}
      />
    );
  }

  const { bg, fg } = FALLBACK_PALETTE[paletteIndexForName(name || "K")];

  return (
    <div
      className={cn("flex h-full w-full items-center justify-center rounded-[10px] text-sm font-bold", className)}
      style={{ backgroundColor: bg, color: fg }}
    >
      {name?.[0]?.toUpperCase() || "K"}
    </div>
  );
}
