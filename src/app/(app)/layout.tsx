import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { getActiveWorkspace } from "@/lib/workspace/queries";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session?.user) {
    redirect("/login");
  }

  if (!session.user.onboardingCompletedAt) {
    redirect("/onboarding");
  }

  const user = {
    name: session.user.name,
    email: session.user.email,
    image: session.user.image,
    username: session.user.username,
  };

  // Resolved once here so every page under (app) — dashboard, /w/[slug]/*,
  // profile, settings/* — gets the same activeWorkspace without each
  // page re-fetching it. getActiveWorkspace re-verifies membership
  // itself (see src/lib/workspace/queries.ts), so this is also safe if
  // the stored activeWorkspaceId points at a workspace the user has
  // since been removed from — it resolves to null rather than leaking
  // data.
  const activeWorkspace = await getActiveWorkspace(session.user.id);

  // ThemeProvider now lives in the root layout (src/app/layout.tsx) so
  // that theming also covers the public landing page, not just the
  // logged-in app shell — no need to wrap again here.
  return (
    <DashboardShell user={user} activeWorkspace={activeWorkspace}>
      {children}
    </DashboardShell>
  );
}
