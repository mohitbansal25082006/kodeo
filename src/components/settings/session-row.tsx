// src/components/settings/session-row.tsx
"use client";

import { Monitor, Smartphone, X } from "lucide-react";

interface SessionRowProps {
  userAgent?: string | null;
  ipAddress?: string | null;
  createdAt: string | Date;
  isCurrent: boolean;
  onRevoke?: () => void;
  revoking?: boolean;
}

function parseDevice(ua?: string | null) {
  if (!ua) return { label: "Unknown device", isMobile: false };
  const isMobile = /mobile|android|iphone/i.test(ua);
  let browser = "Browser";
  if (/edg/i.test(ua)) browser = "Edge";
  else if (/chrome/i.test(ua)) browser = "Chrome";
  else if (/firefox/i.test(ua)) browser = "Firefox";
  else if (/safari/i.test(ua)) browser = "Safari";
  const os = /windows/i.test(ua)
    ? "Windows"
    : /mac/i.test(ua)
      ? "macOS"
      : /linux/i.test(ua)
        ? "Linux"
        : /android/i.test(ua)
          ? "Android"
          : /iphone|ipad/i.test(ua)
            ? "iOS"
            : "";
  return { label: `${browser}${os ? ` · ${os}` : ""}`, isMobile };
}

/**
 * In local development, requests come from the loopback address, which
 * Node/Next report as the IPv6 unspecified/loopback form
 * "0000:0000:0000:0000:0000:0000:0000:0000" (a zero-expanded "::") or
 * "::1" rather than the more familiar "127.0.0.1" — technically correct,
 * but meaningless and alarming-looking for a user to see in a security
 * settings page. Collapse all of these down to a friendly "Localhost"
 * label instead of the raw address. Any other address is shown as-is.
 */
function formatIp(ip?: string | null): string | null {
  if (!ip) return null;
  const normalized = ip.trim().toLowerCase();
  const isLoopbackOrUnspecified =
    normalized === "::1" ||
    normalized === "::" ||
    normalized === "127.0.0.1" ||
    /^(0{1,4}:){7}0{1,4}$/.test(normalized); // fully zero-expanded "::"

  if (isLoopbackOrUnspecified) return "Localhost";
  return ip;
}

export function SessionRow({
  userAgent,
  ipAddress,
  createdAt,
  isCurrent,
  onRevoke,
  revoking,
}: SessionRowProps) {
  const { label, isMobile } = parseDevice(userAgent);
  const Icon = isMobile ? Smartphone : Monitor;
  const date = new Date(createdAt);
  const displayIp = formatIp(ipAddress);

  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-border bg-bg-elevated px-4 py-3">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-surface text-secondary">
          <Icon className="h-4 w-4" />
        </div>
        <div>
          <div className="flex items-center gap-2 text-sm font-medium text-primary">
            {label}
            {isCurrent && (
              <span className="rounded-full bg-accent-dim/60 px-2 py-0.5 text-[10px] font-semibold text-accent">
                This device
              </span>
            )}
          </div>
          <div className="text-xs text-tertiary">
            {displayIp ? `${displayIp} · ` : ""}
            {date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
          </div>
        </div>
      </div>
      {!isCurrent && onRevoke && (
        <button
          onClick={onRevoke}
          disabled={revoking}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-tertiary transition-colors hover:bg-danger/10 hover:text-danger disabled:opacity-50"
          aria-label="Revoke session"
        >
          {revoking ? (
            <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
          ) : (
            <X className="h-3.5 w-3.5" />
          )}
        </button>
      )}
    </div>
  );
}