"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

// Skip to main content link for keyboard users
export function SkipToContent() {
  return (
    <a
      href="#main-content"
      className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-blue-600 focus:text-white focus:rounded-md"
    >
      Skip to main content
    </a>
  );
}

// Accessible icon wrapper
interface AccessibleIconProps {
  children: React.ReactNode;
  label: string;
  className?: string;
}

export function AccessibleIcon({ children, label, className }: AccessibleIconProps) {
  return (
    <span className={cn("inline-flex items-center", className)} aria-label={label}>
      {children}
      <span className="sr-only">{label}</span>
    </span>
  );
}

// Focus trap for modals and dropdowns
interface FocusTrapProps {
  children: React.ReactNode;
  enabled?: boolean;
  className?: string;
}

export function FocusTrap({ children, enabled = true, className }: FocusTrapProps) {
  const containerRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!enabled || !containerRef.current) return;

    const container = containerRef.current;
    const focusableElements = container.querySelectorAll(
      'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
    );

    if (focusableElements.length === 0) return;

    const firstElement = focusableElements[0] as HTMLElement;
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return;

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          lastElement.focus();
          e.preventDefault();
        }
      } else {
        if (document.activeElement === lastElement) {
          firstElement.focus();
          e.preventDefault();
        }
      }
    };

    container.addEventListener("keydown", handleKeyDown);
    firstElement.focus();

    return () => {
      container.removeEventListener("keydown", handleKeyDown);
    };
  }, [enabled]);

  return (
    <div ref={containerRef} className={className}>
      {children}
    </div>
  );
}

// Live region for dynamic content announcements
interface LiveRegionProps {
  children: React.ReactNode;
  politeness?: "polite" | "assertive" | "off";
  className?: string;
}

export function LiveRegion({ children, politeness = "polite", className }: LiveRegionProps) {
  return (
    <div
      role="status"
      aria-live={politeness}
      aria-atomic="true"
      className={cn("sr-only", className)}
    >
      {children}
    </div>
  );
}

// Accessible button with loading state
interface AccessibleButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  loading?: boolean;
  loadingText?: string;
}

export function AccessibleButton({
  loading = false,
  loadingText = "Loading...",
  children,
  disabled,
  ...props
}: AccessibleButtonProps) {
  return (
    <button
      disabled={disabled || loading}
      aria-busy={loading}
      {...props}
    >
      {loading ? (
        <>
          <span className="sr-only">{loadingText}</span>
          <span aria-hidden="true">{children}</span>
        </>
      ) : (
        children
      )}
    </button>
  );
}

// Keyboard navigation helper for lists
interface KeyboardNavigationProps {
  children: React.ReactNode;
  onEnter?: () => void;
  onEscape?: () => void;
  onArrowUp?: () => void;
  onArrowDown?: () => void;
  className?: string;
}

export function KeyboardNavigation({
  children,
  onEnter,
  onEscape,
  onArrowUp,
  onArrowDown,
  className,
}: KeyboardNavigationProps) {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    switch (e.key) {
      case "Enter":
        onEnter?.();
        break;
      case "Escape":
        onEscape?.();
        break;
      case "ArrowUp":
        e.preventDefault();
        onArrowUp?.();
        break;
      case "ArrowDown":
        e.preventDefault();
        onArrowDown?.();
        break;
    }
  };

  return (
    <div
      onKeyDown={handleKeyDown}
      className={className}
      role="group"
    >
      {children}
    </div>
  );
}
