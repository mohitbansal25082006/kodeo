// src/components/dashboard/dashboard-shell.tsx
"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import { X } from "lucide-react";
import { Sidebar } from "@/components/dashboard/sidebar";
import { Topbar } from "@/components/dashboard/topbar";
import { cn } from "@/lib/utils";
import type { WorkspaceWithRole } from "@/lib/workspace/types";

interface DashboardShellProps {
  user: {
    name: string;
    email: string;
    image?: string | null;
    username?: string | null;
  };
  activeWorkspace: WorkspaceWithRole | null;
  children: React.ReactNode;
}

const STATIC_TITLES: Record<string, string> = {
  "/dashboard": "Workspaces",
  "/profile": "Profile",
  "/settings/appearance": "Appearance",
  "/settings/security": "Security",
  "/settings/accounts": "Connected accounts",
  "/settings/danger": "Danger zone",
};

/**
 * /w/[slug]/* pages are workspace-scoped rather than static, so their
 * title can't live in STATIC_TITLES keyed by exact pathname the way
 * account settings pages do — instead this derives the title from
 * whichever tab segment follows the slug ("members", "settings", or
 * nothing for the overview), falling back to the workspace's own name
 * for the overview tab so the topbar reads e.g. "Acme Corp" rather
 * than a generic "Overview".
 */
function titleForWorkspacePath(pathname: string, workspaceName: string | undefined): string | null {
  const match = pathname.match(/^\/w\/[^/]+(?:\/([^/]+))?/);
  if (!match) return null;

  const tab = match[1];
  if (tab === "members") return "Members";
  if (tab === "settings") return "Workspace settings";
  return workspaceName || "Workspace";
}

export function DashboardShell({ user, activeWorkspace, children }: DashboardShellProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = React.useState(false);

  React.useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  React.useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  const title =
    titleForWorkspacePath(pathname, activeWorkspace?.name) ||
    STATIC_TITLES[pathname] ||
    "KODEO";

  return (
    <div className="flex h-screen overflow-hidden bg-bg">
      {/* Desktop sidebar */}
      <aside className="hidden w-64 shrink-0 border-r border-border lg:block">
        <Sidebar user={user} activeWorkspace={activeWorkspace} />
      </aside>

      {/* Mobile drawer */}
      <div
        className={cn(
          "fixed inset-0 z-50 lg:hidden",
          mobileOpen ? "pointer-events-auto" : "pointer-events-none"
        )}
      >
        <div
          onClick={() => setMobileOpen(false)}
          className={cn(
            "absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300",
            mobileOpen ? "opacity-100" : "opacity-0"
          )}
        />
        <div
          className={cn(
            "absolute left-0 top-0 h-full w-72 max-w-[80vw] border-r border-border bg-bg-elevated transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]",
            mobileOpen ? "translate-x-0" : "-translate-x-full"
          )}
        >
          <button
            onClick={() => setMobileOpen(false)}
            className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-surface text-secondary"
          >
            <X className="h-4 w-4" />
          </button>
          <Sidebar
            user={user}
            activeWorkspace={activeWorkspace}
            onNavigate={() => setMobileOpen(false)}
          />
        </div>
      </div>

      {/* Main column */}
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar title={title} onMenuClick={() => setMobileOpen(true)} />
        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto w-full max-w-4xl px-4 py-6 xs:px-5 xs:py-8 lg:px-8 lg:py-10">{children}</div>
        </main>
      </div>
    </div>
  );
}
