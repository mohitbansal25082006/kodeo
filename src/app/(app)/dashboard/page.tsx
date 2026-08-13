// src/app/(app)/dashboard/page.tsx
import { Plus, FolderGit2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function DashboardPage() {
  return (
    <div>
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-xl font-bold text-primary">Your workspaces</h2>
          <p className="mt-1 text-sm text-secondary">
            Spin up a cloud environment and start building.
          </p>
        </div>
        <Button variant="primary" size="md" icon={<Plus className="h-4 w-4" />} iconPosition="left">
          New workspace
        </Button>
      </div>

      {/* Empty state */}
      <div className="mt-8 flex flex-col items-center rounded-2xl border border-dashed border-border bg-surface/40 px-6 py-16 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-border bg-bg-elevated">
          <FolderGit2 className="h-6 w-6 text-tertiary" />
        </div>
        <h3 className="mt-5 text-lg font-semibold text-primary">
          No workspaces yet
        </h3>
        <p className="mt-2 max-w-sm text-sm text-secondary">
          Create your first workspace to get a fully configured cloud
          environment — ready to code in seconds.
        </p>
        <Button
          variant="primary"
          size="md"
          className="mt-6"
          icon={<Plus className="h-4 w-4" />}
          iconPosition="left"
        >
          Create your first workspace
        </Button>
        <div className="mt-6 flex items-center gap-1.5 text-xs text-tertiary">
          <Sparkles className="h-3.5 w-3.5 text-accent" />
          Workspace creation is coming in a future update
        </div>
      </div>
    </div>
  );
}