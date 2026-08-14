// src/app/api/onboarding/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { query, isUniqueViolation } from "@/lib/db";
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

  // Fast-path check: catches the common case (someone else already has
  // this username) with a clean error message before we even attempt
  // the write. This is NOT sufficient on its own — see the catch block
  // below for why — but it avoids a wasted write and gives a better
  // error message in the normal (non-race) case.
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
       SET username = $1,
           "developerRole" = $2,
           image = COALESCE($3, image),
           "onboardingCompletedAt" = now(),
           "updatedAt" = now()
       WHERE id = $4`,
      [username, developerRole, image ?? null, session.user.id]
    );
  } catch (err) {
    // The database's case-insensitive unique index (see
    // db/migrations/003_username_unique_ci.sql) is the actual
    // authoritative guard against two users ending up with the same
    // username — the SELECT check above is only a fast path and has a
    // real race condition under concurrent requests for the same name.
    // Postgres error code 23505 = unique_violation.
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