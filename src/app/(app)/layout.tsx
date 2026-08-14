// src/app/(app)/layout.tsx
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";

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

  // ThemeProvider now lives in the root layout (src/app/layout.tsx) so
  // that theming also covers the public landing page, not just the
  // logged-in app shell — no need to wrap again here.
  return <DashboardShell user={user}>{children}</DashboardShell>;
}