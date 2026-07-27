"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const notificationBadgeVariants = cva(
  "inline-flex items-center justify-center rounded-full font-medium",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground",
        destructive: "bg-destructive text-white",
        success: "bg-green-500 text-white",
        warning: "bg-yellow-500 text-white",
        outline: "border border-current text-foreground",
      },
      size: {
        sm: "h-4 min-w-4 px-1 text-[10px]",
        md: "h-5 min-w-5 px-1.5 text-xs",
        lg: "h-6 min-w-6 px-2 text-sm",
      },
    },
    defaultVariants: {
      variant: "destructive",
      size: "md",
    },
  }
);

export interface NotificationBadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof notificationBadgeVariants> {
  count?: number;
  maxCount?: number;
  showZero?: boolean;
  dot?: boolean;
}

function NotificationBadge({
  className,
  variant,
  size,
  count = 0,
  maxCount = 99,
  showZero = false,
  dot = false,
  children,
  ...props
}: NotificationBadgeProps) {
  if (!dot && count <= 0 && !showZero) {
    return children ? (
      <span className="relative inline-flex">{children}</span>
    ) : null;
  }

  const displayCount = count > maxCount ? `${maxCount}+` : String(count);

  const badge = dot ? (
    <span
      className={cn(
        "absolute -top-1 -right-1 h-2.5 w-2.5 rounded-full bg-destructive ring-2 ring-background",
        className
      )}
      {...props}
    />
  ) : (
    <span
      className={cn(notificationBadgeVariants({ variant, size }), className)}
      {...props}
    >
      {displayCount}
    </span>
  );

  if (children) {
    return (
      <span className="relative inline-flex">
        {children}
        {badge}
      </span>
    );
  }

  return badge;
}

export { NotificationBadge, notificationBadgeVariants };
