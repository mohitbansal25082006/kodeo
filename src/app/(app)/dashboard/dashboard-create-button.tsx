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

export function DashboardCreateButton({ children, icon = false, className }: DashboardCreateButtonProps) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);

  function handleCreated(workspace: Workspace) {
    setOpen(false);
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
