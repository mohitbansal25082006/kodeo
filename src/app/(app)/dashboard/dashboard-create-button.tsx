// src/app/(app)/dashboard/dashboard-create-button.tsx
"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CreateWorkspaceModal } from "@/components/workspace/create-workspace-modal";
import type { Workspace } from "@/lib/workspace/types";

interface DashboardCreateButtonProps {
  children: React.ReactNode;
  icon?: boolean;
  className?: string;
}

/**
 * DashboardPage (src/app/(app)/dashboard/page.tsx) is a server
 * component so it can fetch workspace data directly, but opening a
 * modal needs client state — this small wrapper is the boundary
 * between the two, rather than making the whole page "use client"
 * and losing the ability to await queries at the top.
 */
export function DashboardCreateButton({ children, icon = false, className }: DashboardCreateButtonProps) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);

  function handleCreated(workspace: Workspace) {
    setOpen(false);
    // Part 2b routes workspaces by slug — go straight to the new
    // workspace's overview page instead of back to /dashboard, which
    // would otherwise immediately redirect there anyway now that
    // /dashboard forwards to the active workspace when one exists.
    router.push(`/w/${workspace.slug}`);
    router.refresh();
  }

  return (
    <>
      <Button
        variant="primary"
        size="md"
        className={className}
        icon={icon ? <Plus className="h-4 w-4" /> : undefined}
        iconPosition="left"
        onClick={() => setOpen(true)}
      >
        {children}
      </Button>

      <CreateWorkspaceModal open={open} onClose={() => setOpen(false)} onCreated={handleCreated} />
    </>
  );
}
