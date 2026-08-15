// src/app/api/invitations/[token]/decline/route.ts
import { NextRequest, NextResponse } from "next/server";
import { declineInvitation, InvitationNotFoundError } from "@/lib/workspace/invitation-queries";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;

  try {
    await declineInvitation(token);
    return NextResponse.json({ success: true });
  } catch (err) {
    if (err instanceof InvitationNotFoundError) {
      return NextResponse.json({ error: err.message }, { status: 404 });
    }
    throw err;
  }
}
