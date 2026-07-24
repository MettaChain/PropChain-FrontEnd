"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface TooltipProps {
  content: React.ReactNode;
  children: React.ReactNode;
  position?: "top" | "bottom" | "left" | "right";
  delay?: number;
  className?: string;
  contentClassName?: string;
}

export function Tooltip({
  content,
  children,
  position = "top",
  delay = 300,
  className,
  contentClassName,
}: TooltipProps) {
  const [isVisible, setIsVisible] = React.useState(false);
  const timeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  const showTooltip = React.useCallback(() => {
    timeoutRef.current = setTimeout(() => {
      setIsVisible(true);
    }, delay);
  }, [delay]);

  const hideTooltip = React.useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setIsVisible(false);
  }, []);

  React.useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const positionStyles = {
    top: "bottom-full left-1/2 -translate-x-1/2 mb-2",
    bottom: "top-full left-1/2 -translate-x-1/2 mt-2",
    left: "right-full top-1/2 -translate-y-1/2 mr-2",
    right: "left-full top-1/2 -translate-y-1/2 ml-2",
  };

  const animationStyles = {
    top: "animate-in fade-in slide-in-from-bottom-2",
    bottom: "animate-in fade-in slide-in-from-top-2",
    left: "animate-in fade-in slide-in-from-right-2",
    right: "animate-in fade-in slide-in-from-left-2",
  };

  return (
    <div
      className={cn("relative inline-flex", className)}
      onMouseEnter={showTooltip}
      onMouseLeave={hideTooltip}
      onFocus={showTooltip}
      onBlur={hideTooltip}
    >
      {children}
      {isVisible && (
        <div
          className={cn(
            "absolute z-50 px-3 py-1.5 text-sm rounded-md shadow-md",
            "bg-gray-900 text-gray-50 dark:bg-gray-800 dark:text-gray-100",
            "whitespace-nowrap pointer-events-none",
            positionStyles[position],
            animationStyles[position],
            contentClassName
          )}
          role="tooltip"
        >
          {content}
        </div>
      )}
    </div>
  );
}

interface TooltipTriggerProps {
  children: React.ReactNode;
  tooltip: React.ReactNode;
  position?: "top" | "bottom" | "left" | "right";
  className?: string;
}

export function TooltipTrigger({
  children,
  tooltip,
  position = "top",
  className,
}: TooltipTriggerProps) {
  return (
    <Tooltip content={tooltip} position={position} className={className}>
      {children}
    </Tooltip>
  );
}

interface TooltipProviderProps {
  children: React.ReactNode;
  delayDuration?: number;
}

export function TooltipProvider({
  children,
  delayDuration = 300,
}: TooltipProviderProps) {
  return (
    <div data-tooltip-delay={delayDuration}>
      {children}
    </div>
  );
}

export { Tooltip as UITooltip };
