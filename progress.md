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

## Part 2a — Workspace System: Create & Switch

**Features:** Introduces the `User → Workspace → Project` hierarchy. Workspace creation (name, description, generated icon), atomic with the creator's `owner` membership row in a single DB transaction. Slug-based identity per workspace (`kodeo.website/w/[slug]`), generated from the name with race-safe collision retry against the DB's unique index. Workspace switcher in the sidebar (list, switch, create). `activeWorkspaceId` persisted on the user so the dashboard reopens to the same workspace across sessions/devices. Four fixed roles defined (`owner`, `admin`, `editor`, `viewer`) with a numeric rank helper, though only "any member" checks are meaningful yet — the full permission matrix lands in Part 2b.

**Files created:**
```
db/migrations/004_workspaces.sql
src/lib/workspace/types.ts, permissions.ts, slug.ts, queries.ts
src/app/api/workspaces/route.ts, api/workspaces/[workspaceId]/switch/route.ts
src/components/workspace/workspace-icon.tsx, create-workspace-modal.tsx, workspace-switcher.tsx
src/app/(app)/dashboard/dashboard-create-button.tsx
```

**Files modified:** `src/components/dashboard/sidebar.tsx` (embeds `WorkspaceSwitcher`), `dashboard-shell.tsx` (threads `activeWorkspace` through), `src/app/(app)/layout.tsx` (resolves active workspace server-side), `src/app/(app)/dashboard/page.tsx` (real empty/active states instead of the static placeholder)

**Design notes:** Deliberately did not adopt Better Auth's Organization plugin — it's the standard approach for this kind of feature, but pulling it in would introduce an ORM-adjacent abstraction layer inconsistent with the project's raw-SQL-no-ORM architecture. `getWorkspaceForUser` never distinguishes "workspace doesn't exist" from "you're not a member" to callers, so a non-member always gets a 404, never a 403 that would confirm the workspace's existence.

---

## Part 2b — Workspace Settings, Members, Roles

**Features:** Workspace rename/re-icon/description editing and slug changes (settings gated to admin+, no auto-slug-collision-renaming — a taken slug is a hard 409 the user resolves themselves). Workspace deletion (owner-only, type-the-name-to-confirm modal, relies on `ON DELETE CASCADE`). Full members table — role picker (only shows roles the actor can actually grant), remove member, leave workspace, and atomic ownership transfer (old owner demoted to admin, new owner promoted, in one transaction — never two owners or zero). Complete permission matrix based on role rank: an actor can only act on members they outrank, and can only grant roles at or below their own rank. Last-owner protection at the DB-query layer (`LastOwnerError`) blocks demoting, removing, or self-leaving as the sole owner. Routing switched to slug-based URLs (`/w/[slug]`, `/w/[slug]/members`, `/w/[slug]/settings`) matching how Linear/Vercel/Notion route workspace-scoped pages; `/dashboard` now just forwards to the active workspace's slug or shows a picker/empty-state.

**Files created:**
```
src/app/api/workspaces/[workspaceId]/route.ts (PATCH/DELETE)
src/app/api/workspaces/[workspaceId]/members/route.ts (GET)
src/app/api/workspaces/[workspaceId]/members/[memberId]/route.ts (PATCH/DELETE)
src/app/api/workspaces/[workspaceId]/transfer-ownership/route.ts (POST)
src/app/(app)/w/[slug]/layout.tsx, page.tsx, members/page.tsx, settings/page.tsx
src/components/workspace/workspace-tabs.tsx, members-table.tsx, role-picker.tsx,
  confirm-modal.tsx, workspace-details-form.tsx, delete-workspace-section.tsx
```

**Files modified:** `src/lib/workspace/permissions.ts` (full role-rank matrix), `queries.ts` (`updateWorkspace`, `deleteWorkspace`, `listMembers`, `updateMemberRole`, `removeMember`, `transferOwnership`, `leaveWorkspace`, `countOwners`, `getWorkspaceBySlugForUser`), `workspace-switcher.tsx` (navigates to `/w/[slug]` instead of `/dashboard`), `sidebar.tsx` (main nav link follows the active workspace's slug), `dashboard-shell.tsx` (title bar derives from `/w/[slug]/*` tab segments), `src/app/(app)/dashboard/page.tsx` (redirects to active workspace or shows picker)

**Design notes:** Delete-workspace uses the same type-the-name-to-confirm pattern as Part 1c's account deletion, for consistency. Deletion is deliberately owner-only even though admins can do almost everything else an owner can — it's destructive for every member, not just the actor.

---

## Part 2c — Invitations & Projects, Domain Migration

**Features:** Email-based workspace invitations (admin+, token-based, 7-day expiry, one pending invite per email per workspace via a partial unique index — re-inviting after decline/revoke is fine). Accept/decline via a public `/invite/[token]` landing page that handles signed-out, wrong-email, expired, and already-used states; acceptance is atomic (membership creation + invitation status update in one transaction) and re-verifies the invited email against the accepting session so a token can't be redeemed under the wrong account. Ownership is never grantable through an invitation — only via Part 2b's `transferOwnership`. Projects — workspace-scoped, slug-unique-per-workspace (not globally), create/edit at editor+, delete at admin+ or by the project's own creator, active/archived status. Projects grid on the workspace overview page; a project detail page shell at `/w/[slug]/[projectSlug]` with archive/unarchive and delete controls. **Full domain migration from `kodeo.dev` to `kodeo.website`** across `.env.example`, `metadataBase`, email templates, and the new `site-url.ts` helper. The invite-to-signup flow now round-trips a `next` param through register → email verification → onboarding → back to the original invite link, with an open-redirect guard (only same-origin paths starting with a single `/` are honored) at the point onboarding consumes it.

**Files created:**
```
db/migrations/005_invitations_and_projects.sql
src/lib/workspace/invitation-queries.ts, src/lib/project/queries.ts, src/lib/site-url.ts
src/app/api/workspaces/[workspaceId]/invitations/route.ts (GET/POST)
src/app/api/workspaces/[workspaceId]/invitations/[invitationId]/route.ts (DELETE)
src/app/api/workspaces/[workspaceId]/projects/route.ts (GET/POST)
src/app/api/workspaces/[workspaceId]/projects/[projectId]/route.ts (PATCH/DELETE)
src/app/api/invitations/[token]/accept/route.ts, decline/route.ts
src/app/invite/[token]/page.tsx
src/app/(app)/w/[slug]/[projectSlug]/page.tsx
src/components/workspace/invite-member-modal.tsx, invitation-landing.tsx
src/components/project/create-project-modal.tsx, projects-grid.tsx, project-actions.tsx
```

**Files modified:** `src/lib/workspace/permissions.ts` (`canInviteMembers`, `canRevokeInvitation`, `canViewInvitations`, `canInviteAsRole`, `canCreateProject`, `canEditProject`, `canDeleteProject`), `types.ts` (`InvitableRole`, `WorkspaceInvitation`, `InvitationPreview`, `Project`), `email.ts` (domain + `sendWorkspaceInvitationEmail`), `members-table.tsx` (pending-invitations section + invite button), `(app)/w/[slug]/page.tsx` (renders real `ProjectsGrid`), `.env.example`, `src/app/layout.tsx` (`metadataBase`), `src/middleware.ts` (added `/w` to protected routes — a gap from Part 2b), `register/page.tsx`, `verify-email/page.tsx`, `onboarding/page.tsx` (all three: `next` param round-trip)

**Design notes:** The invitation token is only ever returned from `getInvitationToken` (called once, right after creation, to build the email link) — it's never included in `WorkspaceInvitation`'s shape or the pending-invitations list response, so it can't leak into a members-page fetch. Migration `005` must be run (`npm run db:migrate`) before Part 2c's routes/pages will work — omitting this produces a `relation "project" does not exist` / `42P01` error at runtime, since the code assumes the migration has already been applied and doesn't create tables lazily.

---

## Current architecture reference

- **Auth:** Better Auth, raw `pg` against Neon Postgres, no ORM. Tables: `user`, `session`, `account`, `verification` (`db/migrations/001_init.sql`).
- **Avatars:** Multiavatar, generated locally as inline SVG (`@multiavatar/multiavatar`) — no external network call. `src/lib/avatar.ts` + `<UserAvatar>` distinguish this from real OAuth photo URLs. Workspaces and projects reuse the same seed convention via `<WorkspaceIcon>` (`src/components/workspace/workspace-icon.tsx`), falling back to a name-hashed color + initial when no seed is set.
- **Theming:** 20 themes via CSS variables, applied app-wide (including the logged-out landing page) from the root layout, with a blocking `<head>` script to avoid flash-of-wrong-theme.
- **Email:** Resend, KODEO-branded templates in `src/lib/email.ts`. Sends OTPs, account-deletion confirmation, and (as of Part 2c) workspace invitations.
- **Migrations:** plain `.sql` files in `db/migrations/`, applied in order by `scripts/migrate.mjs` via `npm run db:migrate` — no ORM migration tool. Currently: `001_init`, `002_theme`, `003_username_unique_ci`, `004_workspaces`, `005_invitations_and_projects`.
- **Domain:** `kodeo.website` (migrated from `kodeo.dev` in Part 2c). Canonical origin resolved via `src/lib/site-url.ts`'s `getSiteUrl()`/`buildInviteUrl()`, and via `NEXT_PUBLIC_APP_URL`/`AUTH_URL` for Better Auth's `trustedOrigins`.
- **Workspace hierarchy:** `User → Workspace → Project`, roles `owner > admin > editor > viewer` (`src/lib/workspace/types.ts`, `permissions.ts`). Workspaces and projects are addressed by slug in routes (`/w/[slug]`, `/w/[slug]/[projectSlug]`); all other resources (members, invitations) are addressed by ID under the workspace. Every workspace-scoped query (`getWorkspaceForUser`, `getWorkspaceBySlugForUser`) folds "doesn't exist" and "not a member" into the same `null`/404, never leaking existence to non-members. Destructive multi-row operations (`createWorkspace`, `transferOwnership`, `acceptInvitation`) run inside explicit `BEGIN`/`COMMIT`/`ROLLBACK` transactions rather than sequential `pool.query` calls, so partial states (e.g. a workspace with no owner, or two simultaneous owners) are never observable.

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
- `/w/[slug]/*` routes were reachable without a session → missing from `middleware.ts`'s protected-routes matcher since Part 2b introduced them; added in Part 2c.
- Invite link lost mid-signup → `register`/`verify-email`/`onboarding` didn't carry a `next` param through the mandatory onboarding step, so anyone without an existing account who accepted an invitation landed on `/dashboard` instead of back at `/invite/[token]`; all three pages now round-trip `next` (with an open-redirect guard at the point onboarding consumes it).
- `relation "project" does not exist` (Postgres `42P01`) on `/w/[slug]` → Part 2c's migration (`005_invitations_and_projects.sql`) hadn't been run yet; the app assumes migrations are applied ahead of time and doesn't create tables lazily. Run `npm run db:migrate` after pulling Part 2c.