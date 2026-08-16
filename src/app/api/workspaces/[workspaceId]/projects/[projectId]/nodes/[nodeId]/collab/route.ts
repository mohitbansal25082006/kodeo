// src/app/api/workspaces/[workspaceId]/projects/[projectId]/nodes/[nodeId]/collab/route.ts
import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { getWorkspaceForUser } from "@/lib/workspace/queries";
import { getProjectById } from "@/lib/project/queries";
import { getNodeSummaryById } from "@/lib/filesystem/queries";
import { canViewFiles, canEditNodeContent } from "@/lib/filesystem/permissions";

interface RouteParams {
  params: Promise<{ workspaceId: string; projectId: string; nodeId: string }>;
}

/**
 * Pre-flight check the client calls once, right before opening the
 * actual WebSocket to the standalone collab server (see
 * ws-server/src/server.ts) — NOT itself a WebSocket endpoint. Exists
 * for two reasons:
 *
 *   1. The collab server is a separate deployment with its own
 *      Postgres connection; letting the browser discover "can I even
 *      attempt this" and "what's the current server-known role" via
 *      the main app's own already-loaded session/workspace context is
 *      faster and gives a much friendlier error than waiting for a
 *      raw WebSocket close code from a different origin (e.g.
 *      distinguishing "you don't have access" from "the collab server
 *      is temporarily down" is much easier as a normal JSON HTTP
 *      response than as a WS close-event code in the browser).
 *   2. It hands back the collab server's base URL from a server-side
 *      env var rather than requiring the client to already know it —
 *      keeping `NEXT_PUBLIC_COLLAB_WS_URL` as the single source of
 *      truth server-side too, so rotating the collab server's address
 *      never requires a client-code change, only an env var update.
 *
 * The actual authorization enforced here is intentionally a SUBSET of
 * (never stricter than) what the collab server itself re-checks on
 * every connection attempt in ws-server/src/lib/auth.ts — this route
 * is a fast-fail UX nicety, not the security boundary. The collab
 * server does not trust this route's answer and performs its own
 * independent session + role lookup at the WebSocket handshake.
 */
export async function GET(_req: NextRequest, { params }: RouteParams) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { workspaceId, projectId, nodeId } = await params;

  const workspace = await getWorkspaceForUser(workspaceId, session.user.id);
  if (!workspace) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (!canViewFiles(workspace.role)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const project = await getProjectById(workspaceId, projectId);
  if (!project) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const node = await getNodeSummaryById(projectId, nodeId);
  if (!node) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (node.type !== "file") {
    return NextResponse.json({ error: "Folders don't support live collaboration." }, { status: 400 });
  }

  const wsBaseUrl = process.env.NEXT_PUBLIC_COLLAB_WS_URL;
  if (!wsBaseUrl) {
    // Collaboration simply isn't configured for this deployment yet
    // (e.g. local dev without the standalone collab server running) —
    // a distinct, actionable error rather than a generic 500, since
    // the client (use-collab.ts) already handles "collaboration
    // unavailable" as a normal, non-fatal state and falls back to
    // Part 3c's plain auto-save-only editing.
    return NextResponse.json(
      { error: "Real-time collaboration is not configured for this deployment." },
      { status: 503 }
    );
  }

  return NextResponse.json({
    wsBaseUrl,
    canEdit: canEditNodeContent(workspace.role),
    role: workspace.role,
  });
}
