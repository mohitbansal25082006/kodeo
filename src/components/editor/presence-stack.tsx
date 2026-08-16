"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import type { PresenceUser } from "@/lib/collab/use-presence";
import type { CollabStatus } from "@/lib/collab/collab-provider";

interface PresenceStackProps {
  users: PresenceUser[];
  status: CollabStatus;
  className?: string;
}

const MAX_VISIBLE = 4;

/**
 * A small stack of overlapping initials-avatars, one per currently
 * connected collaborator on this file — mounted in editor-shell.tsx's
 * toolbar strip, next to the search/preferences buttons. Each avatar
 * is ringed in that user's assigned presence color (same color their
 * cursor renders in, via remote-cursor-styles.ts), so "find whose
 * cursor that green one is" is a one-glance lookup against this
 * stack.
 */
export function PresenceStack({ users, status, className }: PresenceStackProps) {
  if (status === "disconnected" || status === "unauthorized" || status === "forbidden") {
    return null; // no live session to show presence for — editor-shell.tsx's own status indicator covers this state
  }

  const visible = users.slice(0, MAX_VISIBLE);
  const overflow = users.length - visible.length;

  if (users.length === 0) {
    return (
      <div className={cn("flex items-center gap-1.5 text-[11px] text-tertiary", className)}>
        <span className="h-1.5 w-1.5 rounded-full bg-success" aria-hidden />
        <span>Only you</span>
      </div>
    );
  }

  return (
    <div className={cn("flex items-center gap-1.5", className)}>
      <div className="flex items-center -space-x-2">
        {visible.map((user) => (
          <div
            key={user.clientId}
            title={user.name}
            className="flex h-6 w-6 items-center justify-center rounded-full border-2 text-[10px] font-bold text-bg"
            style={{ borderColor: user.color, backgroundColor: user.color }}
          >
            {initials(user.name)}
          </div>
        ))}
        {overflow > 0 && (
          <div
            className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-border bg-surface text-[10px] font-bold text-secondary"
            title={`${overflow} more`}
          >
            +{overflow}
          </div>
        )}
      </div>
      <span className="text-[11px] text-tertiary">
        {users.length} other{users.length === 1 ? "" : "s"} editing
      </span>
    </div>
  );
}

function initials(name: string): string {
  const trimmed = name.trim();
  if (!trimmed) return "?";
  const parts = trimmed.split(/\s+/);
  if (parts.length === 1) return parts[0][0]?.toUpperCase() ?? "?";
  return ((parts[0][0] ?? "") + (parts[parts.length - 1][0] ?? "")).toUpperCase();
}
