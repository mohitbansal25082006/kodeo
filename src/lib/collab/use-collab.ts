"use client";

import * as React from "react";
import { CollabProvider, type CollabStatus, type CollabIdentity } from "@/lib/collab/collab-provider";
import { colorForUserId } from "@/lib/collab/presence-colors";

export interface UseCollabOptions {
  /** null/undefined disables collaboration entirely for this render — used when the collab server URL isn't configured, or the tab isn't the active one (see editor-shell.tsx's Part 4 wiring: only the active tab needs a live socket). */
  enabled: boolean;
  workspaceId: string;
  projectId: string;
  nodeId: string;
  /** The signed-in user's own display name — set as this client's awareness `user.name` immediately, without waiting for the server's identity round-trip, so the local cursor badge never flashes an empty/placeholder name. The server's own identity message (authoritative) can only ever confirm or correct this, never let a client claim to BE someone else, since the server never reads this value back for anything security-relevant — see collab-provider.ts's identity handling. */
  localUserId: string;
  localUserName: string;
}

export interface UseCollabResult {
  provider: CollabProvider | null;
  status: CollabStatus;
  /** True once the server has confirmed this connection is read-only (viewer role) — MonacoBinding still renders remote edits either way, but the local Monaco instance should also be set to readOnly so a viewer can't even attempt a local edit that the server would silently drop. */
  readOnly: boolean;
  /** True if the pre-flight config check (GET .../collab) failed or real-time collaboration isn't configured for this deployment — editor-shell.tsx uses this to silently fall back to Part 3c's plain auto-save-only editing rather than showing a broken "Connecting…" indicator forever. */
  unavailable: boolean;
}

/**
 * Owns the lifecycle of exactly one CollabProvider, scoped to
 * (workspaceId, projectId, nodeId) — a new provider is created
 * whenever any of those change, and the previous one is cleanly
 * destroyed first. This is what editor-shell.tsx uses per open tab;
 * see its Part 4 wiring for why only the *active* tab gets `enabled:
 * true` (every open tab holding its own live WebSocket connection
 * would multiply server load for no benefit — a background tab's
 * content still updates correctly the moment it becomes active and
 * a fresh provider connects and syncs).
 *
 * Before opening the actual WebSocket, this hook first calls the
 * Next.js pre-flight route (.../nodes/[nodeId]/collab) — see that
 * route's doc comment for why: faster, friendlier errors than a raw
 * cross-origin WS close code, and it's what supplies the collab
 * server's base URL from server-side config rather than requiring
 * NEXT_PUBLIC_COLLAB_WS_URL to be read directly (though that remains
 * the underlying source of truth server-side either way).
 */
export function useCollab(options: UseCollabOptions): UseCollabResult {
  const { enabled, workspaceId, projectId, nodeId, localUserId, localUserName } = options;

  const [provider, setProvider] = React.useState<CollabProvider | null>(null);
  const [status, setStatus] = React.useState<CollabStatus>("connecting");
  const [readOnly, setReadOnly] = React.useState(false);
  const [unavailable, setUnavailable] = React.useState(false);

  React.useEffect(() => {
    if (!enabled) {
      setProvider(null);
      setStatus("disconnected");
      setUnavailable(false);
      return;
    }

    let cancelled = false;
    let created: CollabProvider | null = null;
    setUnavailable(false);
    setStatus("connecting");

    async function start() {
      let wsBaseUrl: string;
      try {
        const res = await fetch(
          `/api/workspaces/${workspaceId}/projects/${projectId}/nodes/${nodeId}/collab`
        );
        if (!res.ok) {
          if (!cancelled) setUnavailable(true);
          return;
        }
        const data = await res.json();
        if (!data.wsBaseUrl) {
          if (!cancelled) setUnavailable(true);
          return;
        }
        wsBaseUrl = data.wsBaseUrl as string;
      } catch (err) {
        console.error("[collab] Pre-flight config check failed:", err);
        if (!cancelled) setUnavailable(true);
        return;
      }

      if (cancelled) return;

      const next = new CollabProvider({
        wsBaseUrl,
        workspaceId,
        projectId,
        nodeId,
        onStatusChange: (s) => {
          if (!cancelled) setStatus(s);
        },
        onIdentity: (identity: CollabIdentity) => {
          if (!cancelled) setReadOnly(identity.readOnly);
        },
      });

      // Optimistic local awareness identity — see UseCollabOptions'
      // localUserName doc comment for why this is safe to set
      // immediately rather than waiting for the server round-trip.
      next.setLocalAwarenessState({
        user: {
          id: localUserId,
          name: localUserName,
          color: colorForUserId(localUserId),
        },
        cursor: null,
        selection: null,
      });

      created = next;
      setProvider(next);
    }

    start();

    return () => {
      cancelled = true;
      created?.destroy();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, workspaceId, projectId, nodeId, localUserId, localUserName]);

  return { provider, status, readOnly, unavailable };
}
