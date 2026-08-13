// src/components/auth/role-picker.tsx
"use client";

import * as React from "react";
import {
  Code2,
  Server,
  Layers,
  Palette,
  Rocket,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";

const ROLES = [
  { id: "frontend", label: "Frontend", icon: Palette },
  { id: "backend", label: "Backend", icon: Server },
  { id: "fullstack", label: "Full-stack", icon: Layers },
  { id: "mobile", label: "Mobile", icon: Code2 },
  { id: "devops", label: "DevOps", icon: Rocket },
  { id: "student", label: "Student / learning", icon: Sparkles },
] as const;

interface RolePickerProps {
  value: string;
  onChange: (id: string) => void;
}

export function RolePicker({ value, onChange }: RolePickerProps) {
  return (
    <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
      {ROLES.map(({ id, label, icon: Icon }) => {
        const selected = value === id;
        return (
          <button
            key={id}
            type="button"
            onClick={() => onChange(id)}
            className={cn(
              "flex flex-col items-center gap-2 rounded-xl border px-3 py-4 text-center transition-all duration-150",
              selected
                ? "border-accent/60 bg-accent-dim/40 text-primary"
                : "border-border bg-surface text-secondary hover:border-border-strong hover:text-primary"
            )}
          >
            <Icon className={cn("h-5 w-5", selected && "text-accent")} />
            <span className="text-xs font-medium">{label}</span>
          </button>
        );
      })}
    </div>
  );
}