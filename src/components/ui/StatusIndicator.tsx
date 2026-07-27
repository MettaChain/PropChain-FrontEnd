"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const statusIndicatorVariants = cva(
  "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium",
  {
    variants: {
      status: {
        active: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
        pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
        inactive: "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400",
        success: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
        error: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
        failed: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
        warning: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400",
        info: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
      },
      size: {
        sm: "px-2 py-0.5 text-[10px]",
        md: "px-2.5 py-1 text-xs",
        lg: "px-3 py-1.5 text-sm",
      },
      showDot: {
        true: "",
        false: "",
      },
    },
    defaultVariants: {
      status: "active",
      size: "md",
      showDot: true,
    },
  }
);

const dotVariants: Record<string, string> = {
  active: "bg-green-500",
  pending: "bg-yellow-500 animate-pulse",
  inactive: "bg-gray-500",
  success: "bg-green-500",
  error: "bg-red-500",
  failed: "bg-red-500",
  warning: "bg-orange-500",
  info: "bg-blue-500",
};

export interface StatusIndicatorProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof statusIndicatorVariants> {
  label?: string;
  showDot?: boolean;
}

function StatusIndicator({
  className,
  status,
  size,
  showDot = true,
  label,
  children,
  ...props
}: StatusIndicatorProps) {
  return (
    <span
      className={cn(statusIndicatorVariants({ status, size, showDot }), className)}
      {...props}
    >
      {showDot && (
        <span
          className={cn(
            "h-2 w-2 rounded-full",
            dotVariants[status || "active"]
          )}
          aria-hidden="true"
        />
      )}
      {label || children}
    </span>
  );
}

export { StatusIndicator, statusIndicatorVariants };
