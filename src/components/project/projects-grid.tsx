// src/components/project/projects-grid.tsx
"use client";

import * as React from "react";
import Link from "next/link";
import { FolderGit2, Plus, MoreVertical, Trash2 } from "lucide-react";
import { WorkspaceIcon } from "@/components/workspace/workspace-icon";
import { CreateProjectModal } from "@/components/project/create-project-modal";
import { ConfirmModal } from "@/components/workspace/confirm-modal";
import { Button } from "@/components/ui/button";
import type { Project, WorkspaceRole } from "@/lib/workspace/types";
import { canCreateProject, canDeleteProject } from "@/lib/workspace/permissions";
import { cn } from "@/lib/utils";

interface ProjectsGridProps {
  workspaceId: string;
  workspaceSlug: string;
  currentUserId: string;
  currentUserRole: WorkspaceRole;
  initialProjects: Project[];
}

export function ProjectsGrid({
  workspaceId,
  workspaceSlug,
  currentUserId,
  currentUserRole,
  initialProjects,
}: ProjectsGridProps) {
  const [projects, setProjects] = React.useState(initialProjects);
  const [createOpen, setCreateOpen] = React.useState(false);
  const [menuOpenId, setMenuOpenId] = React.useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = React.useState<Project | null>(null);
  const [deleteLoading, setDeleteLoading] = React.useState(false);
  const [deleteError, setDeleteError] = React.useState<string | null>(null);

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    setDeleteError(null);

    try {
      const res = await fetch(
        `/api/workspaces/${workspaceId}/projects/${deleteTarget.id}`,
        { method: "DELETE" }
      );
      const data = await res.json();
      if (!res.ok) {
        setDeleteError(data.error || "Couldn't delete this project.");
        setDeleteLoading(false);
        return;
      }
      setProjects((prev) => prev.filter((p) => p.id !== deleteTarget.id));
      setDeleteTarget(null);
    } finally {
      setDeleteLoading(false);
    }
  }

  if (projects.length === 0) {
    return (
      <>
        <div className="flex flex-col items-center rounded-2xl border border-dashed border-border bg-surface/40 px-6 py-16 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-border bg-bg-elevated">
            <FolderGit2 className="h-6 w-6 text-tertiary" />
          </div>
          <h3 className="mt-5 text-lg font-semibold text-primary">No projects yet</h3>
          <p className="mt-2 max-w-sm text-sm text-secondary">
            {canCreateProject(currentUserRole)
              ? "Create a project to start organizing work in this workspace."
              : "An admin or editor hasn't created any projects here yet."}
          </p>
          {canCreateProject(currentUserRole) && (
            <Button
              variant="primary"
              size="md"
              className="mt-6"
              icon={<Plus className="h-4 w-4" />}
              iconPosition="left"
              onClick={() => setCreateOpen(true)}
            >
              Create your first project
            </Button>
          )}
        </div>

        <CreateProjectModal
          open={createOpen}
          workspaceId={workspaceId}
          onClose={() => setCreateOpen(false)}
          onCreated={(project) => {
            setProjects((prev) => [project, ...prev]);
            setCreateOpen(false);
          }}
        />
      </>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-primary">Projects</h3>
        {canCreateProject(currentUserRole) && (
          <Button
            variant="secondary"
            size="sm"
            icon={<Plus className="h-3.5 w-3.5" />}
            iconPosition="left"
            onClick={() => setCreateOpen(true)}
          >
            New project
          </Button>
        )}
      </div>

      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        {projects.map((project) => {
          const canDelete = canDeleteProject(currentUserRole, currentUserId, project.createdById);
          const menuOpen = menuOpenId === project.id;

          return (
            <div
              key={project.id}
              className={cn(
                "group relative rounded-xl border border-border bg-surface/40 p-4 transition-colors hover:border-border-strong hover:bg-surface",
                project.status === "archived" && "opacity-60"
              )}
            >
              <Link href={`/w/${workspaceSlug}/${project.slug}`} className="flex items-start gap-3">
                <div className="h-10 w-10 shrink-0 overflow-hidden rounded-lg">
                  <WorkspaceIcon icon={project.icon} name={project.name} />
                </div>
                <div className="min-w-0 flex-1 pr-6">
                  <div className="flex items-center gap-1.5">
                    <span className="truncate text-sm font-medium text-primary">{project.name}</span>
                    {project.status === "archived" && (
                      <span className="shrink-0 rounded-full border border-border bg-surface px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-tertiary">
                        Archived
                      </span>
                    )}
                  </div>
                  {project.description && (
                    <p className="mt-0.5 truncate text-xs text-tertiary">{project.description}</p>
                  )}
                </div>
              </Link>

              {canDelete && (
                <div className="absolute right-3 top-3">
                  <button
                    onClick={() => setMenuOpenId(menuOpen ? null : project.id)}
                    className="flex h-7 w-7 items-center justify-center rounded-lg text-tertiary opacity-0 transition-opacity hover:bg-surface hover:text-primary group-hover:opacity-100"
                    aria-label="Project options"
                  >
                    <MoreVertical className="h-4 w-4" />
                  </button>

                  {menuOpen && (
                    <div className="absolute right-0 top-8 z-10 w-40 rounded-xl border border-border bg-bg-elevated p-1.5 shadow-elevated">
                      <button
                        onClick={() => {
                          setMenuOpenId(null);
                          setDeleteTarget(project);
                        }}
                        className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-sm font-medium text-danger transition-colors hover:bg-danger/10"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        Delete
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <CreateProjectModal
        open={createOpen}
        workspaceId={workspaceId}
        onClose={() => setCreateOpen(false)}
        onCreated={(project) => {
          setProjects((prev) => [project, ...prev]);
          setCreateOpen(false);
        }}
      />

      {deleteTarget && (
        <ConfirmModal
          open
          title="Delete project"
          description={`"${deleteTarget.name}" will be permanently deleted. This cannot be undone.`}
          confirmLabel="Delete project"
          danger
          loading={deleteLoading}
          error={deleteError}
          onConfirm={handleDelete}
          onClose={() => {
            setDeleteTarget(null);
            setDeleteError(null);
          }}
        />
      )}
    </div>
  );
}
