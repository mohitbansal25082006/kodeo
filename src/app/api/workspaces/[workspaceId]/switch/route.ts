// src/app/api/workspaces/[workspaceId]/switch/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { setActiveWorkspace } from "@/lib/workspace/queries";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ workspaceId: string }> }
) {
  const session = await auth.api.getSession({ headers: request.headers });

  if (!session?.user) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const { workspaceId } = await params;
  const ok = await setActiveWorkspace(session.user.id, workspaceId);

  if (!ok) {
    return NextResponse.json(
      { error: "Workspace not found, or you're not a member of it." },
      { status: 404 }
    );
  }

  return NextResponse.json({ success: true, activeWorkspaceId: workspaceId });
}
