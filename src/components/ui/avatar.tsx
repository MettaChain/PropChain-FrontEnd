"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

type AvatarSize = "xs" | "sm" | "md" | "lg" | "xl";

interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  src?: string | null;
  alt?: string;
  initials?: string;
  size?: AvatarSize;
  status?: "online" | "offline" | "away" | "busy";
  fallback?: React.ReactNode;
}

const sizeStyles: Record<AvatarSize, string> = {
  xs: "h-6 w-6 text-xs",
  sm: "h-8 w-8 text-sm",
  md: "h-10 w-10 text-base",
  lg: "h-12 w-12 text-lg",
  xl: "h-16 w-16 text-xl",
};

const statusStyles = {
  online: "bg-green-500",
  offline: "bg-gray-400",
  away: "bg-yellow-500",
  busy: "bg-red-500",
};

export function Avatar({
  src,
  alt = "",
  initials,
  size = "md",
  status,
  fallback,
  className,
  ...props
}: AvatarProps) {
  const [imageError, setImageError] = React.useState(false);

  const showImage = src && !imageError;
  const showInitials = !showImage && initials;
  const showFallback = !showImage && !showInitials && fallback;

  return (
    <div
      className={cn(
        "relative inline-flex items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden",
        sizeStyles[size],
        className
      )}
      {...props}
    >
      {showImage ? (
        <img
          src={src}
          alt={alt}
          className="h-full w-full object-cover"
          onError={() => setImageError(true)}
        />
      ) : showInitials ? (
        <span className="font-medium text-gray-600 dark:text-gray-300">
          {initials}
        </span>
      ) : showFallback ? (
        fallback
      ) : (
        <svg
          className="h-full w-full text-gray-300 dark:text-gray-600"
          fill="currentColor"
          viewBox="0 0 24 24"
        >
          <path d="M24 20.993V24H0v-2.996A14.977 14.977 0 0112.004 15c4.904 0 9.26 2.354 11.996 5.993zM16.002 8.999a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      )}
      {status && (
        <span
          className={cn(
            "absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-white dark:border-gray-800",
            statusStyles[status]
          )}
        />
      )}
    </div>
  );
}

interface AvatarGroupProps {
  avatars: Array<{
    src?: string | null;
    alt?: string;
    initials?: string;
  }>;
  max?: number;
  size?: AvatarSize;
  className?: string;
}

export function AvatarGroup({
  avatars,
  max = 3,
  size = "md",
  className,
}: AvatarGroupProps) {
  const visibleAvatars = avatars.slice(0, max);
  const remainingCount = Math.max(0, avatars.length - max);

  return (
    <div className={cn("flex -space-x-2", className)}>
      {visibleAvatars.map((avatar, index) => (
        <Avatar
          key={index}
          src={avatar.src}
          alt={avatar.alt}
          initials={avatar.initials}
          size={size}
          className="ring-2 ring-white dark:ring-gray-800"
        />
      ))}
      {remainingCount > 0 && (
        <div
          className={cn(
            "inline-flex items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800 ring-2 ring-white dark:ring-gray-800",
            sizeStyles[size]
          )}
        >
          <span className="font-medium text-gray-600 dark:text-gray-300 text-xs">
            +{remainingCount}
          </span>
        </div>
      )}
    </div>
  );
}
