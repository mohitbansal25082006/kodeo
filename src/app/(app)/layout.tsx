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

  const activeWorkspace = await getActiveWorkspace(session.user.id);

  return (
    <DashboardShell user={user} activeWorkspace={activeWorkspace}>
      {children}
    </DashboardShell>
  );
}
