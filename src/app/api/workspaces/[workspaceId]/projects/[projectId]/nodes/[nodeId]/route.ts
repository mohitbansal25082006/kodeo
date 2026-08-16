// src/app/api/workspaces/[workspaceId]/projects/[projectId]/nodes/[nodeId]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { getWorkspaceForUser } from "@/lib/workspace/queries";
import { getProjectById } from "@/lib/project/queries";
import { canViewFiles, canRenameNode, canEditNodeContent, canDeleteNode } from "@/lib/filesystem/permissions";
import {
  getNodeById,
  getNodeSummaryById,
  updateNodeContent,
  renameNode,
  moveNode,
  deleteNode,
  getDescendantIds,
  folderExists,
  DuplicateNameError,
  CycleError,
} from "@/lib/filesystem/queries";
import { isValidNodeName, MAX_FILE_SIZE_BYTES } from "@/lib/filesystem/types";

const patchSchema = z
  .object({
    name: z.string().min(1).max(255).optional(),
    parentId: z.string().nullable().optional(),
    content: z.string().max(MAX_FILE_SIZE_BYTES).optional(),
  })
  .refine((v) => v.name !== undefined || v.parentId !== undefined || v.content !== undefined, {
    message: "Nothing to update.",
  });

interface RouteParams {
  params: Promise<{ workspaceId: string; projectId: string; nodeId: string }>;
}

async function resolveContext(workspaceId: string, projectId: string) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) {
    return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) } as const;
  }

  const workspace = await getWorkspaceForUser(workspaceId, session.user.id);
  if (!workspace) {
    return { error: NextResponse.json({ error: "Not found" }, { status: 404 }) } as const;
  }

  const project = await getProjectById(workspaceId, projectId);
  if (!project) {
    return { error: NextResponse.json({ error: "Not found" }, { status: 404 }) } as const;
  }

  return { session, workspace, project } as const;
}

/** Fetches a single file's full content (including the text body Part 3b's editor loads on tab-open) — deliberately separate from the tree endpoint's summaries, see ProjectNodeSummary's doc comment in types.ts. */
export async function GET(_req: NextRequest, { params }: RouteParams) {
  const { workspaceId, projectId, nodeId } = await params;
  const ctx = await resolveContext(workspaceId, projectId);
  if ("error" in ctx) return ctx.error;

  if (!canViewFiles(ctx.workspace.role)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const node = await getNodeById(projectId, nodeId);
  if (!node) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (node.type !== "file") {
    return NextResponse.json({ error: "Folders don't have content." }, { status: 400 });
  }

  return NextResponse.json({ node });
}

export async function PATCH(req: NextRequest, { params }: RouteParams) {
  const { workspaceId, projectId, nodeId } = await params;
  const ctx = await resolveContext(workspaceId, projectId);
  if ("error" in ctx) return ctx.error;

  const body = await req.json().catch(() => null);
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0]?.message ?? "Invalid request." }, { status: 400 });
  }
  const { name, parentId, content } = parsed.data;

  const existing = await getNodeSummaryById(projectId, nodeId);
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  try {
    // Content-only save (auto-save path, Part 3b/3c): gated by
    // canEditNodeContent, distinct from rename/move's canRenameNode —
    // both currently resolve to the same "editor+" bar (see
    // permissions.ts), but kept as separate checks since editing a
    // file's text and restructuring the tree are different actions
    // that could reasonably diverge in a future role.
    if (content !== undefined && name === undefined && parentId === undefined) {
      if (!canEditNodeContent(ctx.workspace.role)) {
        return NextResponse.json({ error: "You don't have permission to edit this file." }, { status: 403 });
      }
      if (existing.type !== "file") {
        return NextResponse.json({ error: "Folders don't have content." }, { status: 400 });
      }
      const node = await updateNodeContent(projectId, nodeId, content);
      return NextResponse.json({ node });
    }

    // Rename and/or move.
    if (!canRenameNode(ctx.workspace.role)) {
      return NextResponse.json({ error: "You don't have permission to modify this." }, { status: 403 });
    }

    if (name !== undefined) {
      const nameCheck = isValidNodeName(name);
      if (!nameCheck.valid) {
        return NextResponse.json({ error: nameCheck.error }, { status: 400 });
      }
    }

    if (parentId !== undefined && parentId !== null) {
      if (parentId === nodeId) {
        return NextResponse.json({ error: "Can't move a folder into itself." }, { status: 400 });
      }
      const parentIsFolder = await folderExists(projectId, parentId);
      if (!parentIsFolder) {
        return NextResponse.json({ error: "Destination folder not found." }, { status: 400 });
      }
      if (existing.type === "folder") {
        const descendants = await getDescendantIds(projectId, nodeId);
        if (descendants.has(parentId)) {
          return NextResponse.json(
            { error: "Can't move a folder into one of its own subfolders." },
            { status: 400 }
          );
        }
      }
    }

    let node = existing;
    if (parentId !== undefined) {
      node = await moveNode(projectId, nodeId, parentId, name);
    } else if (name !== undefined) {
      node = await renameNode(projectId, nodeId, name);
    }

    return NextResponse.json({ node });
  } catch (err) {
    if (err instanceof DuplicateNameError) {
      return NextResponse.json({ error: err.message }, { status: 409 });
    }
    if (err instanceof CycleError) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
    console.error("Failed to update node:", err);
    return NextResponse.json({ error: "Something went wrong. Try again." }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: RouteParams) {
  const { workspaceId, projectId, nodeId } = await params;
  const ctx = await resolveContext(workspaceId, projectId);
  if ("error" in ctx) return ctx.error;

  if (!canDeleteNode(ctx.workspace.role)) {
    return NextResponse.json({ error: "You don't have permission to delete this." }, { status: 403 });
  }

  const existing = await getNodeSummaryById(projectId, nodeId);
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await deleteNode(projectId, nodeId);
  return NextResponse.json({ success: true });
}
