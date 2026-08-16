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

  React.useEffect(() => {
    if (!provider) {
      setUsers([]);
      return;
    }

    const awareness = provider.awareness;

    function readStates(): PresenceUser[] {
      const localClientId = provider!.doc.clientID;
      const result: PresenceUser[] = [];
      awareness.getStates().forEach((state: Record<string, unknown>, clientId: number) => {
        if (clientId === localClientId) return; // never render our own cursor back at ourselves
        const user = state.user as { id?: string; name?: string; color?: string } | undefined;
        if (!user?.id) return; // an entry with no identity yet (mid-handshake) isn't presentable
        result.push({
          clientId,
          userId: user.id,
          name: user.name || "Anonymous",
          color: user.color || "#a1a1aa",
        });
      });
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

    return () => {
      awareness.off("change", handleChange as (arg: unknown, origin: unknown) => void);
      removeRemoteCursorStyles(editorInstanceId);
    };
  }, [provider, editorInstanceId]);

  return users;
}

/** Re-exported for components that need the raw awareness type without importing y-protocols directly. */
export type Awareness = awarenessProtocol.Awareness;
