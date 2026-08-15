// src/app/api/invitations/[token]/accept/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import {
  acceptInvitation,
  InvitationNotFoundError,
  InvitationExpiredError,
} from "@/lib/workspace/invitation-queries";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session?.user) {
    return NextResponse.json({ error: "Sign in to accept this invitation." }, { status: 401 });
  }

  const { token } = await params;

  try {
    const result = await acceptInvitation(token, session.user.id, session.user.email);
    return NextResponse.json({ success: true, ...result });
  } catch (err) {
    if (err instanceof InvitationNotFoundError) {
      return NextResponse.json({ error: err.message }, { status: 404 });
    }
    if (err instanceof InvitationExpiredError) {
      return NextResponse.json({ error: err.message }, { status: 410 });
    }
    throw err;
  }
}
