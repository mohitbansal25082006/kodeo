// src/app/api/workspaces/[workspaceId]/invitations/route.ts
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { getWorkspaceForUser } from "@/lib/workspace/queries";
import {
  canInviteMembers,
  canInviteAsRole,
  canViewInvitations,
} from "@/lib/workspace/permissions";
import {
  createInvitation,
  getInvitationToken,
  listPendingInvitations,
  PendingInvitationExistsError,
} from "@/lib/workspace/invitation-queries";
import { sendWorkspaceInvitationEmail } from "@/lib/email";
import { buildInviteUrl } from "@/lib/site-url";
import { INVITABLE_ROLES } from "@/lib/workspace/types";

const inviteSchema = z.object({
  email: z.string().email("Enter a valid email address."),
  role: z.enum(INVITABLE_ROLES as [string, ...string[]]),
});

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

  if (!canViewInvitations(workspace.role)) {
    return NextResponse.json(
      { error: "You don't have permission to view invitations." },
      { status: 403 }
    );
  }

  const invitations = await listPendingInvitations(workspaceId);
  return NextResponse.json({ invitations });
}

export async function POST(
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

  if (!canInviteMembers(workspace.role)) {
    return NextResponse.json(
      { error: "You don't have permission to invite members." },
      { status: 403 }
    );
  }

  const body = await request.json().catch(() => null);
  const parsed = inviteSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message || "Invalid input." },
      { status: 400 }
    );
  }

  const role = parsed.data.role as (typeof INVITABLE_ROLES)[number];
  if (!canInviteAsRole(workspace.role, role)) {
    return NextResponse.json(
      { error: "You can't invite someone at that role." },
      { status: 403 }
    );
  }

  try {
    const invitation = await createInvitation({
      workspaceId,
      email: parsed.data.email,
      role,
      invitedById: session.user.id,
    });

    const token = await getInvitationToken(invitation.id);
    if (token) {
      // Fire-and-await is fine here (invitations are a low-volume,
      // admin-initiated action, unlike OTP emails on the hot sign-up
      // path) — if Resend fails, the invitation row still exists and
      // an admin can see it as pending and the person can still be
      // found via a resend action in a future update.
      await sendWorkspaceInvitationEmail({
        to: invitation.email,
        workspaceName: workspace.name,
        inviterName: session.user.name,
        role: invitation.role,
        acceptUrl: buildInviteUrl(token),
      });
    }

    return NextResponse.json({ invitation }, { status: 201 });
  } catch (err) {
    if (err instanceof PendingInvitationExistsError) {
      return NextResponse.json({ error: err.message }, { status: 409 });
    }
    throw err;
  }
}
