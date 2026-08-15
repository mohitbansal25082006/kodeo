// src/app/api/workspaces/[workspaceId]/members/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getWorkspaceForUser, listMembers } from "@/lib/workspace/queries";
import { canViewMembers } from "@/lib/workspace/permissions";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ workspaceId: string }> }
) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session?.user) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const { workspaceId } = await params;
  const workspace = await getWorkspaceForUser(workspaceId, session.user.id);
  if (!workspace) {
    return NextResponse.json({ error: "Workspace not found." }, { status: 404 });
  }

  if (!canViewMembers(workspace.role)) {
    return NextResponse.json({ error: "You don't have access to this workspace." }, { status: 403 });
  }

  const members = await listMembers(workspaceId);
  return NextResponse.json({ members, currentUserRole: workspace.role, currentUserId: session.user.id });
}
