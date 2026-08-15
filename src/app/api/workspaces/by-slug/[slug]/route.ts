// src/app/api/workspaces/by-slug/[slug]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getWorkspaceBySlugForUser } from "@/lib/workspace/queries";

/**
 * Client-side slug→workspace lookup. The /w/[slug]/* pages themselves
 * are server components and call getWorkspaceBySlugForUser directly
 * (no network round trip needed) — this route exists for client
 * components that only have the slug on hand, e.g. a future
 * "switch and go to settings" action from the workspace switcher.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session?.user) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const { slug } = await params;
  const workspace = await getWorkspaceBySlugForUser(slug, session.user.id);

  if (!workspace) {
    return NextResponse.json({ error: "Workspace not found." }, { status: 404 });
  }

  return NextResponse.json({ workspace });
}
