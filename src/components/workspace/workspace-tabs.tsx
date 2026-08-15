// src/components/workspace/workspace-tabs.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutGrid, Users, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import { canViewMembers, canEditWorkspaceDetails } from "@/lib/workspace/permissions";
import type { WorkspaceRole } from "@/lib/workspace/types";

interface WorkspaceTabsProps {
  slug: string;
  role: WorkspaceRole;
}

export function WorkspaceTabs({ slug, role }: WorkspaceTabsProps) {
  const pathname = usePathname();
  const base = `/w/${slug}`;

  const tabs = [
    { href: base, label: "Overview", icon: LayoutGrid, show: true },
    { href: `${base}/members`, label: "Members", icon: Users, show: canViewMembers(role) },
    { href: `${base}/settings`, label: "Settings", icon: Settings, show: canEditWorkspaceDetails(role) },
  ].filter((t) => t.show);

  return (
    <div className="mt-4 flex gap-1 overflow-x-auto">
      {tabs.map((tab) => {
        const active = pathname === tab.href;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={cn(
              "flex items-center gap-1.5 whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              active
                ? "bg-accent-dim/50 text-accent"
                : "text-secondary hover:bg-surface hover:text-primary"
            )}
          >
            <tab.icon className="h-3.5 w-3.5" />
            {tab.label}
          </Link>
        );
      })}
    </div>
  );
}
