// src/components/dashboard/sidebar.tsx
"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutGrid,
  User,
  Palette,
  ShieldCheck,
  Link2,
  AlertTriangle,
  Settings,
  ChevronDown,
} from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { UserAvatar } from "@/components/ui/user-avatar";
import { cn } from "@/lib/utils";

interface SidebarProps {
  user: {
    name: string;
    email: string;
    image?: string | null;
    username?: string | null;
  };
  onNavigate?: () => void;
}

const MAIN_NAV = [{ href: "/dashboard", label: "Workspaces", icon: LayoutGrid }];

const SETTINGS_NAV = [
  { href: "/profile", label: "Profile", icon: User },
  { href: "/settings/appearance", label: "Appearance", icon: Palette },
  { href: "/settings/security", label: "Security", icon: ShieldCheck },
  { href: "/settings/accounts", label: "Connected accounts", icon: Link2 },
  { href: "/settings/danger", label: "Danger zone", icon: AlertTriangle, danger: true },
];

export function Sidebar({ user, onNavigate }: SidebarProps) {
  const pathname = usePathname();
  const [settingsOpen, setSettingsOpen] = React.useState(
    pathname.startsWith("/settings") || pathname.startsWith("/profile")
  );

  function isActive(href: string) {
    return pathname === href || pathname.startsWith(href + "/");
  }

  return (
    <div className="flex h-full flex-col bg-bg-elevated">
      <div className="flex h-16 items-center border-b border-border px-5">
        <Link href="/dashboard" onClick={onNavigate}>
          <Logo markSize={24} />
        </Link>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <div className="space-y-0.5">
          {MAIN_NAV.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onNavigate}
                className={cn(
                  "flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                  active
                    ? "bg-accent-dim/50 text-accent"
                    : "text-secondary hover:bg-surface hover:text-primary"
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </div>

        <div className="mt-6">
          <button
            onClick={() => setSettingsOpen((v) => !v)}
            className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-xs font-semibold uppercase tracking-wider text-tertiary hover:text-secondary"
          >
            <span className="flex items-center gap-2">
              <Settings className="h-3.5 w-3.5" />
              Settings
            </span>
            <ChevronDown
              className={cn(
                "h-3.5 w-3.5 transition-transform duration-200",
                settingsOpen && "rotate-180"
              )}
            />
          </button>

          <div
            className={cn(
              "overflow-hidden transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]",
              settingsOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
            )}
          >
            <div className="mt-1 space-y-0.5">
              {SETTINGS_NAV.map((item) => {
                const active = isActive(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={onNavigate}
                    className={cn(
                      "flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                      active
                        ? item.danger
                          ? "bg-danger/10 text-danger"
                          : "bg-accent-dim/50 text-accent"
                        : item.danger
                          ? "text-danger/70 hover:bg-danger/10 hover:text-danger"
                          : "text-secondary hover:bg-surface hover:text-primary"
                    )}
                  >
                    <item.icon className="h-4 w-4" />
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      </nav>

      <div className="border-t border-border p-3">
        <Link
          href="/profile"
          onClick={onNavigate}
          className="flex items-center gap-2.5 rounded-lg px-2 py-2 transition-colors hover:bg-surface"
        >
          <div className="relative h-8 w-8 shrink-0 overflow-hidden rounded-full bg-surface">
            <UserAvatar image={user.image} name={user.name} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-medium text-primary">{user.name}</div>
            <div className="truncate text-xs text-tertiary">
              {user.username ? `@${user.username}` : user.email}
            </div>
          </div>
        </Link>
      </div>
    </div>
  );
}