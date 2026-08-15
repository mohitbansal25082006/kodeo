// src/components/workspace/role-picker.tsx
"use client";

import * as React from "react";
import { ChevronDown, Check } from "lucide-react";
import { WORKSPACE_ROLE_META } from "@/lib/workspace/types";
import type { WorkspaceRole } from "@/lib/workspace/types";
import { cn } from "@/lib/utils";

interface RolePickerProps {
  value: WorkspaceRole;
  assignableRoles: WorkspaceRole[];
  disabled?: boolean;
  loading?: boolean;
  onChange: (role: WorkspaceRole) => void;
}

export function RolePicker({ value, assignableRoles, disabled, loading, onChange }: RolePickerProps) {
  const [open, setOpen] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  if (disabled || assignableRoles.length === 0) {
    return (
      <span className="inline-flex items-center rounded-full border border-border bg-surface/60 px-2.5 py-1 text-xs font-medium text-secondary">
        {WORKSPACE_ROLE_META[value].label}
      </span>
    );
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        disabled={loading}
        className={cn(
          "inline-flex items-center gap-1 rounded-full border border-border bg-surface px-2.5 py-1 text-xs font-medium text-primary transition-colors",
          "hover:border-border-strong disabled:opacity-50"
        )}
      >
        {loading ? (
          <span className="h-3 w-3 animate-spin rounded-full border-2 border-accent border-t-transparent" />
        ) : (
          <>
            {WORKSPACE_ROLE_META[value].label}
            <ChevronDown className="h-3 w-3 text-tertiary" />
          </>
        )}
      </button>

      <div
        className={cn(
          "absolute right-0 top-[calc(100%+4px)] z-20 w-56 origin-top-right rounded-xl border border-border bg-bg-elevated p-1.5 shadow-elevated transition-all duration-150",
          open ? "scale-100 opacity-100" : "pointer-events-none scale-95 opacity-0"
        )}
      >
        {assignableRoles.map((role) => {
          const meta = WORKSPACE_ROLE_META[role];
          return (
            <button
              key={role}
              onClick={() => {
                setOpen(false);
                if (role !== value) onChange(role);
              }}
              className="flex w-full items-start gap-2 rounded-lg px-2.5 py-2 text-left transition-colors hover:bg-surface"
            >
              <span className="flex-1">
                <span className="block text-sm font-medium text-primary">{meta.label}</span>
                <span className="block text-xs text-tertiary">{meta.description}</span>
              </span>
              {role === value && <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-accent" />}
            </button>
          );
        })}
      </div>
    </div>
  );
}
