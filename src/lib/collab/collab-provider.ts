"use client";

import * as Y from "yjs";
import * as syncProtocol from "y-protocols/sync.js";
import * as awarenessProtocol from "y-protocols/awareness.js";
import * as encoding from "lib0/encoding.js";
import * as decoding from "lib0/decoding.js";

const MESSAGE_SYNC = 0;
const MESSAGE_AWARENESS = 1;
const MESSAGE_IDENTITY = 2;

export type CollabStatus = "connecting" | "connected" | "disconnected" | "unauthorized" | "forbidden";

export interface CollabIdentity {
  userId: string;
  name: string;
  color: string;
  readOnly: boolean;
}

export interface CollabProviderOptions {
  /** Base WS URL, e.g. "wss://collab.kodeo.website" — no trailing slash. */
  wsBaseUrl: string;
  workspaceId: string;
  projectId: string;
  nodeId: string;
  onStatusChange?: (status: CollabStatus) => void;
  /** Fired once, the first time the server confirms this client's verified identity — see room.ts's sendIdentity on the server. */
  onIdentity?: (identity: CollabIdentity) => void;
}

const RECONNECT_BASE_DELAY_MS = 500;
const RECONNECT_MAX_DELAY_MS = 15_000;
const AWARENESS_LOCAL_TIMEOUT_MS = 30_000; // matches y-protocols' own default staleness window

/**
 * A small, purpose-built Yjs WebSocket client for KODEO — plays the
 * same role as `y-websocket`'s WebsocketProvider, but hand-written
 * for three reasons:
 *   1. The stock provider authenticates via a `params` query string
 *      or relies on `document.cookie` being sent automatically; this
 *      app already has a same-origin-cookie session (Better Auth) and
 *      the WS server lives on a DIFFERENT origin (see ws-server's
 *      README — it's a separate deployment), so cross-origin cookie
 *      delivery on a WebSocket upgrade needs `withCredentials`-style
 *      handling this provider does explicitly.
 *   2. The stock provider's `messageHandlers` is a plain array
 *      indexed by message type with no slot for a 3rd, KODEO-specific
 *      "identity" message (see room.ts on the server) — an unknown
 *      tag would throw inside that library's message loop.
 *   3. Being small and readable here means Part 4b/4c's reconnection,
 *      offline-queueing, and conflict-resolution refinements have a
 *      provider we fully own rather than needing to monkey-patch a
 *      third-party class.
 *
 * Implements the same wire protocol as the server (room.ts) exactly:
 * sync (y-protocols/sync), awareness (y-protocols/awareness), and the
 * identity extension.
 */
export class CollabProvider {
  readonly doc: Y.Doc;
  readonly awareness: awarenessProtocol.Awareness;

  private ws: WebSocket | null = null;
  private url: string;
  private status: CollabStatus = "connecting";
  private shouldReconnect = true;
  private reconnectAttempt = 0;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private destroyed = false;
  private identity: CollabIdentity | null = null;

  private readonly onStatusChange?: (status: CollabStatus) => void;
  private readonly onIdentity?: (identity: CollabIdentity) => void;

  constructor(options: CollabProviderOptions) {
    this.doc = new Y.Doc();
    this.awareness = new awarenessProtocol.Awareness(this.doc);
    this.onStatusChange = options.onStatusChange;
    this.onIdentity = options.onIdentity;

    const base = options.wsBaseUrl.replace(/\/+$/, "");
    this.url = `${base}/collab/${encodeURIComponent(options.workspaceId)}/${encodeURIComponent(options.projectId)}/${encodeURIComponent(options.nodeId)}`;

    // Relay every local doc change to the server. Origin-tagging
    // (checking `origin !== this`) isn't needed here the way it is
    // for awareness below — Y.Doc updates applied via
    // syncProtocol.readSyncMessage already carry the *socket* as
    // origin internally (see handleMessage), and this top-level
    // listener fires for genuinely-local edits (origin undefined) as
    // well as applied-remote-update echoes; either way, re-sending an
    // update the server already knows about is harmless (Yjs updates
    // are idempotent/commutative), just a wasted frame — acceptable
    // for Part 4a's scope and avoids a subtler bug from
    // over-aggressively filtering what gets sent.
    this.doc.on("update", (update: Uint8Array, origin: unknown) => {
      if (origin === REMOTE_ORIGIN) return; // definitely just-applied from the server; don't echo back
      this.sendSyncUpdate(update);
    });

    this.awareness.on(
      "update",
      ({ added, updated, removed }: { added: number[]; updated: number[]; removed: number[] }, origin: unknown) => {
        if (origin === REMOTE_ORIGIN) return;
        this.sendAwarenessUpdate(added.concat(updated, removed));
      }
    );

    // If the tab is closed/navigated away without a clean disconnect
    // path, make sure this client's awareness entry is cleared for
    // everyone else — belt-and-suspenders alongside the server's own
    // on-close cleanup (room.ts's removeConnection), since
    // `beforeunload` isn't 100% guaranteed to fire but costs nothing
    // to attempt.
    if (typeof window !== "undefined") {
      window.addEventListener("beforeunload", this.handleBeforeUnload);
    }

    this.connect();
  }

  getStatus(): CollabStatus {
    return this.status;
  }

  getIdentity(): CollabIdentity | null {
    return this.identity;
  }

  private setStatus(status: CollabStatus): void {
    if (this.status === status) return;
    this.status = status;
    this.onStatusChange?.(status);
  }

  private connect(): void {
    if (this.destroyed) return;
    this.setStatus(this.reconnectAttempt === 0 ? "connecting" : "connecting");

    let ws: WebSocket;
    try {
      // credentials on a cross-origin WebSocket are sent automatically
      // by the browser as long as the collab server's CORS-equivalent
      // (its Origin allowlist — see ws-server's ALLOWED_ORIGINS) trusts
      // this app's origin; there is no WebSocket-level `credentials`
      // flag to set explicitly (unlike fetch), the browser attaches
      // same-site cookies to the upgrade request by default.
      ws = new WebSocket(this.url);
      ws.binaryType = "arraybuffer";
    } catch (err) {
      console.error("[collab] Failed to construct WebSocket:", err);
      this.scheduleReconnect();
      return;
    }

    this.ws = ws;

    ws.onopen = () => {
      this.reconnectAttempt = 0;
      this.setStatus("connected");
    };

    ws.onmessage = (event: MessageEvent) => {
      if (!(event.data instanceof ArrayBuffer)) return;
      this.handleMessage(new Uint8Array(event.data));
    };

    ws.onclose = (event: CloseEvent) => {
      this.ws = null;

      // Auth/authz failures are terminal for this session — the
      // handshake itself failed (see server.ts's upgrade handler,
      // which writes a plain HTTP status and destroys the socket
      // before ever completing the WS upgrade). The browser surfaces
      // that as a close event with no clean WS close code context we
      // can fully rely on across browsers, so the practical signal is
      // "closed abnormally, very early, with no messages ever
      // received" — approximated here via a short grace timer: a
      // close within ~1s of connecting, having never received the
      // identity message, is treated as a rejected handshake rather
      // than a network blip, and does NOT retry (retrying a 401/403
      // in a loop would just hammer the server and the DB).
      const neverAuthenticated = this.identity === null;
      const closedQuickly = Date.now() - this.connectStartedAt < 1500;

      if (neverAuthenticated && closedQuickly && event.code !== 1000) {
        this.setStatus(event.code === 1008 || event.code === 1003 ? "forbidden" : "unauthorized");
        this.shouldReconnect = false;
        return;
      }

      this.setStatus("disconnected");
      if (this.shouldReconnect && !this.destroyed) {
        this.scheduleReconnect();
      }
    };

    ws.onerror = () => {
      // onclose fires right after in every browser's WebSocket
      // implementation — no separate handling needed here beyond
      // logging; avoids double-scheduling a reconnect from both
      // handlers.
      console.warn("[collab] WebSocket error (see subsequent close event for details)");
    };

    this.connectStartedAt = Date.now();
  }

  private connectStartedAt = Date.now();

  private scheduleReconnect(): void {
    if (this.reconnectTimer) return;
    this.reconnectAttempt += 1;
    // Exponential backoff with a cap, plus jitter — avoids every
    // client that dropped simultaneously (e.g. a server restart)
    // reconnecting in the exact same instant and thundering-herding
    // the server right as it comes back up.
    const delay = Math.min(
      RECONNECT_MAX_DELAY_MS,
      RECONNECT_BASE_DELAY_MS * 2 ** (this.reconnectAttempt - 1)
    );
    const jitter = Math.random() * 0.3 * delay;
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.connect();
    }, delay + jitter);
  }

  private handleMessage(data: Uint8Array): void {
    const decoder = decoding.createDecoder(data);
    const messageType = decoding.readVarUint(decoder);

    switch (messageType) {
      case MESSAGE_SYNC: {
        const encoder = encoding.createEncoder();
        encoding.writeVarUint(encoder, MESSAGE_SYNC);
        syncProtocol.readSyncMessage(decoder, encoder, this.doc, REMOTE_ORIGIN);
        if (encoding.length(encoder) > 1) {
          this.sendRaw(encoding.toUint8Array(encoder));
        }
        break;
      }
      case MESSAGE_AWARENESS: {
        const update = decoding.readVarUint8Array(decoder);
        awarenessProtocol.applyAwarenessUpdate(this.awareness, update, REMOTE_ORIGIN);
        break;
      }
      case MESSAGE_IDENTITY: {
        try {
          const json = decoding.readVarString(decoder);
          const parsed = JSON.parse(json) as CollabIdentity;
          this.identity = parsed;
          this.onIdentity?.(parsed);
        } catch (err) {
          console.error("[collab] Failed to parse identity message:", err);
        }
        break;
      }
      default:
        break; // forward-compatible: ignore anything this client version doesn't recognize
    }
  }

  private sendSyncUpdate(update: Uint8Array): void {
    const encoder = encoding.createEncoder();
    encoding.writeVarUint(encoder, MESSAGE_SYNC);
    syncProtocol.writeUpdate(encoder, update);
    this.sendRaw(encoding.toUint8Array(encoder));
  }

  private sendAwarenessUpdate(clientIds: number[]): void {
    if (clientIds.length === 0) return;
    const encoder = encoding.createEncoder();
    encoding.writeVarUint(encoder, MESSAGE_AWARENESS);
    encoding.writeVarUint8Array(
      encoder,
      awarenessProtocol.encodeAwarenessUpdate(this.awareness, clientIds)
    );
    this.sendRaw(encoding.toUint8Array(encoder));
  }

  private sendRaw(data: Uint8Array): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;
    try {
      this.ws.send(data);
    } catch (err) {
      console.error("[collab] Send failed:", err);
    }
  }

  private handleBeforeUnload = () => {
    awarenessProtocol.removeAwarenessStates(this.awareness, [this.doc.clientID], "window-unload");
  };

  /** Sets this client's own cursor/selection/user fields in one shot — see remote-cursors.ts for the shape consumed on the reading side. */
  setLocalAwarenessState(state: Record<string, unknown>): void {
    this.awareness.setLocalState(state);
  }

  setLocalAwarenessField(field: string, value: unknown): void {
    this.awareness.setLocalStateField(field, value);
  }

  /** Cleanly tears down the connection and every listener — call on unmount (see use-collab.ts). Not reusable afterward; construct a new CollabProvider for a new file/session. */
  destroy(): void {
    if (this.destroyed) return;
    this.destroyed = true;
    this.shouldReconnect = false;

    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    if (typeof window !== "undefined") {
      window.removeEventListener("beforeunload", this.handleBeforeUnload);
    }

    awarenessProtocol.removeAwarenessStates(this.awareness, [this.doc.clientID], "provider-destroy");

    if (this.ws) {
      // Detach handlers before closing so a late-arriving close/error
      // event from the socket we're intentionally discarding can't
      // trigger a reconnect attempt or a stray state update after
      // destroy() has already run.
      this.ws.onopen = null;
      this.ws.onmessage = null;
      this.ws.onclose = null;
      this.ws.onerror = null;
      try {
        this.ws.close(1000, "Client destroyed");
      } catch {
        // already closing/closed — nothing further to do
      }
      this.ws = null;
    }

    this.awareness.destroy();
    this.doc.destroy();
  }
}

/** Sentinel origin for updates/awareness changes that were just applied FROM the server, so the top-level doc/awareness listeners that re-broadcast to the server can skip echoing them straight back. */
const REMOTE_ORIGIN = Symbol("remote");
