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

const FALLBACK_PALETTE = [
  { bg: "#3a4022", fg: "#d7fb43" },
  { bg: "#1c2c42", fg: "#60a5fa" },
  { bg: "#1c3427", fg: "#4ade80" },
  { bg: "#3a1c1c", fg: "#f87171" },
  { bg: "#2c2242", fg: "#a78bfa" },
  { bg: "#3a2c12", fg: "#fbbf24" },
];

function paletteIndexForName(name: string): number {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
  }
  return hash % FALLBACK_PALETTE.length;
}

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
