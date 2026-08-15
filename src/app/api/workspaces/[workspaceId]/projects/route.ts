// src/app/api/workspaces/[workspaceId]/projects/route.ts
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { getWorkspaceForUser } from "@/lib/workspace/queries";
import { canCreateProject } from "@/lib/workspace/permissions";
import { createProject, listProjects, ProjectSlugExhaustedError } from "@/lib/project/queries";

const createProjectSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters.").max(60),
  description: z.string().max(200).optional(),
  icon: z.string().max(200).optional(),
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

  // Every member (including viewers) can see the project list — only
  // creating/editing/deleting is gated. Matches canViewMembers'
  // "any member" bar for the same reason: read access to what exists
  // in a workspace shouldn't require management privileges.
  const projects = await listProjects(workspaceId);
  return NextResponse.json({ projects });
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

  if (!canCreateProject(workspace.role)) {
    return NextResponse.json(
      { error: "You don't have permission to create projects in this workspace." },
      { status: 403 }
    );
  }

  const body = await request.json().catch(() => null);
  const parsed = createProjectSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message || "Invalid input." },
      { status: 400 }
    );
  }

  try {
    const project = await createProject({
      workspaceId,
      name: parsed.data.name.trim(),
      description: parsed.data.description?.trim() || null,
      icon: parsed.data.icon || null,
      createdById: session.user.id,
    });
    return NextResponse.json({ project }, { status: 201 });
  } catch (err) {
    if (err instanceof ProjectSlugExhaustedError) {
      return NextResponse.json({ error: err.message }, { status: 409 });
    }
    throw err;
  }
}
