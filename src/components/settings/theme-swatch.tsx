// src/components/settings/theme-swatch.tsx
"use client";

import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ThemeDefinition } from "@/lib/themes/theme-definitions";

interface ThemeSwatchProps {
  theme: ThemeDefinition;
  selected: boolean;
  onSelect: () => void;
}

export function ThemeSwatch({ theme, selected, onSelect }: ThemeSwatchProps) {
  const [bg, surface, accent] = theme.preview;

  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-xl border text-left transition-all duration-150",
        selected
          ? "border-accent ring-2 ring-accent/30"
          : "border-border hover:border-border-strong"
      )}
    >
      <div
        className="flex h-16 items-end gap-1.5 p-3"
        style={{ background: bg }}
      >
        <span
          className="h-4 w-4 rounded-full border"
          style={{ background: surface, borderColor: `${accent}40` }}
        />
        <span className="h-4 w-4 rounded-full" style={{ background: accent }} />
      </div>
      <div className="flex items-center justify-between border-t border-border bg-surface px-3 py-2">
        <span className="text-xs font-medium text-primary">{theme.name}</span>
        {selected && (
          <span className="flex h-4 w-4 items-center justify-center rounded-full bg-accent">
            <Check className="h-2.5 w-2.5 text-[#08090a]" strokeWidth={3} />
          </span>
        )}
      </div>
    </button>
  );
}