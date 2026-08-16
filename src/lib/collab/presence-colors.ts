/**
 * Client-side twin of the WS server's src/lib/user-color.ts —
 * deliberately duplicated rather than shared (this app and the collab
 * server are separate deployments with separate dependency graphs,
 * same reasoning as client-tree.ts's duplication of queries.ts's
 * buildTree). In practice the server is the one whose color
 * assignment is authoritative and actually gets broadcast to peers
 * (see room.ts's sendIdentity) — this client copy exists only as a
 * same-palette fallback for the brief window before the server's
 * identity message arrives, so the local user's own cursor/name
 * badge (rendered optimistically before the round trip completes)
 * uses a color from the same palette rather than flashing an
 * unrelated placeholder color.
 */
export const PRESENCE_COLORS = [
  "#f87171",
  "#fb923c",
  "#fbbf24",
  "#a3e635",
  "#4ade80",
  "#2dd4bf",
  "#38bdf8",
  "#818cf8",
  "#c084fc",
  "#f472b6",
  "#fb7185",
  "#60a5fa",
] as const;

export function colorForUserId(userId: string): string {
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = (hash << 5) - hash + userId.charCodeAt(i);
    hash |= 0;
  }
  const index = Math.abs(hash) % PRESENCE_COLORS.length;
  return PRESENCE_COLORS[index];
}
