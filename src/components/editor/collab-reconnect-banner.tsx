"use client";

import * as React from "react";
import { WifiOff, RefreshCw, ShieldAlert } from "lucide-react";
import { cn } from "@/lib/utils";
import type { CollabProvider, CollabStatus } from "@/lib/collab/collab-provider";

interface CollabReconnectBannerProps {
  status: CollabStatus;
  /** Part 4b — when supplied, the "disconnected" banner shows a manual "Retry now" button that bypasses the exponential backoff timer. Optional so this component still works for any caller that only has a status value, not the provider instance. */
  provider?: CollabProvider | null;
  className?: string;
}

/**
 * Part 4b — a slim, dismissible-feeling banner that appears above the
 * editor pane when the live collaboration connection drops or fails
 * auth, complementing (not replacing) the small always-visible
 * CollabStatusIndicator in the bottom status strip. The bottom strip
 * is easy to miss mid-typing; this banner is deliberately more
 * visible for the states that actually warrant interrupting the
 * person's attention — but only those states. "Connecting" (the very
 * first connect, before anyone would have noticed anything was ever
 * live) does NOT show this banner, only the strip — showing a banner
 * on every fresh page load would train people to ignore it.
 *
 * Auto-hides itself once status returns to "connected" — no manual
 * dismiss needed for the transient "disconnected" case, since
 * reconnection is automatic (collab-provider.ts's exponential
 * backoff) and the banner disappearing IS the confirmation that it
 * worked.
 */
export function CollabReconnectBanner({ status, provider, className }: CollabReconnectBannerProps) {
  // Track whether we've EVER been connected in this mount — this is
  // what distinguishes "still doing the very first connect" (no
  // banner, just let the strip's "Connecting…" handle it) from "WAS
  // connected, then dropped" (banner warranted, something changed
  // that the person should notice).
  const everConnectedRef = React.useRef(false);
  React.useEffect(() => {
    if (status === "connected") everConnectedRef.current = true;
  }, [status]);

  if (status === "connected") return null;
  if (status === "connecting" && !everConnectedRef.current) return null;

  if (status === "disconnected") {
    return (
      <div
        role="status"
        className={cn(
          "flex items-center justify-between gap-2 border-b border-warning/30 bg-warning/10 px-3 py-1.5 text-xs text-warning",
          className
        )}
      >
        <span className="flex items-center gap-2">
          <RefreshCw className="h-3.5 w-3.5 animate-spin" />
          Reconnecting to live collaboration — your edits are safe and will sync once reconnected.
        </span>
        {provider && (
          <button
            onClick={() => provider.reconnectNow()}
            className="shrink-0 rounded-md border border-warning/40 px-2 py-0.5 font-medium transition-colors hover:bg-warning/20"
          >
            Retry now
          </button>
        )}
      </div>
    );
  }

  if (status === "connecting" && everConnectedRef.current) {
    return (
      <div
        role="status"
        className={cn(
          "flex items-center gap-2 border-b border-warning/30 bg-warning/10 px-3 py-1.5 text-xs text-warning",
          className
        )}
      >
        <RefreshCw className="h-3.5 w-3.5 animate-spin" />
        <span>Reconnecting…</span>
      </div>
    );
  }

  if (status === "unauthorized") {
    return (
      <div
        role="alert"
        className={cn(
          "flex items-center justify-between gap-2 border-b border-danger/30 bg-danger/10 px-3 py-1.5 text-xs text-danger",
          className
        )}
      >
        <span className="flex items-center gap-2">
          <ShieldAlert className="h-3.5 w-3.5" />
          Your session has expired. Live collaboration is paused until you sign in again.
        </span>
        <button
          onClick={() => window.location.reload()}
          className="shrink-0 rounded-md border border-danger/40 px-2 py-0.5 font-medium transition-colors hover:bg-danger/20"
        >
          Refresh
        </button>
      </div>
    );
  }

  if (status === "forbidden") {
    return (
      <div
        role="alert"
        className={cn(
          "flex items-center gap-2 border-b border-danger/30 bg-danger/10 px-3 py-1.5 text-xs text-danger",
          className
        )}
      >
        <WifiOff className="h-3.5 w-3.5" />
        <span>You no longer have access to this file&apos;s live session. Your local view may be out of date.</span>
      </div>
    );
  }

  return null;
}
