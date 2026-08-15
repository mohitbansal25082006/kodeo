// src/app/api/workspaces/[workspaceId]/projects/[projectId]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { getWorkspaceForUser } from "@/lib/workspace/queries";
import { canEditProject, canDeleteProject } from "@/lib/workspace/permissions";
import {
  getProjectById,
  updateProject,
  deleteProject,
} from "@/lib/project/queries";
import { isUniqueViolation } from "@/lib/db";
import { isValidSlug } from "@/lib/workspace/slug";

const updateSchema = z.object({
  name: z.string().min(2).max(60).optional(),
  description: z.string().max(200).nullable().optional(),
  icon: z.string().max(200).nullable().optional(),
  status: z.enum(["active", "archived"]).optional(),
  slug: z
    .string()
    .min(2)
    .max(48)
    .refine(isValidSlug, "Only lowercase letters, numbers, and hyphens allowed.")
    .optional(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ workspaceId: string; projectId: string }> }
) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session?.user) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const { workspaceId, projectId } = await params;
  const workspace = await getWorkspaceForUser(workspaceId, session.user.id);
  if (!workspace) {
    return NextResponse.json({ error: "Workspace not found." }, { status: 404 });
  }

  if (!canEditProject(workspace.role)) {
    return NextResponse.json(
      { error: "You don't have permission to edit projects in this workspace." },
      { status: 403 }
    );
  }

  const project = await getProjectById(workspaceId, projectId);
  if (!project) {
    return NextResponse.json({ error: "Project not found." }, { status: 404 });
  }

  const body = await request.json().catch(() => null);
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message || "Invalid input." },
      { status: 400 }
    );
  }

  if (Object.keys(parsed.data).length === 0) {
    return NextResponse.json({ error: "Nothing to update." }, { status: 400 });
  }

  try {
    const updated = await updateProject(workspaceId, projectId, {
      name: parsed.data.name?.trim(),
      description:
        parsed.data.description === undefined
          ? undefined
          : parsed.data.description?.trim() || null,
      icon: parsed.data.icon,
      status: parsed.data.status,
      slug: parsed.data.slug,
    });
    return NextResponse.json({ project: updated });
  } catch (err) {
    if (isUniqueViolation(err)) {
      return NextResponse.json(
        { error: "A project with that URL already exists in this workspace." },
        { status: 409 }
      );
    }
    throw err;
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ workspaceId: string; projectId: string }> }
) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session?.user) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const { workspaceId, projectId } = await params;
  const workspace = await getWorkspaceForUser(workspaceId, session.user.id);
  if (!workspace) {
    return NextResponse.json({ error: "Workspace not found." }, { status: 404 });
  }

  const project = await getProjectById(workspaceId, projectId);
  if (!project) {
    return NextResponse.json({ error: "Project not found." }, { status: 404 });
  }

  if (!canDeleteProject(workspace.role, session.user.id, project.createdById)) {
    return NextResponse.json(
      { error: "You don't have permission to delete this project." },
      { status: 403 }
    );
  }

  await deleteProject(workspaceId, projectId);
  return NextResponse.json({ success: true });
}
