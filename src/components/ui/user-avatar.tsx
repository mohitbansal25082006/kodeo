// src/components/ui/user-avatar.tsx
"use client";

import * as React from "react";
import { isAvatarUrl, getAvatarSvg } from "@/lib/avatar";
import { cn } from "@/lib/utils";

interface UserAvatarProps {
  image?: string | null;
  name?: string | null;
  className?: string;
}

/**
 * Renders a user's avatar regardless of which of the two possible
 * "shapes" it's in — see src/lib/avatar.ts for why there are two.
 * Falls back to the first letter of the user's name if neither is set.
 */
export function UserAvatar({ image, name, className }: UserAvatarProps) {
  const svgMarkup = React.useMemo(() => {
    if (image && !isAvatarUrl(image)) return getAvatarSvg(image);
    return null;
  }, [image]);

  if (image && isAvatarUrl(image)) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={image} alt="" className={cn("h-full w-full object-cover", className)} />
    );
  }

  if (svgMarkup) {
    return (
      <div
        className={cn("h-full w-full [&>svg]:h-full [&>svg]:w-full", className)}
        dangerouslySetInnerHTML={{ __html: svgMarkup }}
      />
    );
  }

  return (
    <div className={cn("flex h-full w-full items-center justify-center text-xs font-bold text-secondary", className)}>
      {name?.[0]?.toUpperCase() || "K"}
    </div>
  );
}