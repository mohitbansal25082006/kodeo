// src/lib/auth.ts
import { betterAuth } from "better-auth";
import { emailOTP } from "better-auth/plugins";
import { Pool } from "pg";
import { sendOtpEmail, sendWelcomeEmail, sendAccountDeletionEmail } from "@/lib/email";

/**
 * Strip a single trailing slash from a URL. Better Auth compares
 * baseURL/trustedOrigins against the browser's `Origin` header using
 * exact string matching, and browsers never send a trailing slash
 * (e.g. "https://www.kodeo.website", never ".../"). A value like
 * "https://www.kodeo.website/" in AUTH_URL or NEXT_PUBLIC_APP_URL will
 * silently fail to match anything and every request gets rejected as
 * an untrusted origin — this was the cause of auth being completely
 * broken in production.
 */
function stripTrailingSlash(url: string | undefined): string | undefined {
  if (!url) return url;
  return url.endsWith("/") ? url.slice(0, -1) : url;
}

const appUrl = stripTrailingSlash(process.env.NEXT_PUBLIC_APP_URL);
const authUrl = stripTrailingSlash(process.env.AUTH_URL) || appUrl;

/**
 * Build the trusted origins list. In production this needs BOTH the
 * www and bare-domain forms if the site is reachable at either (Vercel/
 * most hosts serve both by default, with one redirecting to the other,
 * but the redirect happens after the browser has already sent its
 * Origin header, so both must be trusted). Local dev origins are
 * always included too so `npm run dev` keeps working after this change.
 */
function buildTrustedOrigins(): string[] {
  const origins = new Set<string>();

  if (authUrl) origins.add(authUrl);
  if (appUrl) origins.add(appUrl);

  // If the configured URL uses "www.", also trust the bare domain,
  // and vice versa — covers whichever one the browser actually used.
  for (const url of [authUrl, appUrl]) {
    if (!url) continue;
    try {
      const u = new URL(url);
      if (u.hostname.startsWith("www.")) {
        origins.add(`${u.protocol}//${u.hostname.slice(4)}`);
      } else {
        origins.add(`${u.protocol}//www.${u.hostname}`);
      }
    } catch {
      // malformed URL in env var — skip, don't crash startup over it
    }
  }

  origins.add("http://localhost:3000");
  origins.add("http://127.0.0.1:3000");

  return Array.from(origins);
}

/**
 * Better Auth server instance.
 *
 * Database: raw `pg` Pool against Neon Postgres — no ORM. Better Auth
 * talks to the `user` / `session` / `account` / `verification` tables
 * defined in db/migrations/001_init.sql via Kysely under the hood, but
 * we own the schema as plain SQL, not through Better Auth's generator.
 *
 * Auth methods:
 *   - Email + password (with OTP email verification on sign-up)
 *   - Google OAuth
 *   - GitHub OAuth
 *   - Email OTP for forgot-password flow
 */
export const auth = betterAuth({
  appName: "KODEO",
  baseURL: authUrl,
  secret: process.env.AUTH_SECRET,
  trustedOrigins: buildTrustedOrigins(),

  database: new Pool({
    connectionString: process.env.DATABASE_URL,
  }),

  // ---------- Email + password ----------
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
    minPasswordLength: 8,
    maxPasswordLength: 128,
    autoSignIn: false,
  },

  // ---------- Email verification (OTP-based, not link-based) ----------
  emailVerification: {
    sendOnSignUp: false, // the emailOTP plugin below handles sending
    autoSignInAfterVerification: true,
  },

  // ---------- Social providers ----------
  socialProviders: {
    google: {
      clientId: process.env.AUTH_GOOGLE_ID as string,
      clientSecret: process.env.AUTH_GOOGLE_SECRET as string,
    },
    github: {
      clientId: process.env.AUTH_GITHUB_ID as string,
      clientSecret: process.env.AUTH_GITHUB_SECRET as string,
    },
  },

  // ---------- Custom user fields (KODEO profile / onboarding) ----------
  user: {
    additionalFields: {
      username: {
        type: "string",
        required: false,
        input: true,
      },
      developerRole: {
        type: "string",
        required: false,
        input: true,
      },
      onboardingCompletedAt: {
        type: "date",
        required: false,
        input: false,
      },
      themeId: {
        type: "string",
        required: false,
        input: true,
        defaultValue: "kodeo-dark",
      },
    },
    // ---------- Account deletion (danger zone, Part 1c) ----------
    deleteUser: {
      enabled: true,
      // Credential (password) users are asked to re-enter their password
      // via session freshness before deletion goes through (handled in
      // the API route). OAuth-only users get an email confirmation link
      // since they have no password to verify against.
      async sendDeleteAccountVerification({ user, url }) {
        await sendAccountDeletionEmail({ to: user.email, url });
      },
      async afterDelete() {
        // Foreign keys are ON DELETE CASCADE, so session/account rows are
        // already gone by the time this runs. Nothing else to clean up
        // in Part 1c — hook is here for future parts (workspaces, etc).
      },
    },
  },

  // ---------- Sessions ----------
  session: {
    expiresIn: 60 * 60 * 24 * 30, // 30 days
    updateAge: 60 * 60 * 24, // refresh once per day of activity
    cookieCache: {
      enabled: true,
      maxAge: 60 * 5, // 5 minute in-memory cache to cut DB round trips
    },
  },

  // ---------- Rate limiting (auth endpoints get hit by bots/brute force) ----------
  rateLimit: {
    enabled: true,
    window: 60,
    max: 20,
  },

  advanced: {
    database: {
      generateId: false, // let Postgres gen_random_uuid() defaults own this
    },
  },

  plugins: [
    emailOTP({
      // Same OTP length/expiry for all three flows KODEO uses:
      // email-verification (sign-up), forget-password, and a
      // sign-in OTP is available too but not exposed in Part 1b UI.
      expiresIn: 60 * 10, // 10 minutes
      allowedAttempts: 5,
      resendStrategy: "reuse",
      async sendVerificationOTP({ email, otp, type }) {
        await sendOtpEmail({ to: email, otp, type });
      },
    }),
  ],
});

/**
 * Fired once a user's email is verified for the first time.
 * Better Auth doesn't have a dedicated "post sign-up" hook wired
 * here in Part 1b — the welcome email is sent explicitly from the
 * verify-email API route after a successful OTP check instead.
 */
export { sendWelcomeEmail };

export type Session = typeof auth.$Infer.Session;