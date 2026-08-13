// src/app/api/profile/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { query } from "@/lib/db";
import { z } from "zod";

const profileSchema = z.object({
  name: z.string().min(1, "Name is required.").max(100),
  username: z
    .string()
    .min(3, "Username must be at least 3 characters.")
    .max(24, "Username must be at most 24 characters.")
    .regex(/^[a-z0-9_-]+$/i, "Only letters, numbers, hyphens, and underscores allowed."),
  developerRole: z.string().min(1),
  image: z.string().url().optional(),
});

export async function POST(request: NextRequest) {
  const session = await auth.api.getSession({ headers: request.headers });

  if (!session?.user) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const body = await request.json();
  const parsed = profileSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message || "Invalid input." },
      { status: 400 }
    );
  }

  const { name, username, developerRole, image } = parsed.data;

  const existing = await query<{ id: string }>(
    `SELECT id FROM "user" WHERE lower(username) = lower($1) AND id != $2 LIMIT 1`,
    [username, session.user.id]
  );

  if (existing.length > 0) {
    return NextResponse.json(
      { error: "That username is already taken." },
      { status: 409 }
    );
  }

  await query(
    `UPDATE "user"
     SET name = $1,
         username = $2,
         "developerRole" = $3,
         image = COALESCE($4, image),
         "updatedAt" = now()
     WHERE id = $5`,
    [name, username, developerRole, image ?? null, session.user.id]
  );

  return NextResponse.json({ success: true });
}