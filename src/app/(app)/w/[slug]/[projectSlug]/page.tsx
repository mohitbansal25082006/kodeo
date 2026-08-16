// src/app/(app)/w/[slug]/[projectSlug]/page.tsx
import { notFound } from "next/navigation";
import { headers } from "next/headers";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { auth } from "@/lib/auth";
import { getWorkspaceBySlugForUser } from "@/lib/workspace/queries";
import { getProjectBySlug } from "@/lib/project/queries";
import { WorkspaceIcon } from "@/components/workspace/workspace-icon";
import { ProjectActions } from "@/components/project/project-actions";
import { EditorShell } from "@/components/editor/editor-shell";
import { canEditProject, canDeleteProject } from "@/lib/workspace/permissions";
import { canCreateNode } from "@/lib/filesystem/permissions";

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
  const canWriteFiles = canCreateNode(workspace.role);

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

      <div className="mt-6">
        <EditorShell workspaceId={workspace.id} projectId={project.id} canWrite={canWriteFiles} />
      </div>
    </div>
  );
}
