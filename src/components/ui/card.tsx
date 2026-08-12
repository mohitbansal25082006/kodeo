import * as React from "react";
import { cn } from "@/lib/utils";

export function Card({
  className,
  children,
  hover = false,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { hover?: boolean }) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-border bg-surface/60 backdrop-blur-sm",
        hover &&
          "transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] hover:border-border-strong hover:bg-surface hover:-translate-y-1",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}