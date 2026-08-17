"use client";

import * as React from "react";
import type * as awarenessProtocol from "y-protocols/awareness.js";
import type { CollabProvider } from "@/lib/collab/collab-provider";
import { updateRemoteCursorStyles, removeRemoteCursorStyles, type RemoteAwarenessUser } from "@/lib/collab/remote-cursor-styles";

export interface PresenceUser {
  clientId: number;
  userId: string;
  name: string;
  color: string;
  /** 1-based line number of this user's cursor, if known — powers presence-stack.tsx's "jump to user" and its tooltip. Null if this user hasn't published a cursor position yet (e.g. connected but not yet focused the editor). */
  cursorLine: number | null;
  /** True once this user's awareness state hasn't changed in a while — see IDLE_THRESHOLD_MS. Surfaced so the presence stack can visually de-emphasize (not remove — that's what the 30s awareness timeout is for) a collaborator who's still connected but has stepped away. */
  idle: boolean;
}

/** How long (ms) a user's awareness state can go unchanged before they're considered idle in the UI. Deliberately much shorter than the Awareness protocol's own 30s "mark offline" timeout (see y-protocols) — idle is a UX hint ("they might not be looking"), not a connectivity signal. */
const IDLE_THRESHOLD_MS = 20_000;
/** How often to re-evaluate idle status. A user whose state genuinely hasn't changed won't fire an awareness "change" event on its own, so idle status needs its own poll rather than being purely event-driven. */
const IDLE_CHECK_INTERVAL_MS = 5_000;

interface TrackedUserMeta {
  lastChangedAt: number;
  fingerprint: string;
}

/**
 * Watches a CollabProvider's awareness state and derives the list of
 * currently-present REMOTE users (excludes the local client's own
 * awareness entry) — this is what powers both the tab-bar/toolbar
 * presence avatar stack and the injected remote-cursor CSS. One
 * subscription per mounted editor instance (`editorInstanceId` keys
 * the injected <style> element so multiple simultaneously-open
 * collaborative tabs never clobber each other's cursor styling).
 */
export function usePresence(
  provider: CollabProvider | null,
  editorInstanceId: string
): PresenceUser[] {
  const [users, setUsers] = React.useState<PresenceUser[]>([]);
  // Tracked outside React state (a ref, not state) since it's pure
  // bookkeeping for idle detection — updating it must never itself
  // trigger a re-render; only the derived `idle` boolean recomputed
  // in readStates() does.
  const metaRef = React.useRef<Map<number, TrackedUserMeta>>(new Map());

  React.useEffect(() => {
    if (!provider) {
      setUsers([]);
      metaRef.current.clear();
      return;
    }

    const awareness = provider.awareness;

    function readStates(): PresenceUser[] {
      const localClientId = provider!.doc.clientID;
      const now = Date.now();
      const seenClientIds = new Set<number>();
      const result: PresenceUser[] = [];

      awareness.getStates().forEach((state: Record<string, unknown>, clientId: number) => {
        if (clientId === localClientId) return; // never render our own cursor back at ourselves
        const user = state.user as { id?: string; name?: string; color?: string } | undefined;
        if (!user?.id) return; // an entry with no identity yet (mid-handshake) isn't presentable

        seenClientIds.add(clientId);

        // Track when this client's state last actually changed, by
        // comparing a cheap serialization against the previous one —
        // awareness "change" fires even for a pure heartbeat
        // (unchanged content re-broadcast to prove liveness, per the
        // protocol's own docs), so naively resetting lastChangedAt on
        // every "change" event would make idle detection never fire
        // for someone who stopped moving their cursor but is still
        // heartbeating.
        const cursor = state.cursor as { lineNumber?: number } | null | undefined;
        const fingerprint = JSON.stringify([user.name, user.color, cursor?.lineNumber]);
        const existingMeta = metaRef.current.get(clientId);
        if (!existingMeta || existingMeta.fingerprint !== fingerprint) {
          metaRef.current.set(clientId, { lastChangedAt: now, fingerprint });
        }

        const meta = metaRef.current.get(clientId)!;
        const idle = now - meta.lastChangedAt > IDLE_THRESHOLD_MS;

        result.push({
          clientId,
          userId: user.id,
          name: user.name || "Anonymous",
          color: user.color || "#a1a1aa",
          cursorLine: typeof cursor?.lineNumber === "number" ? cursor.lineNumber : null,
          idle,
        });
      });

      // Drop tracking metadata for clients no longer present at all,
      // so a long collaborative session doesn't slowly accumulate
      // stale entries for everyone who's ever passed through.
      for (const clientId of metaRef.current.keys()) {
        if (!seenClientIds.has(clientId)) metaRef.current.delete(clientId);
      }

      // Stable order (by userId) so the avatar stack doesn't visibly
      // reshuffle every time an unrelated field (e.g. cursor position)
      // changes on an existing user.
      result.sort((a, b) => a.userId.localeCompare(b.userId));
      return result;
    }

    function handleChange() {
      const next = readStates();
      setUsers(next);
      const styleUsers: RemoteAwarenessUser[] = next.map((u) => ({
        clientId: u.clientId,
        name: u.name,
        color: u.color,
      }));
      updateRemoteCursorStyles(editorInstanceId, styleUsers);
    }

    handleChange(); // initial snapshot — don't wait for the first "change" event
    awareness.on("change", handleChange as (arg: unknown, origin: unknown) => void);

    // Idle status needs to be re-evaluated even when nothing changes
    // (that's the whole point — "20s of silence" is itself the
    // trigger), so a plain interval re-derives it independently of
    // the event-driven path above.
    const idleTimer = setInterval(handleChange, IDLE_CHECK_INTERVAL_MS);

    return () => {
      awareness.off("change", handleChange as (arg: unknown, origin: unknown) => void);
      clearInterval(idleTimer);
      removeRemoteCursorStyles(editorInstanceId);
    };
  }, [provider, editorInstanceId]);

  return users;
}

/** Re-exported for components that need the raw awareness type without importing y-protocols directly. */
export type Awareness = awarenessProtocol.Awareness;
