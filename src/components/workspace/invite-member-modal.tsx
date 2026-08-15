// src/components/workspace/invite-member-modal.tsx
"use client";

import * as React from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { INVITABLE_ROLES, WORKSPACE_ROLE_META } from "@/lib/workspace/types";
import type { InvitableRole, WorkspaceInvitation, WorkspaceRole } from "@/lib/workspace/types";
import { canInviteAsRole } from "@/lib/workspace/permissions";
import { cn } from "@/lib/utils";

interface InviteMemberModalProps {
  open: boolean;
  workspaceId: string;
  actorRole: WorkspaceRole;
  onClose: () => void;
  onInvited: (invitation: WorkspaceInvitation) => void;
}

export function InviteMemberModal({
  open,
  workspaceId,
  actorRole,
  onClose,
  onInvited,
}: InviteMemberModalProps) {
  const [email, setEmail] = React.useState("");
  const [role, setRole] = React.useState<InvitableRole>("viewer");
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // Only offer roles the actor is actually allowed to grant — an
  // admin never even sees "Admin" as an option to invite at, rather
  // than showing it and failing server-side (see canInviteAsRole).
  const assignableRoles = INVITABLE_ROLES.filter((r) => canInviteAsRole(actorRole, r));

  React.useEffect(() => {
    if (open) {
      setEmail("");
      setRole(assignableRoles.includes("viewer") ? "viewer" : assignableRoles[0]);
      setError(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  if (!open) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch(`/api/workspaces/${workspaceId}/invitations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), role }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Something went wrong. Try again.");
        setLoading(false);
        return;
      }

      onInvited(data.invitation);
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

        <h2 className="text-lg font-semibold text-primary">Invite a member</h2>
        <p className="mt-1 text-sm text-secondary">
          We&apos;ll email them a link to join this workspace.
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <Input
            label="Email address"
            type="email"
            placeholder="teammate@company.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoFocus
            disabled={loading}
          />

          <div>
            <label className="mb-1.5 block text-sm font-medium text-secondary">Role</label>
            <div className="space-y-2">
              {assignableRoles.map((r) => {
                const meta = WORKSPACE_ROLE_META[r];
                const selected = role === r;
                return (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setRole(r)}
                    disabled={loading}
                    className={cn(
                      "flex w-full items-start gap-3 rounded-xl border px-3.5 py-3 text-left transition-colors",
                      selected
                        ? "border-accent/50 bg-accent-dim/30"
                        : "border-border bg-surface hover:border-border-strong"
                    )}
                  >
                    <span
                      className={cn(
                        "mt-0.5 h-4 w-4 shrink-0 rounded-full border-2",
                        selected ? "border-accent bg-accent" : "border-border-strong"
                      )}
                    />
                    <span>
                      <span className="block text-sm font-medium text-primary">{meta.label}</span>
                      <span className="block text-xs text-tertiary">{meta.description}</span>
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {error && <p className="text-sm text-danger">{error}</p>}

          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="ghost" size="md" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="md" loading={loading}>
              Send invitation
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}