// src/app/(app)/layout.tsx
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { ThemeProvider } from "@/lib/themes/theme-provider";
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

  return (
    <ThemeProvider initialThemeId={session.user.themeId}>
      <DashboardShell user={user}>{children}</DashboardShell>
    </ThemeProvider>
  );
}