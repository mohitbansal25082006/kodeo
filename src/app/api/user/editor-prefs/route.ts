// src/app/api/user/editor-prefs/route.ts
import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { getEditorPrefs, updateEditorPreferences } from "@/lib/editor/queries";
import { FONT_SIZE_MIN, FONT_SIZE_MAX, TAB_SIZE_OPTIONS, AUTO_SAVE_DELAY_OPTIONS } from "@/lib/editor/preferences";

// TAB_SIZE_OPTIONS and AUTO_SAVE_DELAY_OPTIONS are defined once in
// preferences.ts as the shared source of truth for the UI (button
// choices in preferences-panel.tsx) and for validation here — refine()
// against the live arrays instead of a zod union-of-literals so
// there's exactly one place either list is ever written out, and
// TypeScript's tuple-arity requirements for z.union() (which need a
// statically-known-length tuple, awkward to derive from a runtime
// array via .map()) never enter into it.
const patchSchema = z.object({
  fontSize: z.number().min(FONT_SIZE_MIN).max(FONT_SIZE_MAX).optional(),
  tabSize: z
    .number()
    .refine((v) => (TAB_SIZE_OPTIONS as readonly number[]).includes(v), { message: "Invalid tab size." })
    .optional(),
  wordWrap: z.boolean().optional(),
  minimap: z.boolean().optional(),
  autoSaveDelayMs: z
    .number()
    .refine((v) => AUTO_SAVE_DELAY_OPTIONS.some((o) => o.value === v), { message: "Invalid auto-save delay." })
    .optional(),
});

export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const prefs = await getEditorPrefs(session.user.id);
  return NextResponse.json({ preferences: prefs.preferences });
}

export async function PATCH(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid preferences." }, { status: 400 });
  }
  if (Object.keys(parsed.data).length === 0) {
    return NextResponse.json({ error: "Nothing to update." }, { status: 400 });
  }

  const updated = await updateEditorPreferences(session.user.id, parsed.data);
  return NextResponse.json({ preferences: updated.preferences });
}
