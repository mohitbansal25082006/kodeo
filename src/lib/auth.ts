// src/lib/auth.ts
import { betterAuth } from "better-auth";
import { emailOTP } from "better-auth/plugins";
import { Pool } from "pg";
import { sendOtpEmail, sendWelcomeEmail, sendAccountDeletionEmail } from "@/lib/email";

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
  baseURL: process.env.AUTH_URL || process.env.NEXT_PUBLIC_APP_URL,
  secret: process.env.AUTH_SECRET,

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