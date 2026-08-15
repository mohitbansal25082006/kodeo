// src/components/workspace/members-table.tsx
"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Crown, LogOut, UserMinus, UserPlus, Mail, X as XIcon } from "lucide-react";
import { UserAvatar } from "@/components/ui/user-avatar";
import { RolePicker } from "@/components/workspace/role-picker";
import { ConfirmModal } from "@/components/workspace/confirm-modal";
import { InviteMemberModal } from "@/components/workspace/invite-member-modal";
import { Button } from "@/components/ui/button";
import { WORKSPACE_ROLES, WORKSPACE_ROLE_META } from "@/lib/workspace/types";
import type { WorkspaceInvitation, WorkspaceMember, WorkspaceRole } from "@/lib/workspace/types";
import {
  hasAtLeastRole,
  outranks,
  canRemoveMember,
  canLeaveWorkspace,
  canTransferOwnership,
  canInviteMembers,
  canRevokeInvitation,
} from "@/lib/workspace/permissions";

interface MembersTableProps {
  workspaceId: string;
  currentUserId: string;
  currentUserRole: WorkspaceRole;
  initialMembers: WorkspaceMember[];
  initialInvitations: WorkspaceInvitation[];
}

type PendingAction =
  | { type: "remove"; member: WorkspaceMember }
  | { type: "leave"; member: WorkspaceMember }
  | { type: "transfer"; member: WorkspaceMember }
  | { type: "revoke"; invitation: WorkspaceInvitation };

export function MembersTable({
  workspaceId,
  currentUserId,
  currentUserRole,
  initialMembers,
  initialInvitations,
}: MembersTableProps) {
  const router = useRouter();
  const [members, setMembers] = React.useState(initialMembers);
  const [invitations, setInvitations] = React.useState(initialInvitations);
  const [roleLoadingId, setRoleLoadingId] = React.useState<string | null>(null);
  const [pending, setPending] = React.useState<PendingAction | null>(null);
  const [actionLoading, setActionLoading] = React.useState(false);
  const [actionError, setActionError] = React.useState<string | null>(null);
  const [inviteOpen, setInviteOpen] = React.useState(false);

  function assignableRolesFor(target: WorkspaceMember): WorkspaceRole[] {
    if (target.role === "owner") return []; // ownership only moves via transfer
    if (!hasAtLeastRole(currentUserRole, "admin")) return [];
    if (!outranks(currentUserRole, target.role)) return [];
    return WORKSPACE_ROLES.filter(
      (r) => r !== "owner" && hasAtLeastRole(currentUserRole, r)
    );
  }

  async function handleRoleChange(member: WorkspaceMember, newRole: WorkspaceRole) {
    setRoleLoadingId(member.id);
    try {
      const res = await fetch(`/api/workspaces/${workspaceId}/members/${member.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: newRole }),
      });
      if (res.ok) {
        setMembers((prev) =>
          prev.map((m) => (m.id === member.id ? { ...m, role: newRole } : m))
        );
      } else {
        const data = await res.json().catch(() => ({}));
        window.alert(data.error || "Couldn't update this member's role.");
      }
    } finally {
      setRoleLoadingId(null);
    }
  }

  async function handleConfirm() {
    if (!pending) return;
    setActionLoading(true);
    setActionError(null);

    try {
      if (pending.type === "transfer") {
        const res = await fetch(`/api/workspaces/${workspaceId}/transfer-ownership`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ memberId: pending.member.id }),
        });
        const data = await res.json();
        if (!res.ok) {
          setActionError(data.error || "Couldn't transfer ownership.");
          setActionLoading(false);
          return;
        }
        setPending(null);
        router.refresh();
        return;
      }

      if (pending.type === "revoke") {
        const res = await fetch(
          `/api/workspaces/${workspaceId}/invitations/${pending.invitation.id}`,
          { method: "DELETE" }
        );
        const data = await res.json();
        if (!res.ok) {
          setActionError(data.error || "Couldn't revoke this invitation.");
          setActionLoading(false);
          return;
        }
        setInvitations((prev) => prev.filter((inv) => inv.id !== pending.invitation.id));
        setPending(null);
        return;
      }

      // remove or leave both hit the same DELETE endpoint — the API
      // route distinguishes them by whether the target userId matches
      // the caller's own session, not by a separate "leave" endpoint.
      const res = await fetch(
        `/api/workspaces/${workspaceId}/members/${pending.member.id}`,
        { method: "DELETE" }
      );
      const data = await res.json();
      if (!res.ok) {
        setActionError(data.error || "Something went wrong.");
        setActionLoading(false);
        return;
      }

      setPending(null);
      if (pending.type === "leave") {
        router.push("/dashboard");
        router.refresh();
      } else {
        setMembers((prev) => prev.filter((m) => m.id !== pending.member.id));
      }
    } finally {
      setActionLoading(false);
    }
  }

  const modalCopy: Record<
    PendingAction["type"],
    { title: string; description: string; confirmLabel: string; danger: boolean }
  > = {
    remove: {
      title: "Remove member",
      description:
        pending?.type === "remove"
          ? `${pending.member.user.name} will lose access to this workspace and everything in it.`
          : "",
      confirmLabel: "Remove member",
      danger: true,
    },
    leave: {
      title: "Leave workspace",
      description:
        "You'll lose access to this workspace and everything in it. You can be re-invited later.",
      confirmLabel: "Leave workspace",
      danger: true,
    },
    transfer: {
      title: "Transfer ownership",
      description:
        pending?.type === "transfer"
          ? `${pending.member.user.name} will become the new owner. You'll be moved to Admin — you'll keep management access but won't be able to delete the workspace.`
          : "",
      confirmLabel: "Transfer ownership",
      danger: false,
    },
    revoke: {
      title: "Revoke invitation",
      description:
        pending?.type === "revoke"
          ? `The invitation link sent to ${pending.invitation.email} will stop working.`
          : "",
      confirmLabel: "Revoke invitation",
      danger: true,
    },
  };

  return (
    <div className="space-y-6">
      {canInviteMembers(currentUserRole) && (
        <div className="flex justify-end">
          <Button
            variant="primary"
            size="md"
            icon={<UserPlus className="h-4 w-4" />}
            iconPosition="left"
            onClick={() => setInviteOpen(true)}
          >
            Invite member
          </Button>
        </div>
      )}

      {canRevokeInvitation(currentUserRole) && invitations.length > 0 && (
        <div>
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-tertiary">
            Pending invitations
          </h3>
          <div className="overflow-hidden rounded-2xl border border-border">
            <table className="w-full">
              <tbody className="divide-y divide-border">
                {invitations.map((invitation) => (
                  <tr key={invitation.id} className="bg-surface/30">
                    <td className="w-full px-4 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-dashed border-border text-tertiary">
                          <Mail className="h-4 w-4" />
                        </div>
                        <div className="min-w-0">
                          <div className="truncate text-sm font-medium text-primary">
                            {invitation.email}
                          </div>
                          <div className="truncate text-xs text-tertiary">
                            Invited by {invitation.invitedBy.name}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3.5">
                      <span className="inline-flex items-center rounded-full border border-border bg-surface/60 px-2.5 py-1 text-xs font-medium text-secondary">
                        {WORKSPACE_ROLE_META[invitation.role].label}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3.5 text-right">
                      <button
                        onClick={() => setPending({ type: "revoke", invitation })}
                        className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-secondary transition-colors hover:bg-danger/10 hover:text-danger"
                      >
                        <XIcon className="h-3.5 w-3.5" />
                        Revoke
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div>
        {canRevokeInvitation(currentUserRole) && invitations.length > 0 && (
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-tertiary">Members</h3>
        )}
        <div className="overflow-hidden rounded-2xl border border-border">
          <table className="w-full">
            <tbody className="divide-y divide-border">
              {members.map((member) => {
                const isSelf = member.userId === currentUserId;
                const assignable = assignableRolesFor(member);

                return (
                  <tr key={member.id} className="bg-surface/30">
                    <td className="w-full px-4 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="relative h-9 w-9 shrink-0 overflow-hidden rounded-full bg-surface">
                          <UserAvatar image={member.user.image} name={member.user.name} />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="truncate text-sm font-medium text-primary">
                              {member.user.name}
                            </span>
                            {isSelf && <span className="text-xs text-tertiary">(you)</span>}
                          </div>
                          <div className="truncate text-xs text-tertiary">
                            {member.user.username ? `@${member.user.username}` : member.user.email}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="whitespace-nowrap px-4 py-3.5">
                      <RolePicker
                        value={member.role}
                        assignableRoles={assignable}
                        disabled={assignable.length === 0}
                        loading={roleLoadingId === member.id}
                        onChange={(role) => handleRoleChange(member, role)}
                      />
                    </td>

                    <td className="whitespace-nowrap px-4 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {isSelf && canLeaveWorkspace(currentUserRole) && (
                          <button
                            onClick={() => setPending({ type: "leave", member })}
                            className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-secondary transition-colors hover:bg-danger/10 hover:text-danger"
                          >
                            <LogOut className="h-3.5 w-3.5" />
                            Leave
                          </button>
                        )}
                        {!isSelf && canTransferOwnership(currentUserRole) && member.role !== "owner" && (
                          <button
                            onClick={() => setPending({ type: "transfer", member })}
                            className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-secondary transition-colors hover:bg-accent-dim/50 hover:text-accent"
                          >
                            <Crown className="h-3.5 w-3.5" />
                            Make owner
                          </button>
                        )}
                        {!isSelf && canRemoveMember(currentUserRole, member.role) && (
                          <button
                            onClick={() => setPending({ type: "remove", member })}
                            className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-secondary transition-colors hover:bg-danger/10 hover:text-danger"
                          >
                            <UserMinus className="h-3.5 w-3.5" />
                            Remove
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {pending && (
        <ConfirmModal
          open
          title={modalCopy[pending.type].title}
          description={modalCopy[pending.type].description}
          confirmLabel={modalCopy[pending.type].confirmLabel}
          danger={modalCopy[pending.type].danger}
          loading={actionLoading}
          error={actionError}
          onConfirm={handleConfirm}
          onClose={() => {
            setPending(null);
            setActionError(null);
          }}
        />
      )}

      <InviteMemberModal
        open={inviteOpen}
        workspaceId={workspaceId}
        actorRole={currentUserRole}
        onClose={() => setInviteOpen(false)}
        onInvited={(invitation) => {
          setInvitations((prev) => [invitation, ...prev]);
          setInviteOpen(false);
        }}
      />
    </div>
  );
}
