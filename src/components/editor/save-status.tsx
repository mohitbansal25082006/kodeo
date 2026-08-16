// src/components/editor/save-status.tsx
import { Check, Loader2, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { SaveStatus } from "@/lib/editor/use-auto-save";

interface SaveStatusIndicatorProps {
  status: SaveStatus;
  error?: string | null;
  className?: string;
}

/**
 * Status bar indicator, not a tab decoration — the tab bar already
 * has the dirty dot from Part 3b to show "this file has unsaved
 * changes." This component answers a related but distinct question:
 * "is a save in flight / did the last one fail right now," which
 * only matters for the currently active file, hence it's rendered
 * once in the editor's status strip rather than once per tab.
 */
export function SaveStatusIndicator({ status, error, className }: SaveStatusIndicatorProps) {
  if (status === "idle") return null;

  return (
    <div
      className={cn("flex items-center gap-1.5 text-[11px]", className)}
      title={status === "error" ? error ?? "Couldn't save" : undefined}
    >
      {status === "saving" && (
        <>
          <Loader2 className="h-3 w-3 animate-spin text-tertiary" />
          <span className="text-tertiary">Saving...</span>
        </>
      )}
      {status === "saved" && (
        <>
          <Check className="h-3 w-3 text-success" />
          <span className="text-tertiary">Saved</span>
        </>
      )}
      {status === "error" && (
        <>
          <AlertCircle className="h-3 w-3 text-danger" />
          <span className="text-danger">Couldn&apos;t save</span>
        </>
      )}
    </div>
  );
}