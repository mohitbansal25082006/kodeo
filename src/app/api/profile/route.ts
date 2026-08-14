// src/app/api/profile/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { query, isUniqueViolation } from "@/lib/db";
import { z } from "zod";

const profileSchema = z.object({
  name: z.string().min(1, "Name is required.").max(100),
  username: z
    .string()
    .min(3, "Username must be at least 3 characters.")
    .max(24, "Username must be at most 24 characters.")
    .regex(/^[a-z0-9_-]+$/i, "Only letters, numbers, hyphens, and underscores allowed."),
  developerRole: z.string().min(1),
  // See src/lib/avatar.ts — this can be a Multiavatar seed identifier
  // or a real OAuth photo URL, so it isn't validated as a URL.
  image: z.string().min(1).max(200).optional(),
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

  // Fast-path check — see the comment in src/app/api/onboarding/route.ts
  // for why this alone is not sufficient and the try/catch below is the
  // actual authoritative guard against a race between two concurrent
  // requests for the same username.
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

  try {
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
  } catch (err) {
    if (isUniqueViolation(err)) {
      return NextResponse.json(
        { error: "That username is already taken." },
        { status: 409 }
      );
    }
    throw err;
  }

  return NextResponse.json({ success: true });
}