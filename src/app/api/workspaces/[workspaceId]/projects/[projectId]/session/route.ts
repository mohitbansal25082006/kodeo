// src/app/api/workspaces/[workspaceId]/projects/[projectId]/session/route.ts
import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { getWorkspaceForUser } from "@/lib/workspace/queries";
import { getProjectById } from "@/lib/project/queries";
import { getEditorPrefs, saveProjectSession } from "@/lib/editor/queries";

const sessionSchema = z.object({
  openNodeIds: z.array(z.string()).max(50), // 50 tabs is already a generous ceiling before "restore my session" starts feeling more like clutter than convenience
  activeNodeId: z.string().nullable(),
});

interface RouteParams {
  params: Promise<{ workspaceId: string; projectId: string }>;
}

async function resolveContext(workspaceId: string, projectId: string) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) {
    return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) } as const;
  }
  const workspace = await getWorkspaceForUser(workspaceId, session.user.id);
  if (!workspace) {
    return { error: NextResponse.json({ error: "Not found" }, { status: 404 }) } as const;
  }
  const project = await getProjectById(workspaceId, projectId);
  if (!project) {
    return { error: NextResponse.json({ error: "Not found" }, { status: 404 }) } as const;
  }
  return { session, workspace, project } as const;
}

/** Fetches which tabs were open last time this user worked in this project — powers session restoration on load. */
export async function GET(_req: NextRequest, { params }: RouteParams) {
  const { workspaceId, projectId } = await params;
  const ctx = await resolveContext(workspaceId, projectId);
  if ("error" in ctx) return ctx.error;

  const prefs = await getEditorPrefs(ctx.session.user.id);
  const projectSession = prefs.openTabsByProject[projectId] ?? { openNodeIds: [], activeNodeId: null };
  return NextResponse.json({ session: projectSession });
}

/**
 * Overwrites which tabs are open for this user+project. Called on a
 * short debounce whenever the open-tabs set changes (open/close/
 * switch), not on every keystroke — this is session bookkeeping, not
 * file content, so it doesn't need auto-save's tighter debounce or
 * its dirty-tracking machinery.
 */
export async function PUT(req: NextRequest, { params }: RouteParams) {
  const { workspaceId, projectId } = await params;
  const ctx = await resolveContext(workspaceId, projectId);
  if ("error" in ctx) return ctx.error;

  const body = await req.json().catch(() => null);
  const parsed = sessionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid session data." }, { status: 400 });
  }

  await saveProjectSession(ctx.session.user.id, projectId, parsed.data);
  return NextResponse.json({ success: true });
}
