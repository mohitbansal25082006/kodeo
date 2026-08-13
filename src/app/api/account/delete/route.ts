// src/app/api/account/delete/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { query } from "@/lib/db";

/**
 * Hard-deletes the current user's account.
 *
 * For credential (password) users: verifies the supplied password via
 * Better Auth's auth.api.verifyPassword before deleting, since this is
 * a server-initiated deletion rather than the client-facing
 * authClient.deleteUser() email-confirmation flow — this route is for
 * users who can prove identity synchronously with their password.
 *
 * For OAuth-only users (no password on file): the account table's
 * ON DELETE CASCADE handles cleanup, so a direct authenticated delete
 * is safe as long as the session itself is valid and fresh.
 */
export async function POST(request: NextRequest) {
  const session = await auth.api.getSession({ headers: request.headers });

  if (!session?.user) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const password = typeof body.password === "string" ? body.password : undefined;

  // Check whether this user has a credential (password) account at all.
  const credentialAccount = await query<{ id: string }>(
    `SELECT id FROM "account" WHERE "userId" = $1 AND "providerId" = 'credential' LIMIT 1`,
    [session.user.id]
  );

  if (credentialAccount.length > 0) {
    if (!password) {
      return NextResponse.json(
        { error: "Please enter your password to confirm deletion." },
        { status: 400 }
      );
    }

    try {
      await auth.api.verifyPassword({
        body: { password },
        headers: request.headers,
      });
    } catch {
      return NextResponse.json({ error: "Incorrect password." }, { status: 403 });
    }
  }

  // user row delete cascades to session/account via ON DELETE CASCADE
  // defined in db/migrations/001_init.sql.
  await query(`DELETE FROM "user" WHERE id = $1`, [session.user.id]);

  const response = NextResponse.json({ success: true });
  // Clear the session cookie explicitly since the underlying session row
  // is already gone (cascaded) but the browser still holds the cookie.
  response.cookies.delete("better-auth.session_token");
  return response;
}