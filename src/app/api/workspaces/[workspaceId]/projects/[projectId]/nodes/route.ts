// src/app/api/workspaces/[workspaceId]/projects/[projectId]/nodes/route.ts
import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { getWorkspaceForUser } from "@/lib/workspace/queries";
import { getProjectById } from "@/lib/project/queries";
import { canViewFiles, canCreateNode } from "@/lib/filesystem/permissions";
import {
  listProjectNodes,
  buildTree,
  createNode,
  folderExists,
  DuplicateNameError,
} from "@/lib/filesystem/queries";
import { isValidNodeName, MAX_FILE_SIZE_BYTES } from "@/lib/filesystem/types";

const createNodeSchema = z.object({
  type: z.enum(["file", "folder"]),
  name: z.string().min(1).max(255),
  parentId: z.string().nullable().optional(),
  content: z.string().max(MAX_FILE_SIZE_BYTES).optional(),
});

interface RouteParams {
  params: Promise<{ workspaceId: string; projectId: string }>;
}

/**
 * Shared guard for every /nodes route in this file and [nodeId]/route.ts:
 * resolves the session, confirms workspace membership, confirms the
 * project belongs to that workspace, and returns everything callers
 * need (role, ids) or a ready-to-return NextResponse if any check
 * fails. Kept in one place so the 404-vs-403 non-leakage guarantee
 * from Part 2a (getWorkspaceForUser never distinguishes "doesn't
 * exist" from "not a member") is applied identically to every
 * filesystem route rather than re-implemented per-handler.
 */
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

export async function GET(_req: NextRequest, { params }: RouteParams) {
  const { workspaceId, projectId } = await params;
  const ctx = await resolveContext(workspaceId, projectId);
  if ("error" in ctx) return ctx.error;

  if (!canViewFiles(ctx.workspace.role)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const nodes = await listProjectNodes(projectId);
  const tree = buildTree(nodes);
  return NextResponse.json({ nodes, tree });
}

export async function POST(req: NextRequest, { params }: RouteParams) {
  const { workspaceId, projectId } = await params;
  const ctx = await resolveContext(workspaceId, projectId);
  if ("error" in ctx) return ctx.error;

  if (!canCreateNode(ctx.workspace.role)) {
    return NextResponse.json({ error: "You don't have permission to create files here." }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  const parsed = createNodeSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
  const { type, name, parentId, content } = parsed.data;

  const nameCheck = isValidNodeName(name);
  if (!nameCheck.valid) {
    return NextResponse.json({ error: nameCheck.error }, { status: 400 });
  }

  if (parentId) {
    const parentIsFolder = await folderExists(projectId, parentId);
    if (!parentIsFolder) {
      return NextResponse.json({ error: "Destination folder not found." }, { status: 400 });
    }
  }

  try {
    const node = await createNode({
      projectId,
      parentId: parentId ?? null,
      type,
      name,
      content,
      createdById: ctx.session.user.id,
    });
    return NextResponse.json({ node }, { status: 201 });
  } catch (err) {
    if (err instanceof DuplicateNameError) {
      return NextResponse.json({ error: err.message }, { status: 409 });
    }
    console.error("Failed to create node:", err);
    return NextResponse.json({ error: "Something went wrong. Try again." }, { status: 500 });
  }
}
