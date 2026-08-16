// src/components/editor/preferences-panel.tsx
"use client";

import * as React from "react";
import { X, Settings2, Minus, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  type EditorPreferences,
  FONT_SIZE_MIN,
  FONT_SIZE_MAX,
  TAB_SIZE_OPTIONS,
  AUTO_SAVE_DELAY_OPTIONS,
} from "@/lib/editor/preferences";

interface PreferencesPanelProps {
  open: boolean;
  preferences: EditorPreferences;
  onClose: () => void;
  /** Applies immediately to the open editor(s) and persists to the server — the panel doesn't distinguish a local draft from the saved value, since every field here is a simple, instantly-reversible toggle where "preview before saving" adds a step without adding safety. */
  onChange: (patch: Partial<EditorPreferences>) => void;
}

export function PreferencesPanel({ open, preferences, onClose, onChange }: PreferencesPanelProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in" onClick={onClose} />
      <div className="relative w-full max-w-sm rounded-2xl border border-border bg-bg-elevated p-5 shadow-elevated animate-scale-in">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-surface">
              <Settings2 className="h-4 w-4 text-accent" />
            </div>
            <h3 className="text-sm font-semibold text-primary">Editor preferences</h3>
          </div>
          <button
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-tertiary transition-colors hover:bg-surface hover:text-primary"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-5 space-y-5">
          {/* Font size */}
          <div>
            <div className="mb-2 flex items-center justify-between">
              <label className="text-xs font-medium text-secondary">Font size</label>
              <span className="font-mono-tech text-xs text-tertiary">{preferences.fontSize}px</span>
            </div>
            <div className="flex items-center gap-2">
              <StepperButton
                icon={<Minus className="h-3.5 w-3.5" />}
                onClick={() => onChange({ fontSize: Math.max(FONT_SIZE_MIN, preferences.fontSize - 1) })}
                disabled={preferences.fontSize <= FONT_SIZE_MIN}
              />
              <input
                type="range"
                min={FONT_SIZE_MIN}
                max={FONT_SIZE_MAX}
                value={preferences.fontSize}
                onChange={(e) => onChange({ fontSize: Number(e.target.value) })}
                className="h-1.5 flex-1 cursor-pointer appearance-none rounded-full bg-surface accent-[var(--color-accent)]"
              />
              <StepperButton
                icon={<Plus className="h-3.5 w-3.5" />}
                onClick={() => onChange({ fontSize: Math.min(FONT_SIZE_MAX, preferences.fontSize + 1) })}
                disabled={preferences.fontSize >= FONT_SIZE_MAX}
              />
            </div>
          </div>

          {/* Tab size */}
          <div>
            <label className="mb-2 block text-xs font-medium text-secondary">Tab size</label>
            <div className="flex gap-1.5">
              {TAB_SIZE_OPTIONS.map((size) => (
                <button
                  key={size}
                  onClick={() => onChange({ tabSize: size })}
                  className={cn(
                    "flex-1 rounded-lg border px-2 py-1.5 text-xs font-medium transition-colors",
                    preferences.tabSize === size
                      ? "border-accent/40 bg-accent-dim/50 text-accent"
                      : "border-border bg-surface text-secondary hover:border-border-strong hover:text-primary"
                  )}
                >
                  {size} spaces
                </button>
              ))}
            </div>
          </div>

          {/* Auto-save delay */}
          <div>
            <label className="mb-2 block text-xs font-medium text-secondary">Auto-save</label>
            <div className="grid grid-cols-2 gap-1.5">
              {AUTO_SAVE_DELAY_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => onChange({ autoSaveDelayMs: opt.value })}
                  className={cn(
                    "rounded-lg border px-2 py-1.5 text-xs font-medium transition-colors",
                    preferences.autoSaveDelayMs === opt.value
                      ? "border-accent/40 bg-accent-dim/50 text-accent"
                      : "border-border bg-surface text-secondary hover:border-border-strong hover:text-primary"
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            <p className="mt-1.5 text-[11px] text-tertiary">
              Cmd/Ctrl+S always saves immediately, regardless of this setting.
            </p>
          </div>

          {/* Toggles */}
          <div className="space-y-2.5">
            <ToggleRow
              label="Word wrap"
              checked={preferences.wordWrap}
              onChange={(checked) => onChange({ wordWrap: checked })}
            />
            <ToggleRow label="Minimap" checked={preferences.minimap} onChange={(checked) => onChange({ minimap: checked })} />
          </div>
        </div>
      </div>
    </div>
  );
}

function StepperButton({ icon, onClick, disabled }: { icon: React.ReactNode; onClick: () => void; disabled?: boolean }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-border bg-surface text-secondary transition-colors hover:border-border-strong hover:text-primary disabled:opacity-40"
    >
      {icon}
    </button>
  );
}

function ToggleRow({ label, checked, onChange }: { label: string; checked: boolean; onChange: (checked: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className="flex w-full items-center justify-between rounded-lg px-0.5 py-0.5 text-left"
    >
      <span className="text-xs font-medium text-secondary">{label}</span>
      <span
        className={cn(
          "relative h-5 w-9 shrink-0 rounded-full transition-colors",
          checked ? "bg-accent" : "bg-surface-active border border-border"
        )}
      >
        <span
          className={cn(
            "absolute top-0.5 h-3.5 w-3.5 rounded-full bg-bg-elevated transition-transform",
            checked ? "translate-x-[18px]" : "translate-x-0.5"
          )}
        />
      </span>
    </button>
  );
}
