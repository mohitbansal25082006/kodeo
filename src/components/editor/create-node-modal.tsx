// src/components/editor/create-node-modal.tsx
"use client";

import * as React from "react";
import { X, FilePlus, FolderPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface CreateNodeModalProps {
  open: boolean;
  type: "file" | "folder";
  onClose: () => void;
  onCreate: (name: string) => Promise<{ error?: string }>;
}

export function CreateNodeModal({ open, type, onClose, onCreate }: CreateNodeModalProps) {
  const [name, setName] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (open) {
      setName("");
      setError(null);
      // Autofocus after the modal's mount transition so the caret lands correctly rather than being stolen by an in-flight animation.
      const t = setTimeout(() => inputRef.current?.focus(), 50);
      return () => clearTimeout(t);
    }
  }, [open]);

  if (!open) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    setLoading(true);
    setError(null);
    const result = await onCreate(trimmed);
    if (result.error) {
      setError(result.error);
      setLoading(false);
    }
  }

  const Icon = type === "file" ? FilePlus : FolderPlus;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in" onClick={onClose} />
      <div className="relative w-full max-w-sm rounded-2xl border border-border bg-bg-elevated p-5 shadow-elevated animate-scale-in">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-surface">
              <Icon className="h-4 w-4 text-accent" />
            </div>
            <h3 className="text-sm font-semibold text-primary">
              {type === "file" ? "New file" : "New folder"}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-tertiary transition-colors hover:bg-surface hover:text-primary"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4">
          <Input
            ref={inputRef}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={type === "file" ? "index.ts" : "components"}
            error={error ?? undefined}
            autoComplete="off"
            spellCheck={false}
          />
          <div className="mt-4 flex justify-end gap-2">
            <Button type="button" variant="ghost" size="sm" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" loading={loading} disabled={!name.trim()}>
              Create
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
