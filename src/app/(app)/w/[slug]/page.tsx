// src/app/(app)/w/[slug]/page.tsx
import { headers } from "next/headers";
import { FolderGit2, Users } from "lucide-react";
import { auth } from "@/lib/auth";
import { getWorkspaceBySlugForUser } from "@/lib/workspace/queries";
import { WORKSPACE_ROLE_META } from "@/lib/workspace/types";

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
  // with a valid workspace — this second lookup is a small, cheap
  // duplicate rather than plumbing the resolved workspace through
  // React context, keeping each page independently fetchable.
  if (!workspace) return null;

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

      {/* Projects land in Part 2c */}
      <div className="mt-8 flex flex-col items-center rounded-2xl border border-dashed border-border bg-surface/40 px-6 py-16 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-border bg-bg-elevated">
          <FolderGit2 className="h-6 w-6 text-tertiary" />
        </div>
        <h3 className="mt-5 text-lg font-semibold text-primary">No projects yet</h3>
        <p className="mt-2 max-w-sm text-sm text-secondary">
          Projects and invitations are coming to this workspace in the next
          update.
        </p>
      </div>
    </div>
  );
}
