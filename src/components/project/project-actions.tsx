// src/components/project/project-actions.tsx
"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Archive, ArchiveRestore, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConfirmModal } from "@/components/workspace/confirm-modal";
import type { Project } from "@/lib/workspace/types";

interface ProjectActionsProps {
  workspaceId: string;
  workspaceSlug: string;
  project: Project;
  canEdit: boolean;
  canDelete: boolean;
}

export function ProjectActions({ workspaceId, workspaceSlug, project, canEdit, canDelete }: ProjectActionsProps) {
  const router = useRouter();
  const [archiveLoading, setArchiveLoading] = React.useState(false);
  const [deleteOpen, setDeleteOpen] = React.useState(false);
  const [deleteLoading, setDeleteLoading] = React.useState(false);
  const [deleteError, setDeleteError] = React.useState<string | null>(null);

  async function handleToggleArchive() {
    setArchiveLoading(true);
    try {
      const res = await fetch(`/api/workspaces/${workspaceId}/projects/${project.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: project.status === "active" ? "archived" : "active",
        }),
      });
      if (res.ok) {
        router.refresh();
      } else {
        const data = await res.json().catch(() => ({}));
        window.alert(data.error || "Couldn't update this project.");
      }
    } finally {
      setArchiveLoading(false);
    }
  }

  async function handleDelete() {
    setDeleteLoading(true);
    setDeleteError(null);
    try {
      const res = await fetch(`/api/workspaces/${workspaceId}/projects/${project.id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) {
        setDeleteError(data.error || "Couldn't delete this project.");
        setDeleteLoading(false);
        return;
      }
      router.push(`/w/${workspaceSlug}`);
      router.refresh();
    } catch {
      setDeleteError("Something went wrong. Try again.");
      setDeleteLoading(false);
    }
  }

  return (
    <>
      <div className="flex shrink-0 items-center gap-2">
        {canEdit && (
          <Button
            variant="secondary"
            size="sm"
            icon={project.status === "active" ? <Archive className="h-3.5 w-3.5" /> : <ArchiveRestore className="h-3.5 w-3.5" />}
            iconPosition="left"
            loading={archiveLoading}
            onClick={handleToggleArchive}
          >
            {project.status === "active" ? "Archive" : "Unarchive"}
          </Button>
        )}
        {canDelete && (
          <Button
            variant="danger"
            size="sm"
            icon={<Trash2 className="h-3.5 w-3.5" />}
            iconPosition="left"
            onClick={() => setDeleteOpen(true)}
          >
            Delete
          </Button>
        )}
      </div>

      {deleteOpen && (
        <ConfirmModal
          open
          title="Delete project"
          description={`"${project.name}" will be permanently deleted. This cannot be undone.`}
          confirmLabel="Delete project"
          danger
          loading={deleteLoading}
          error={deleteError}
          onConfirm={handleDelete}
          onClose={() => {
            setDeleteOpen(false);
            setDeleteError(null);
          }}
        />
      )}
    </>
  );
}
