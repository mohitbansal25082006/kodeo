// src/app/api/onboarding/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { query } from "@/lib/db";
import { z } from "zod";

const onboardingSchema = z.object({
  username: z
    .string()
    .min(3, "Username must be at least 3 characters.")
    .max(24, "Username must be at most 24 characters.")
    .regex(/^[a-z0-9_-]+$/i, "Only letters, numbers, hyphens, and underscores allowed."),
  developerRole: z.string().min(1, "Please select a role."),
  // Can be either a Multiavatar seed identifier (e.g. "jane-r0-3") from
  // the avatar picker, or a real photo URL from Google/GitHub OAuth —
  // see src/lib/avatar.ts for how these two shapes are told apart when
  // rendering. Deliberately NOT validated as a URL here since the seed
  // form isn't one; length-capped instead as a sanity bound.
  image: z.string().min(1).max(200).optional(),
});

export async function POST(request: NextRequest) {
  const session = await auth.api.getSession({ headers: request.headers });

  if (!session?.user) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const body = await request.json();
  const parsed = onboardingSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message || "Invalid input." },
      { status: 400 }
    );
  }

  const { username, developerRole, image } = parsed.data;

  // Raw SQL uniqueness check — case-insensitive, excluding the current user.
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
     SET username = $1,
         "developerRole" = $2,
         image = COALESCE($3, image),
         "onboardingCompletedAt" = now(),
         "updatedAt" = now()
     WHERE id = $4`,
    [username, developerRole, image ?? null, session.user.id]
  );

  return NextResponse.json({ success: true });
}