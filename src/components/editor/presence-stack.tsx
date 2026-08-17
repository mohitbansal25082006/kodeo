"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import type { PresenceUser } from "@/lib/collab/use-presence";
import type { CollabStatus } from "@/lib/collab/collab-provider";

interface PresenceStackProps {
  users: PresenceUser[];
  status: CollabStatus;
  className?: string;
  /**
   * Part 4b — called when the person clicks a collaborator's avatar,
   * with that collaborator's current cursor line (if known). Wired
   * in editor-shell.tsx to scroll/reveal that line in Monaco, the
   * same revealLine mechanism search-modal.tsx already uses for
   * jump-to-search-result — "find where Sarah is" is the single most
   * requested presence-UI feature in every collaborative editor, and
   * reuses machinery that already exists rather than adding a new one.
   */
  onJumpToUser?: (userId: string, line: number) => void;
}

const MAX_VISIBLE = 4;

/**
 * A small stack of overlapping initials-avatars, one per currently
 * connected collaborator on this file. Each avatar is ringed in that
 * user's assigned presence color (same color their cursor renders in,
 * via remote-cursor-styles.ts), so "find whose cursor that green one
 * is" is a one-glance lookup against this stack.
 *
 * Part 4b: avatars are now clickable (when a cursor position is
 * known) and show a richer tooltip — name plus a "Line N" indicator
 * — instead of just a bare name on hover.
 */
export function PresenceStack({ users, status, className, onJumpToUser }: PresenceStackProps) {
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
        {visible.map((user) => {
          const clickable = Boolean(onJumpToUser && user.cursorLine != null);
          return (
            <button
              key={user.clientId}
              type="button"
              disabled={!clickable}
              onClick={() => {
                if (clickable && user.cursorLine != null) onJumpToUser!(user.userId, user.cursorLine);
              }}
              title={presenceTooltip(user)}
              className={cn(
                "flex h-6 w-6 items-center justify-center rounded-full border-2 text-[10px] font-bold text-bg transition-transform",
                clickable && "cursor-pointer hover:z-10 hover:scale-110"
              )}
              style={{ borderColor: user.color, backgroundColor: user.color }}
            >
              {initials(user.name)}
            </button>
          );
        })}
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

function presenceTooltip(user: PresenceUser): string {
  if (user.cursorLine != null) return `${user.name} — line ${user.cursorLine}${user.idle ? " (idle)" : ""}`;
  return user.idle ? `${user.name} (idle)` : user.name;
}

function initials(name: string): string {
  const trimmed = name.trim();
  if (!trimmed) return "?";
  const parts = trimmed.split(/\s+/);
  if (parts.length === 1) return parts[0][0]?.toUpperCase() ?? "?";
  return ((parts[0][0] ?? "") + (parts[parts.length - 1][0] ?? "")).toUpperCase();
}
