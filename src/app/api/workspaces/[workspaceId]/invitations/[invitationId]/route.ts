// src/app/api/workspaces/[workspaceId]/invitations/[invitationId]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getWorkspaceForUser } from "@/lib/workspace/queries";
import { canRevokeInvitation } from "@/lib/workspace/permissions";
import { revokeInvitation } from "@/lib/workspace/invitation-queries";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ workspaceId: string; invitationId: string }> }
) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session?.user) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const { workspaceId, invitationId } = await params;
  const workspace = await getWorkspaceForUser(workspaceId, session.user.id);
  if (!workspace) {
    return NextResponse.json({ error: "Workspace not found." }, { status: 404 });
  }

  if (!canRevokeInvitation(workspace.role)) {
    return NextResponse.json(
      { error: "You don't have permission to revoke invitations." },
      { status: 403 }
    );
  }

  await revokeInvitation(workspaceId, invitationId);
  return NextResponse.json({ success: true });
}
