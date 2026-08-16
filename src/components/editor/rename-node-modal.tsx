// src/components/editor/rename-node-modal.tsx
"use client";

import * as React from "react";
import { X, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { ProjectNodeTree } from "@/lib/filesystem/types";

interface RenameNodeModalProps {
  open: boolean;
  node: ProjectNodeTree;
  onClose: () => void;
  onRename: (name: string) => Promise<{ error?: string }>;
}

export function RenameNodeModal({ open, node, onClose, onRename }: RenameNodeModalProps) {
  const [name, setName] = React.useState(node.name);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (open) {
      setName(node.name);
      setError(null);
      const t = setTimeout(() => {
        inputRef.current?.focus();
        // Select the name up to (not including) the extension, matching
        // the "rename" convention most file managers and IDEs use — so
        // typing immediately replaces the base name, not the extension.
        const dotIndex = node.name.lastIndexOf(".");
        if (node.type === "file" && dotIndex > 0) {
          inputRef.current?.setSelectionRange(0, dotIndex);
        } else {
          inputRef.current?.select();
        }
      }, 50);
      return () => clearTimeout(t);
    }
  }, [open, node.name, node.type]);

  if (!open) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed || trimmed === node.name) {
      if (trimmed === node.name) onClose();
      return;
    }
    setLoading(true);
    setError(null);
    const result = await onRename(trimmed);
    if (result.error) {
      setError(result.error);
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in" onClick={onClose} />
      <div className="relative w-full max-w-sm rounded-2xl border border-border bg-bg-elevated p-5 shadow-elevated animate-scale-in">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-surface">
              <Pencil className="h-4 w-4 text-accent" />
            </div>
            <h3 className="text-sm font-semibold text-primary">Rename {node.type}</h3>
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
            error={error ?? undefined}
            autoComplete="off"
            spellCheck={false}
          />
          <div className="mt-4 flex justify-end gap-2">
            <Button type="button" variant="ghost" size="sm" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" loading={loading} disabled={!name.trim()}>
              Rename
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
