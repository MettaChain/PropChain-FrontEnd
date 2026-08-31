"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export type SaveStatus = "idle" | "saving" | "saved" | "error";

export interface AutoSaveIndicatorProps {
  status: SaveStatus;
  className?: string;
  showIcon?: boolean;
  savedMessage?: string;
  errorMessage?: string;
}

function AutoSaveIndicator({
  status,
  className,
  showIcon = true,
  savedMessage = "Saved",
  errorMessage = "Failed to save",
}: AutoSaveIndicatorProps) {
  const getStatusConfig = () => {
    switch (status) {
      case "saving":
        return {
          icon: (
            <svg
              className="h-3 w-3 animate-spin"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
          ),
          text: "Saving...",
          className: "text-blue-600 dark:text-blue-400",
        };
      case "saved":
        return {
          icon: (
            <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          ),
          text: savedMessage,
          className: "text-green-600 dark:text-green-400",
        };
      case "error":
        return {
          icon: (
            <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          ),
          text: errorMessage,
          className: "text-red-600 dark:text-red-400",
        };
      default:
        return null;
    }
  };

  const config = getStatusConfig();

  if (!config) return null;

  return (
    <div
      className={cn(
        "inline-flex items-center gap-1.5 text-xs",
        config.className,
        className
      )}
      role="status"
      aria-live="polite"
    >
      {showIcon && config.icon}
      <span>{config.text}</span>
    </div>
  );
}

export interface UseAutoSaveOptions {
  onSave: () => Promise<void>;
  delay?: number;
  dependencies?: unknown[];
}

export function useAutoSave({
  onSave,
  delay = 1000,
  dependencies = [],
}: UseAutoSaveOptions) {
  const [status, setStatus] = React.useState<SaveStatus>("idle");
  const timeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  const save = React.useCallback(async () => {
    setStatus("saving");
    try {
      await onSave();
      setStatus("saved");
      setTimeout(() => setStatus("idle"), 2000);
    } catch {
      setStatus("error");
    }
  }, [onSave]);

  React.useEffect(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      if (status !== "saving") {
        save();
      }
    }, delay);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, dependencies);

  return { status, save };
}

export { AutoSaveIndicator };
