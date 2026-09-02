"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Inbox, Search, FileText, AlertCircle } from "lucide-react";

interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  action?: {
    label: string;
    onClick: () => void;
  };
  variant?: "default" | "search" | "error" | "data";
  className?: string;
}

const defaultIcons = {
  default: Inbox,
  search: Search,
  error: AlertCircle,
  data: FileText,
};

export function EmptyState({
  title,
  description,
  icon,
  action,
  variant = "default",
  className,
}: EmptyStateProps) {
  const IconComponent = defaultIcons[variant];
  const isForwardRefComponent =
    !!icon && typeof icon === 'object' && (icon as any).$$typeof === Symbol.for('react.forward_ref');
  const iconIsComponent = typeof icon === 'function' || isForwardRefComponent;
  const IconElement = iconIsComponent
    ? React.createElement(icon as React.ComponentType, { className: "h-12 w-12 text-gray-400 dark:text-gray-500" })
    : icon || <IconComponent className="h-12 w-12 text-gray-400 dark:text-gray-500" />;

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center py-12 px-4 text-center",
        className
      )}
    >
      <div className="mb-4 text-gray-400 dark:text-gray-500">
        {IconElement}
      </div>
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
        {title}
      </h3>
      {description && (
        <p className="text-sm text-gray-500 dark:text-gray-400 max-w-sm mb-6">
          {description}
        </p>
      )}
      {action && (
        <Button onClick={action.onClick} variant="default">
          {action.label}
        </Button>
      )}
    </div>
  );
}

export function PropertyEmptyState({ className }: { className?: string }) {
  return (
    <EmptyState
      title="No properties found"
      description="There are no properties available at the moment. Check back later or create a new listing."
      variant="data"
      action={{
        label: "Browse Properties",
        onClick: () => window.location.href = "/properties",
      }}
      className={className}
    />
  );
}

export function TransactionEmptyState({ className }: { className?: string }) {
  return (
    <EmptyState
      title="No transactions yet"
      description="Your transaction history will appear here once you make your first transaction."
      variant="data"
      className={className}
    />
  );
}

export function SearchEmptyState({ query, className }: { query?: string; className?: string }) {
  return (
    <EmptyState
      title="No results found"
      description={query ? `No results for "${query}". Try a different search term.` : "No results found. Try a different search term."}
      variant="search"
      className={className}
    />
  );
}

export function ErrorEmptyState({ 
  message = "Something went wrong",
  onRetry,
  className 
}: { 
  message?: string;
  onRetry?: () => void;
  className?: string;
}) {
  return (
    <EmptyState
      title="Oops!"
      description={message}
      variant="error"
      action={onRetry ? { label: "Try Again", onClick: onRetry } : undefined}
      className={className}
    />
  );
}
