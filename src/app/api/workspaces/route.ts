// src/app/api/workspaces/route.ts
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { createWorkspace, listWorkspacesForUser, SlugExhaustedError } from "@/lib/workspace/queries";

const createWorkspaceSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters.").max(60, "Name must be at most 60 characters."),
  description: z.string().max(200, "Description must be at most 200 characters.").optional(),
  icon: z.string().max(200).optional(),
});

export async function GET(request: NextRequest) {
  const session = await auth.api.getSession({ headers: request.headers });

  if (!session?.user) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const workspaces = await listWorkspacesForUser(session.user.id);
  return NextResponse.json({ workspaces });
}

export async function POST(request: NextRequest) {
  const session = await auth.api.getSession({ headers: request.headers });

  if (!session?.user) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = createWorkspaceSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message || "Invalid input." },
      { status: 400 }
    );
  }

  try {
    const workspace = await createWorkspace({
      name: parsed.data.name.trim(),
      description: parsed.data.description?.trim() || null,
      icon: parsed.data.icon || null,
      ownerId: session.user.id,
    });

    return NextResponse.json({ workspace }, { status: 201 });
  } catch (err) {
    if (err instanceof SlugExhaustedError) {
      return NextResponse.json(
        { error: "Couldn't generate a unique workspace URL. Try a different name." },
        { status: 409 }
      );
    }
    throw err;
  }
}
