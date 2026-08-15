# KODEO — Progress Log

Tracks what's been built, which files exist because of it, and the commands used to verify each part. Bug fixes are logged briefly at the very end rather than per-part, so this file stays a map of current functionality rather than a change history.

---

## Part 1a — Project Setup, Design System, Landing Page

**Features:** Next.js 15 + TypeScript + Tailwind v4 scaffold. Full design system (color palette, Inter + JetBrains Mono, spacing/radius/shadow tokens, animation library). KODEO diamond logo. Responsive landing page — navbar, animated hero with code-editor mockup, stats band, problem/solution section, feature grid, CTA, footer.

**Files created:**
```
package.json, tsconfig.json, next.config.ts, postcss.config.mjs, eslint.config.mjs
.gitignore, .env.example, public/favicon.svg
src/app/globals.css, src/app/layout.tsx, src/app/page.tsx
src/lib/utils.ts, src/lib/design-tokens.ts
src/components/ui/button.tsx, badge.tsx, card.tsx
src/components/brand/logo.tsx
src/components/marketing/navbar.tsx, hero.tsx, editor-mockup.tsx, signal-band.tsx,
  problem-section.tsx, features-section.tsx, cta-section.tsx, footer.tsx
```

**Verified with:** `npm install`, `npx tsc --noEmit`, `npx next lint`, `npm run build`

---

## Part 1b — Authentication

**Features:** Better Auth (email/password, Google + GitHub OAuth). Email OTP verification on sign-up, OTP forgot/reset password via Resend. One-time profile onboarding (avatar, username, developer role). Neon Postgres schema as raw SQL, no ORM. Middleware protecting `/dashboard` and `/onboarding`.

**Files created:**
```
db/migrations/001_init.sql, scripts/migrate.mjs, src/middleware.ts
src/lib/db.ts, auth.ts, auth-client.ts, email.ts
src/components/ui/input.tsx
src/components/auth/auth-shell.tsx, password-strength.tsx, otp-input.tsx,
  oauth-buttons.tsx, divider.tsx, avatar-picker.tsx, role-picker.tsx, logout-button.tsx
src/app/api/auth/[...all]/route.ts, api/onboarding/route.ts
src/app/(auth)/layout.tsx, login/page.tsx, register/page.tsx, forgot-password/page.tsx,
  reset-password/page.tsx, verify-email/page.tsx
src/app/onboarding/page.tsx, src/app/dashboard/page.tsx (placeholder, replaced in 1c)
```

**Files modified:** `package.json` (added better-auth, pg, resend, zod, dotenv), `.env.example`, `next.config.ts`

**Verified with:** `npm install`, `npx tsc --noEmit`, `npx next lint`, `npm run build`

---

## Part 1c — Dashboard, Profile, Settings, Danger Zone

**Features:** Dashboard shell with sidebar (desktop) / drawer (mobile), shared across `/dashboard`, `/profile`, `/settings/*`. Workspaces page (empty state). Profile editing. **Appearance settings — 20 themes** (10 dark, 10 light), instant repaint via CSS variables, persisted to DB. Security settings — change password, active sessions list, revoke sessions. Connected accounts — link/unlink Google/GitHub. Danger zone — account deletion with confirmation modal, hard-deletes via `ON DELETE CASCADE`. Middleware extended to guard `/profile` and `/settings/*`.

**Files created:**
```
db/migrations/002_theme.sql
src/lib/themes/theme-definitions.ts, theme-provider.tsx
src/app/api/settings/theme/route.ts, api/profile/route.ts, api/account/delete/route.ts
src/components/dashboard/sidebar.tsx, topbar.tsx, dashboard-shell.tsx
src/components/settings/settings-section.tsx, theme-swatch.tsx, session-row.tsx,
  delete-account-modal.tsx
src/app/(app)/layout.tsx, dashboard/page.tsx, profile/page.tsx,
  settings/appearance/page.tsx, settings/security/page.tsx,
  settings/accounts/page.tsx, settings/danger/page.tsx
```

**Files modified:** `src/lib/auth.ts` (themeId field, deleteUser), `auth-client.ts`, `email.ts`, `src/middleware.ts`

**Files removed:** `src/app/dashboard/page.tsx` (Part 1b placeholder, superseded by the `(app)` route group version)

**Verified with:** `npm install`, `npx tsc --noEmit`, `npx next lint`, `npm run build`

---

## Current architecture reference

- **Auth:** Better Auth, raw `pg` against Neon Postgres, no ORM. Tables: `user`, `session`, `account`, `verification` (`db/migrations/001_init.sql`).
- **Avatars:** Multiavatar, generated locally as inline SVG (`@multiavatar/multiavatar`) — no external network call. `src/lib/avatar.ts` + `<UserAvatar>` distinguish this from real OAuth photo URLs.
- **Theming:** 20 themes via CSS variables, applied app-wide (including the logged-out landing page) from the root layout, with a blocking `<head>` script to avoid flash-of-wrong-theme.
- **Email:** Resend, KODEO-branded templates in `src/lib/email.ts`.
- **Migrations:** plain `.sql` files in `db/migrations/`, applied in order by `scripts/migrate.mjs` via `npm run db:migrate` — no ORM migration tool.

---

## Bug fixes (brief log)

- Onboarding "Enter your workspace" not redirecting → stale Better Auth session cookie cache; now force-refreshed before navigating.
- DiceBear avatars unreliable/not loading → replaced entirely with Multiavatar (local SVG generation, zero network dependency).
- Avatars auto-shuffling while typing username → avatar grid seed now locks on mount instead of tracking the live input.
- Two users could theoretically get the same username (race condition) → added a case-insensitive unique DB index + proper `23505` violation handling in both API routes.
- Theme picker didn't affect the public landing page → `ThemeProvider` moved to the root layout.
- Landing page had no "already logged in" state → navbar/hero now show "Go to dashboard" when a session exists.
- Mobile: horizontal scroll on the landing page → `overflow-x: hidden` added to `<html>` (not just `<body>`, required for iOS Safari), oversized decorative glows capped to viewport width.
- Mobile: editor mockup animation was slow/sequential → mobile now renders fully typed instantly; desktop animation is ~4-5x faster and only starts when scrolled into view.
- Production auth broken on custom domain → trailing slash in `AUTH_URL`/`NEXT_PUBLIC_APP_URL` was breaking Better Auth's origin matching; `trustedOrigins` now built explicitly and trailing slashes stripped automatically.
- Active Sessions showed a confusing all-zeros IPv6 address for localhost → now displays "Localhost".
- Google OAuth `redirect_uri_mismatch` in production → resolved (www vs. bare-domain mismatch between registered redirect URI and configured app URL).