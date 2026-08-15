// src/components/workspace/create-workspace-modal.tsx
"use client";

import * as React from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { WorkspaceIcon } from "@/components/workspace/workspace-icon";
import type { Workspace } from "@/lib/workspace/types";

interface CreateWorkspaceModalProps {
  open: boolean;
  onClose: () => void;
  onCreated: (workspace: Workspace) => void;
}

/**
 * Generates a fresh random seed for the workspace icon preview each
 * time the modal opens — same "lock on mount" idea used for the
 * onboarding avatar picker (see progress.md's bug-fix log: "Avatars
 * auto-shuffling while typing username"), so typing the workspace
 * name doesn't cause the icon to visibly jitter.
 */
function randomSeed() {
  return Math.random().toString(36).slice(2, 10);
}

export function CreateWorkspaceModal({ open, onClose, onCreated }: CreateWorkspaceModalProps) {
  const [name, setName] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [iconSeed, setIconSeed] = React.useState(randomSeed());
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (open) {
      setName("");
      setDescription("");
      setIconSeed(randomSeed());
      setError(null);
    }
  }, [open]);

  if (!open) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (name.trim().length < 2) {
      setError("Name must be at least 2 characters.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/workspaces", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim() || undefined,
          icon: iconSeed,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Something went wrong. Try again.");
        setLoading(false);
        return;
      }

      onCreated(data.workspace);
    } catch {
      setError("Something went wrong. Try again.");
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        onClick={loading ? undefined : onClose}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in"
      />

      <div className="relative w-full max-w-md rounded-2xl border border-border bg-bg-elevated p-6 shadow-elevated animate-scale-in">
        <button
          onClick={onClose}
          disabled={loading}
          className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-lg text-tertiary transition-colors hover:bg-surface hover:text-primary disabled:opacity-50"
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </button>

        <h2 className="text-lg font-semibold text-primary">Create a workspace</h2>
        <p className="mt-1 text-sm text-secondary">
          A workspace is where your team's projects live.
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 shrink-0 overflow-hidden rounded-xl border border-border">
              <WorkspaceIcon icon={iconSeed} name={name || "Workspace"} />
            </div>
            <button
              type="button"
              onClick={() => setIconSeed(randomSeed())}
              disabled={loading}
              className="text-xs font-medium text-accent transition-colors hover:text-accent-hover disabled:opacity-50"
            >
              Shuffle icon
            </button>
          </div>

          <Input
            label="Workspace name"
            placeholder="Acme Corp"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={60}
            autoFocus
            disabled={loading}
          />

          <Input
            label="Description (optional)"
            placeholder="What's this workspace for?"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            maxLength={200}
            disabled={loading}
          />

          {error && <p className="text-sm text-danger">{error}</p>}

          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="ghost" size="md" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="md" loading={loading}>
              Create workspace
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
