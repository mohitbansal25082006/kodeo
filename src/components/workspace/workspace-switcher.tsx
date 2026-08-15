// src/components/workspace/workspace-switcher.tsx
"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { ChevronsUpDown, Plus, Check } from "lucide-react";
import { WorkspaceIcon } from "@/components/workspace/workspace-icon";
import { CreateWorkspaceModal } from "@/components/workspace/create-workspace-modal";
import { WORKSPACE_ROLE_META } from "@/lib/workspace/types";
import type { Workspace, WorkspaceWithRole } from "@/lib/workspace/types";
import { cn } from "@/lib/utils";

interface WorkspaceSwitcherProps {
  activeWorkspace: WorkspaceWithRole | null;
  onNavigate?: () => void;
}

export function WorkspaceSwitcher({ activeWorkspace, onNavigate }: WorkspaceSwitcherProps) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [createOpen, setCreateOpen] = React.useState(false);
  const [workspaces, setWorkspaces] = React.useState<WorkspaceWithRole[] | null>(null);
  const [switching, setSwitching] = React.useState<string | null>(null);
  const containerRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (open && workspaces === null) {
      fetch("/api/workspaces")
        .then((res) => res.json())
        .then((data) => setWorkspaces(data.workspaces || []))
        .catch(() => setWorkspaces([]));
    }
  }, [open, workspaces]);

  React.useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  async function handleSwitch(workspace: WorkspaceWithRole) {
    if (workspace.id === activeWorkspace?.id) {
      setOpen(false);
      return;
    }
    setSwitching(workspace.id);
    try {
      const res = await fetch(`/api/workspaces/${workspace.id}/switch`, { method: "POST" });
      if (res.ok) {
        setOpen(false);
        onNavigate?.();
        router.push(`/w/${workspace.slug}`);
        router.refresh();
      }
    } finally {
      setSwitching(null);
    }
  }

  function handleCreated(workspace: Workspace) {
    setCreateOpen(false);
    setOpen(false);
    onNavigate?.();
    router.push(`/w/${workspace.slug}`);
    router.refresh();
  }

  return (
    <div ref={containerRef} className="relative px-3 pt-3">
      <button
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "flex w-full items-center gap-2.5 rounded-xl border border-border bg-surface/60 px-3 py-2.5 text-left transition-colors",
          "hover:border-border-strong hover:bg-surface"
        )}
      >
        <div className="h-8 w-8 shrink-0 overflow-hidden rounded-lg">
          {activeWorkspace ? (
            <WorkspaceIcon icon={activeWorkspace.icon} name={activeWorkspace.name} />
          ) : (
            <div className="flex h-full w-full items-center justify-center rounded-lg border border-dashed border-border text-tertiary">
              <Plus className="h-3.5 w-3.5" />
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-medium text-primary">
            {activeWorkspace?.name || "Select workspace"}
          </div>
          {activeWorkspace && (
            <div className="truncate text-xs text-tertiary">
              {WORKSPACE_ROLE_META[activeWorkspace.role].label}
            </div>
          )}
        </div>
        <ChevronsUpDown className="h-3.5 w-3.5 shrink-0 text-tertiary" />
      </button>

      <div
        className={cn(
          "absolute left-3 right-3 top-[calc(100%+6px)] z-30 origin-top rounded-xl border border-border bg-bg-elevated shadow-elevated transition-all duration-150",
          open ? "scale-100 opacity-100" : "pointer-events-none scale-95 opacity-0"
        )}
      >
        <div className="max-h-64 overflow-y-auto p-1.5">
          {workspaces === null ? (
            <div className="flex justify-center py-5">
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-accent border-t-transparent" />
            </div>
          ) : workspaces.length === 0 ? (
            <p className="px-2.5 py-4 text-center text-xs text-tertiary">No workspaces yet.</p>
          ) : (
            workspaces.map((ws) => {
              const isActive = ws.id === activeWorkspace?.id;
              const isSwitching = switching === ws.id;
              return (
                <button
                  key={ws.id}
                  onClick={() => handleSwitch(ws)}
                  disabled={isSwitching}
                  className={cn(
                    "flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left transition-colors",
                    isActive ? "bg-accent-dim/50" : "hover:bg-surface"
                  )}
                >
                  <div className="h-7 w-7 shrink-0 overflow-hidden rounded-md">
                    <WorkspaceIcon icon={ws.icon} name={ws.name} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium text-primary">{ws.name}</div>
                    <div className="truncate text-xs text-tertiary">
                      {ws.memberCount} {ws.memberCount === 1 ? "member" : "members"}
                    </div>
                  </div>
                  {isSwitching ? (
                    <span className="h-3.5 w-3.5 shrink-0 animate-spin rounded-full border-2 border-accent border-t-transparent" />
                  ) : isActive ? (
                    <Check className="h-3.5 w-3.5 shrink-0 text-accent" />
                  ) : null}
                </button>
              );
            })
          )}
        </div>

        <div className="border-t border-border p-1.5">
          <button
            onClick={() => {
              setOpen(false);
              setCreateOpen(true);
            }}
            className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-sm font-medium text-secondary transition-colors hover:bg-surface hover:text-primary"
          >
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-dashed border-border">
              <Plus className="h-3.5 w-3.5" />
            </span>
            New workspace
          </button>
        </div>
      </div>

      <CreateWorkspaceModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={handleCreated}
      />
    </div>
  );
}
