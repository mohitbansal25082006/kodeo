// src/app/(app)/w/[slug]/[projectSlug]/page.tsx
import { notFound } from "next/navigation";
import { headers } from "next/headers";
import Link from "next/link";
import { ArrowLeft, FolderGit2 } from "lucide-react";
import { auth } from "@/lib/auth";
import { getWorkspaceBySlugForUser } from "@/lib/workspace/queries";
import { getProjectBySlug } from "@/lib/project/queries";
import { WorkspaceIcon } from "@/components/workspace/workspace-icon";
import { ProjectActions } from "@/components/project/project-actions";
import { canEditProject, canDeleteProject } from "@/lib/workspace/permissions";

export default async function ProjectPage({
  params,
}: {
  params: Promise<{ slug: string; projectSlug: string }>;
}) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) return null;

  const { slug, projectSlug } = await params;
  const workspace = await getWorkspaceBySlugForUser(slug, session.user.id);
  if (!workspace) notFound();

  const project = await getProjectBySlug(workspace.id, projectSlug);
  if (!project) notFound();

  const canEdit = canEditProject(workspace.role);
  const canDelete = canDeleteProject(workspace.role, session.user.id, project.createdById);

  return (
    <div>
      <Link
        href={`/w/${slug}`}
        className="inline-flex items-center gap-1.5 text-sm text-secondary transition-colors hover:text-primary"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Back to {workspace.name}
      </Link>

      <div className="mt-4 flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 shrink-0 overflow-hidden rounded-xl border border-border">
            <WorkspaceIcon icon={project.icon} name={project.name} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-primary">{project.name}</h1>
              {project.status === "archived" && (
                <span className="rounded-full border border-border bg-surface px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-tertiary">
                  Archived
                </span>
              )}
            </div>
            {project.description && (
              <p className="text-sm text-secondary">{project.description}</p>
            )}
          </div>
        </div>

        {(canEdit || canDelete) && (
          <ProjectActions
            workspaceId={workspace.id}
            workspaceSlug={slug}
            project={project}
            canEdit={canEdit}
            canDelete={canDelete}
          />
        )}
      </div>

      {/* Project content (files, tasks, whatever KODEO's actual project
          workspace ends up holding) is out of scope for Part 2 — this
          placeholder just establishes the route and permission-gated
          shell for future parts to build inside. */}
      <div className="mt-8 flex flex-col items-center rounded-2xl border border-dashed border-border bg-surface/40 px-6 py-16 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-border bg-bg-elevated">
          <FolderGit2 className="h-6 w-6 text-tertiary" />
        </div>
        <h3 className="mt-5 text-lg font-semibold text-primary">Nothing here yet</h3>
        <p className="mt-2 max-w-sm text-sm text-secondary">
          This is where {project.name}&apos;s content will live in a future update.
        </p>
      </div>
    </div>
  );
}