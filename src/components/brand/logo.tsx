import * as React from "react";
import { cn } from "@/lib/utils";

interface LogoMarkProps {
  className?: string;
  size?: number;
}

/**
 * The KODEO diamond mark — four diamonds arranged in a cross,
 * top + bottom lime, left + right muted olive, each with a visible
 * gap between them (they do not touch at the center).
 * Matches the uploaded brand image exactly.
 */
export function LogoMark({ className, size = 28 }: LogoMarkProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("shrink-0", className)}
      aria-hidden="true"
    >
      {/* top */}
      <rect
        x="34"
        y="14"
        width="26"
        height="26"
        rx="2.5"
        transform="rotate(45 47 27)"
        fill="#D7FB43"
      />
      {/* bottom */}
      <rect
        x="34"
        y="60"
        width="26"
        height="26"
        rx="2.5"
        transform="rotate(45 47 73)"
        fill="#D7FB43"
      />
      {/* left */}
      <rect
        x="10"
        y="37"
        width="26"
        height="26"
        rx="2.5"
        transform="rotate(45 23 50)"
        fill="#6E7259"
        fillOpacity="0.85"
      />
      {/* right */}
      <rect
        x="58"
        y="37"
        width="26"
        height="26"
        rx="2.5"
        transform="rotate(45 71 50)"
        fill="#6E7259"
        fillOpacity="0.85"
      />
    </svg>
  );
}

interface LogoProps {
  className?: string;
  markSize?: number;
  showWordmark?: boolean;
}

export function Logo({
  className,
  markSize = 26,
  showWordmark = true,
}: LogoProps) {
  return (
    <div className={cn("inline-flex items-center gap-2.5", className)}>
      <LogoMark size={markSize} />
      {showWordmark && (
        <span className="text-[15px] font-bold tracking-[0.08em] text-primary">
          KODEO
        </span>
      )}
    </div>
  );
}