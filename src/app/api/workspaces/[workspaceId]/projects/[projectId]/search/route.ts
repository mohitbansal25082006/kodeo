// src/app/api/workspaces/[workspaceId]/projects/[projectId]/search/route.ts
import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { getWorkspaceForUser } from "@/lib/workspace/queries";
import { getProjectById } from "@/lib/project/queries";
import { canViewFiles } from "@/lib/filesystem/permissions";
import { searchFilesByName, searchFileContents } from "@/lib/filesystem/search";

interface RouteParams {
  params: Promise<{ workspaceId: string; projectId: string }>;
}

/**
 * One endpoint for both search modes (?mode=files default, or
 * ?mode=content) rather than two separate routes — they share the
 * exact same auth/scoping logic and are always called from the same
 * command-palette UI, just with a different tab selected, so keeping
 * them together avoids duplicating the resolveContext boilerplate
 * for what is really one feature with two result shapes.
 */
export async function GET(req: NextRequest, { params }: RouteParams) {
  const { workspaceId, projectId } = await params;

  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

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

  const url = new URL(req.url);
  const term = url.searchParams.get("q") ?? "";
  const mode = url.searchParams.get("mode") === "content" ? "content" : "files";

  if (mode === "content") {
    const matches = await searchFileContents(projectId, term);
    return NextResponse.json({ mode, matches });
  }

  const files = await searchFilesByName(projectId, term);
  return NextResponse.json({ mode, files });
}
