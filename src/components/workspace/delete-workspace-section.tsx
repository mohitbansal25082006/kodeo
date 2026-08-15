// src/components/workspace/delete-workspace-section.tsx
"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, X } from "lucide-react";
import { SettingsSection } from "@/components/settings/settings-section";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface DeleteWorkspaceSectionProps {
  workspaceId: string;
  workspaceName: string;
}

export function DeleteWorkspaceSection({ workspaceId, workspaceName }: DeleteWorkspaceSectionProps) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [confirmText, setConfirmText] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const canConfirm = confirmText.trim() === workspaceName;

  async function handleDelete() {
    if (!canConfirm) return;
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/workspaces/${workspaceId}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "Something went wrong. Try again.");
        setLoading(false);
        return;
      }

      router.push("/dashboard");
      router.refresh();
    } catch {
      setError("Something went wrong. Try again.");
      setLoading(false);
    }
  }

  return (
    <>
      <SettingsSection
        title="Delete this workspace"
        description="Permanently delete this workspace, its members, and everything in it. This cannot be undone."
        danger
      >
        <Button
          variant="danger"
          size="md"
          icon={<AlertTriangle className="h-4 w-4" />}
          iconPosition="left"
          onClick={() => setOpen(true)}
        >
          Delete workspace
        </Button>
      </SettingsSection>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            onClick={loading ? undefined : () => setOpen(false)}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in"
          />

          <div className="relative w-full max-w-md rounded-2xl border border-danger/25 bg-bg-elevated p-6 shadow-elevated animate-scale-in">
            <button
              onClick={() => setOpen(false)}
              disabled={loading}
              className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-lg text-tertiary transition-colors hover:bg-surface hover:text-primary disabled:opacity-50"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>

            <h2 className="text-lg font-semibold text-danger">Delete "{workspaceName}"?</h2>
            <p className="mt-2 text-sm text-secondary">
              This permanently deletes the workspace, removes every member, and
              cannot be undone. Type <span className="font-mono-tech font-semibold text-primary">{workspaceName}</span>{" "}
              to confirm.
            </p>

            <div className="mt-4">
              <Input
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder={workspaceName}
                autoFocus
                disabled={loading}
              />
            </div>

            {error && <p className="mt-3 text-sm text-danger">{error}</p>}

            <div className="mt-6 flex justify-end gap-2">
              <Button variant="ghost" size="md" onClick={() => setOpen(false)} disabled={loading}>
                Cancel
              </Button>
              <Button
                variant="danger"
                size="md"
                onClick={handleDelete}
                loading={loading}
                disabled={!canConfirm}
              >
                Delete workspace
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
