// src/app/(app)/dashboard/page.tsx
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import Link from "next/link";
import { FolderGit2, Sparkles } from "lucide-react";
import { auth } from "@/lib/auth";
import { getActiveWorkspace, listWorkspacesForUser } from "@/lib/workspace/queries";
import { WorkspaceIcon } from "@/components/workspace/workspace-icon";
import { DashboardCreateButton } from "@/app/(app)/dashboard/dashboard-create-button";

export default async function DashboardPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) return null;

  const [activeWorkspace, allWorkspaces] = await Promise.all([
    getActiveWorkspace(session.user.id),
    listWorkspacesForUser(session.user.id),
  ]);

  if (activeWorkspace) {
    redirect(`/w/${activeWorkspace.slug}`);
  }

  if (allWorkspaces.length === 0) {
    return (
      <div>
        <div>
          <h2 className="text-xl font-bold text-primary">Your workspaces</h2>
          <p className="mt-1 text-sm text-secondary">
            Spin up a workspace and start building.
          </p>
        </div>

        <div className="mt-8 flex flex-col items-center rounded-2xl border border-dashed border-border bg-surface/40 px-6 py-16 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-border bg-bg-elevated">
            <FolderGit2 className="h-6 w-6 text-tertiary" />
          </div>
          <h3 className="mt-5 text-lg font-semibold text-primary">No workspaces yet</h3>
          <p className="mt-2 max-w-sm text-sm text-secondary">
            Create your first workspace to start organizing projects with your
            team.
          </p>
          <DashboardCreateButton className="mt-6">
            Create your first workspace
          </DashboardCreateButton>
          <div className="mt-6 flex items-center gap-1.5 text-xs text-tertiary">
            <Sparkles className="h-3.5 w-3.5 text-accent" />
            More project features are coming in a future update
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-xl font-bold text-primary">Select a workspace</h2>
      <p className="mt-1 text-sm text-secondary">
        Choose a workspace to continue, or create a new one.
      </p>

      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        {allWorkspaces.map((ws) => (
          <Link
            key={ws.id}
            href={`/w/${ws.slug}`}
            className="flex items-center gap-3 rounded-xl border border-border bg-surface/40 px-4 py-3.5 transition-colors hover:border-border-strong hover:bg-surface"
          >
            <div className="h-10 w-10 shrink-0 overflow-hidden rounded-lg">
              <WorkspaceIcon icon={ws.icon} name={ws.name} />
            </div>
            <div className="min-w-0">
              <div className="truncate text-sm font-medium text-primary">{ws.name}</div>
              <div className="truncate text-xs text-tertiary">
                {ws.memberCount} {ws.memberCount === 1 ? "member" : "members"}
              </div>
            </div>
          </Link>
        ))}
      </div>

      <DashboardCreateButton icon className="mt-6">
        New workspace
      </DashboardCreateButton>
    </div>
  );
}
