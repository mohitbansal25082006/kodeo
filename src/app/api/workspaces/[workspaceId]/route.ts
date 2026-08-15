// src/app/api/workspaces/[workspaceId]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { isUniqueViolation } from "@/lib/db";
import {
  getWorkspaceForUser,
  updateWorkspace,
  deleteWorkspace,
} from "@/lib/workspace/queries";
import { canEditWorkspaceDetails, canDeleteWorkspace } from "@/lib/workspace/permissions";
import { isValidSlug } from "@/lib/workspace/slug";

const updateSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters.").max(60).optional(),
  description: z.string().max(200).nullable().optional(),
  icon: z.string().max(200).nullable().optional(),
  slug: z
    .string()
    .min(3, "URL must be at least 3 characters.")
    .max(48, "URL must be at most 48 characters.")
    .refine(isValidSlug, "Only lowercase letters, numbers, and hyphens allowed.")
    .optional(),
});

export async function PATCH(
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

  if (!canEditWorkspaceDetails(workspace.role)) {
    return NextResponse.json(
      { error: "You don't have permission to edit this workspace." },
      { status: 403 }
    );
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
    const updated = await updateWorkspace(workspaceId, {
      name: parsed.data.name?.trim(),
      description:
        parsed.data.description === undefined
          ? undefined
          : parsed.data.description?.trim() || null,
      icon: parsed.data.icon,
      slug: parsed.data.slug,
    });
    return NextResponse.json({ workspace: updated });
  } catch (err) {
    if (isUniqueViolation(err)) {
      return NextResponse.json(
        { error: "That workspace URL is already taken." },
        { status: 409 }
      );
    }
    throw err;
  }
}

export async function DELETE(
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

  if (!canDeleteWorkspace(workspace.role)) {
    return NextResponse.json(
      { error: "Only the workspace owner can delete it." },
      { status: 403 }
    );
  }

  await deleteWorkspace(workspaceId);
  return NextResponse.json({ success: true });
}
