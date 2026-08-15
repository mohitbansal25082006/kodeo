// src/app/(app)/w/[slug]/page.tsx
import { headers } from "next/headers";
import { Users } from "lucide-react";
import { auth } from "@/lib/auth";
import { getWorkspaceBySlugForUser } from "@/lib/workspace/queries";
import { listProjects } from "@/lib/project/queries";
import { WORKSPACE_ROLE_META } from "@/lib/workspace/types";
import { ProjectsGrid } from "@/components/project/projects-grid";

export default async function WorkspaceOverviewPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) return null;

  const { slug } = await params;
  const workspace = await getWorkspaceBySlugForUser(slug, session.user.id);
  // WorkspaceLayout (the parent (app)/w/[slug]/layout.tsx) already
  // calls notFound() if this is null, so this render only happens
  // with a valid workspace.
  if (!workspace) return null;

  const projects = await listProjects(workspace.id);
  const roleMeta = WORKSPACE_ROLE_META[workspace.role];

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3 text-sm text-secondary">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface/60 px-3 py-1">
          <Users className="h-3.5 w-3.5" />
          {workspace.memberCount} {workspace.memberCount === 1 ? "member" : "members"}
        </span>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface/60 px-3 py-1">
          Your role: <span className="font-medium text-primary">{roleMeta.label}</span>
        </span>
      </div>

      <div className="mt-8">
        <ProjectsGrid
          workspaceId={workspace.id}
          workspaceSlug={workspace.slug}
          currentUserId={session.user.id}
          currentUserRole={workspace.role}
          initialProjects={projects}
        />
      </div>
    </div>
  );
}
