"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

type BadgeVariant = "default" | "secondary" | "destructive" | "outline" | "success" | "warning" | "info";
type BadgeSize = "sm" | "md" | "lg";

interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: BadgeVariant;
  size?: BadgeSize;
  icon?: React.ReactNode;
  removable?: boolean;
  onRemove?: () => void;
}

const variantStyles: Record<BadgeVariant, string> = {
  default: "bg-primary text-primary-foreground hover:bg-primary/80",
  secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
  destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/80",
  outline: "text-foreground border",
  success: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
  warning: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
  info: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
};

const sizeStyles: Record<BadgeSize, string> = {
  sm: "px-2 py-0.5 text-xs",
  md: "px-2.5 py-0.5 text-sm",
  lg: "px-3 py-1 text-base",
};

export function Badge({
  variant = "default",
  size = "md",
  icon,
  removable = false,
  onRemove,
  className,
  children,
  ...props
}: BadgeProps) {
  return (
    <div
      className={cn(
        "inline-flex items-center gap-1 rounded-full font-medium transition-colors",
        variantStyles[variant],
        sizeStyles[size],
        className
      )}
      {...props}
    >
      {icon && <span className="flex-shrink-0">{icon}</span>}
      {children}
      {removable && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove?.();
          }}
          className="ml-1 rounded-full p-0.5 hover:bg-black/10 dark:hover:bg-white/10"
          aria-label="Remove"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M18 6 6 18" />
            <path d="m6 6 12 12" />
          </svg>
        </button>
      )}
    </div>
  );
}

interface StatusBadgeProps {
  status: "active" | "inactive" | "pending" | "error" | "success";
  label?: string;
  className?: string;
}

const statusConfig = {
  active: { variant: "success" as const, label: "Active" },
  inactive: { variant: "secondary" as const, label: "Inactive" },
  pending: { variant: "warning" as const, label: "Pending" },
  error: { variant: "destructive" as const, label: "Error" },
  success: { variant: "success" as const, label: "Success" },
};

export function StatusBadge({ status, label, className }: StatusBadgeProps) {
  const config = statusConfig[status];
  return (
    <Badge variant={config.variant} className={className}>
      {label || config.label}
    </Badge>
  );
}

interface NetworkBadgeProps {
  chainId: number;
  className?: string;
}

const networkNames: Record<number, string> = {
  1: "Ethereum",
  137: "Polygon",
  56: "BSC",
  42161: "Arbitrum",
  10: "Optimism",
};

export function NetworkBadge({ chainId, className }: NetworkBadgeProps) {
  return (
    <Badge variant="info" className={className}>
      {networkNames[chainId] || `Chain ${chainId}`}
    </Badge>
  );
}

export { Badge as UIBadge };
