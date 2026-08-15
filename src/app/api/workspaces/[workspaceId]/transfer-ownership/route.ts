// src/app/api/workspaces/[workspaceId]/transfer-ownership/route.ts
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { getWorkspaceForUser, transferOwnership } from "@/lib/workspace/queries";
import { canTransferOwnership } from "@/lib/workspace/permissions";

const transferSchema = z.object({
  memberId: z.string().min(1, "A target member is required."),
});

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

  if (!canTransferOwnership(workspace.role)) {
    return NextResponse.json(
      { error: "Only the workspace owner can transfer ownership." },
      { status: 403 }
    );
  }

  const body = await request.json().catch(() => null);
  const parsed = transferSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message || "Invalid input." },
      { status: 400 }
    );
  }

  try {
    await transferOwnership(workspaceId, session.user.id, parsed.data.memberId);
    return NextResponse.json({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Something went wrong.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
