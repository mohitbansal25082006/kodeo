import * as React from "react";
import { cn } from "@/lib/utils";

interface LogoMarkProps {
  className?: string;
  size?: number;
}

/**
 * The KODEO diamond mark — four diamonds arranged in a cross,
 * top + bottom lime, left + right muted olive.
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
        x="50"
        y="4"
        width="34"
        height="34"
        rx="4"
        transform="rotate(45 50 21)"
        fill="#D7FB43"
      />
      {/* bottom */}
      <rect
        x="50"
        y="62"
        width="34"
        height="34"
        rx="4"
        transform="rotate(45 50 79)"
        fill="#D7FB43"
      />
      {/* left */}
      <rect
        x="21"
        y="33"
        width="34"
        height="34"
        rx="4"
        transform="rotate(45 21 50)"
        fill="#6E7259"
        fillOpacity="0.85"
      />
      {/* right */}
      <rect
        x="79"
        y="33"
        width="34"
        height="34"
        rx="4"
        transform="rotate(45 79 50)"
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