// src/app/api/workspaces/[workspaceId]/members/[memberId]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import {
  getWorkspaceForUser,
  getMemberById,
  updateMemberRole,
  removeMember,
  leaveWorkspace,
  LastOwnerError,
} from "@/lib/workspace/queries";
import { canChangeMemberRole, canRemoveMember, canLeaveWorkspace } from "@/lib/workspace/permissions";
import { WORKSPACE_ROLES } from "@/lib/workspace/types";

const roleSchema = z.object({
  role: z.enum(WORKSPACE_ROLES as [string, ...string[]]),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ workspaceId: string; memberId: string }> }
) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session?.user) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const { workspaceId, memberId } = await params;
  const workspace = await getWorkspaceForUser(workspaceId, session.user.id);
  if (!workspace) {
    return NextResponse.json({ error: "Workspace not found." }, { status: 404 });
  }

  const target = await getMemberById(workspaceId, memberId);
  if (!target) {
    return NextResponse.json({ error: "Member not found." }, { status: 404 });
  }

  const body = await request.json().catch(() => null);
  const parsed = roleSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "A valid role is required." }, { status: 400 });
  }
  const newRole = parsed.data.role as (typeof WORKSPACE_ROLES)[number];

  if (!canChangeMemberRole(workspace.role, target.role, newRole)) {
    return NextResponse.json(
      { error: "You don't have permission to change this member's role." },
      { status: 403 }
    );
  }

  try {
    await updateMemberRole(workspaceId, memberId, newRole);
    return NextResponse.json({ success: true });
  } catch (err) {
    if (err instanceof LastOwnerError) {
      return NextResponse.json({ error: err.message }, { status: 409 });
    }
    throw err;
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ workspaceId: string; memberId: string }> }
) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session?.user) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const { workspaceId, memberId } = await params;
  const workspace = await getWorkspaceForUser(workspaceId, session.user.id);
  if (!workspace) {
    return NextResponse.json({ error: "Workspace not found." }, { status: 404 });
  }

  const target = await getMemberById(workspaceId, memberId);
  if (!target) {
    return NextResponse.json({ error: "Member not found." }, { status: 404 });
  }

  const isSelf = target.userId === session.user.id;

  try {
    if (isSelf) {
      if (!canLeaveWorkspace(workspace.role)) {
        return NextResponse.json(
          { error: "Transfer ownership before leaving this workspace." },
          { status: 409 }
        );
      }
      await leaveWorkspace(workspaceId, session.user.id);
    } else {
      if (!canRemoveMember(workspace.role, target.role)) {
        return NextResponse.json(
          { error: "You don't have permission to remove this member." },
          { status: 403 }
        );
      }
      await removeMember(workspaceId, memberId);
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    if (err instanceof LastOwnerError) {
      return NextResponse.json({ error: err.message }, { status: 409 });
    }
    throw err;
  }
}
