"use client";

import * as React from "react";
import { Loader2, WifiOff, ShieldAlert, Wifi } from "lucide-react";
import { cn } from "@/lib/utils";
import type { CollabStatus } from "@/lib/collab/collab-provider";

interface CollabStatusIndicatorProps {
  status: CollabStatus;
  className?: string;
}

/**
 * Sits in the editor's bottom status strip (editor-shell.tsx),
 * alongside Part 3c's SaveStatusIndicator — the two are
 * complementary, not redundant: SaveStatusIndicator reports whether
 * THIS client's edits have reached Postgres, while this reports
 * whether THIS client is live-syncing with other collaborators at
 * all. A file can be fully "Saved" while collaboration is
 * "disconnected" (e.g. a viewer-only session with nothing to save in
 * the first place, or the collab server being briefly unreachable
 * while auto-save's own independent PATCH path keeps working).
 */
export function CollabStatusIndicator({ status, className }: CollabStatusIndicatorProps) {
  const config = STATUS_CONFIG[status];

  return (
    <div className={cn("flex items-center gap-1.5 text-[11px]", config.className, className)} title={config.title}>
      {config.icon}
      <span>{config.label}</span>
    </div>
  );
}

const STATUS_CONFIG: Record<
  CollabStatus,
  { icon: React.ReactNode; label: string; title: string; className: string }
> = {
  connecting: {
    icon: <Loader2 className="h-3 w-3 animate-spin" />,
    label: "Connecting…",
    title: "Connecting to the live collaboration session",
    className: "text-tertiary",
  },
  connected: {
    icon: <Wifi className="h-3 w-3" />,
    label: "Live",
    title: "Connected — edits sync in real time",
    className: "text-success",
  },
  disconnected: {
    icon: <WifiOff className="h-3 w-3" />,
    label: "Reconnecting…",
    title: "Connection lost — trying to reconnect. Your local edits are safe and will sync once reconnected.",
    className: "text-warning",
  },
  unauthorized: {
    icon: <ShieldAlert className="h-3 w-3" />,
    label: "Signed out",
    title: "Your session has expired — refresh the page and sign in again to resume live collaboration.",
    className: "text-danger",
  },
  forbidden: {
    icon: <ShieldAlert className="h-3 w-3" />,
    label: "No access",
    title: "You no longer have access to this file's live collaboration session.",
    className: "text-danger",
  },
};
