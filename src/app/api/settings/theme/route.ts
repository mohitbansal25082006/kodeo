// src/app/api/settings/theme/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { query } from "@/lib/db";
import { getThemeById } from "@/lib/themes/theme-definitions";

export async function POST(request: NextRequest) {
  const session = await auth.api.getSession({ headers: request.headers });

  if (!session?.user) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const body = await request.json();
  const themeId = typeof body.themeId === "string" ? body.themeId : null;

  if (!themeId) {
    return NextResponse.json({ error: "themeId is required." }, { status: 400 });
  }

  // Validate against the known theme list rather than trusting client input.
  const resolved = getThemeById(themeId);

  await query(
    `UPDATE "user" SET "themeId" = $1, "updatedAt" = now() WHERE id = $2`,
    [resolved.id, session.user.id]
  );

  return NextResponse.json({ success: true, themeId: resolved.id });
}