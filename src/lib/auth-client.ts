// src/lib/auth-client.ts
"use client";

import { createAuthClient } from "better-auth/react";
import { emailOTPClient, inferAdditionalFields } from "better-auth/client/plugins";
import type { auth } from "@/lib/auth";

// Trailing slashes in NEXT_PUBLIC_APP_URL break origin matching against
// the server's trustedOrigins list (see src/lib/auth.ts for details) —
// stripped here too so the client always sends a clean baseURL.
const rawAppUrl = process.env.NEXT_PUBLIC_APP_URL;
const appUrl = rawAppUrl?.endsWith("/") ? rawAppUrl.slice(0, -1) : rawAppUrl;

export const authClient = createAuthClient({
  baseURL: appUrl,
  plugins: [emailOTPClient(), inferAdditionalFields<typeof auth>()],
});

export const { signIn, signUp, signOut, useSession, getSession } = authClient;