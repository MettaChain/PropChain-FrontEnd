/**
 * Toast Accessibility Component
 * Wraps toast content with proper ARIA attributes and keyboard event handlers
 * for WCAG 2.1 AA compliance
 */

'use client';

import React, { useEffect, useRef } from 'react';
import type { ToastVariant } from '../types';
import {
  setupEscapeKeyHandler,
  manageFocusAfterDismissal,
  setupSwipeToDismiss,
  announceToScreenReader,
} from '../utils/keyboardHandler';
import { ARIA_LIVE_MAPPING } from '../constants';

/**
 * Props for the Toast Accessibility wrapper
 */
interface ToastAccessibilityProps {
  /** The ID of the toast for identification */
  toastId: string;
  /** The type of toast (determines aria-live priority) */
  variant: ToastVariant;
  /** The content to wrap */
  children: React.ReactNode;
  /** Optional message to announce to screen readers */
  ariaLabel?: string;
  /** Callback when user presses Escape key */
  onDismiss: () => void;
  /** Optional callback for swipe dismissal */
  onSwipeDismiss?: () => void;
}

/**
 * Toast Accessibility Wrapper Component
 * 
 * Ensures toasts are fully accessible by:
 * - Setting appropriate aria-live regions (polite/assertive based on severity)
 * - Announcing messages to screen readers
 * - Handling keyboard navigation (Escape key)
 * - Managing focus to prevent returning to dismissed toasts
 * - Supporting swipe-to-dismiss on touch devices
 * - Using semantic HTML roles (role="alert" for error/warning)
 * 
 * @component
 * @param {ToastAccessibilityProps} props - Component props
 * @returns {React.ReactElement} Accessible toast wrapper
 * 
 * @example
 * <ToastAccessibility
 *   toastId="toast-1"
 *   variant="error"
 *   ariaLabel="Error: Network connection failed"
 *   onDismiss={() => removeToast('toast-1')}
 * >
 *   <ToastContent message="Network error" />
 * </ToastAccessibility>
 */
export const ToastAccessibility = React.forwardRef<
  HTMLDivElement,
  ToastAccessibilityProps
>(
  (
    {
      toastId,
      variant,
      children,
      ariaLabel,
      onDismiss,
      onSwipeDismiss,
    },
    ref
  ) => {
    const elementRef = useRef<HTMLDivElement>(null);
    const combinedRef = ref || elementRef;

    // Determine aria-live level based on variant
    const ariaLive = ARIA_LIVE_MAPPING[variant] || 'polite';

    // Determine if this is an alert (error/warning) that needs role="alert"
    const isAlert = variant === 'error' || variant === 'warning';

    // Setup keyboard and accessibility handlers on mount
    useEffect(() => {
      const element =
        combinedRef instanceof Object && 'current' in combinedRef
          ? combinedRef.current
          : null;

      if (!element) {
        return;
      }

      // Setup Escape key handler
      const cleanupEscape = setupEscapeKeyHandler(() => {
        onDismiss();
      });

      // Setup swipe-to-dismiss gesture
      let cleanupSwipe: (() => void) | null = null;
      if (onSwipeDismiss) {
        cleanupSwipe = setupSwipeToDismiss(element, onSwipeDismiss);
      }

      // Announce to screen reader if aria-label provided
      if (ariaLabel) {
        announceToScreenReader(ariaLabel, ariaLive);
      }

      // Cleanup on unmount
      return () => {
        cleanupEscape();
        cleanupSwipe?.();

        // Manage focus after dismissal
        manageFocusAfterDismissal(element);
      };
    }, [toastId, ariaLabel, ariaLive, onDismiss, onSwipeDismiss, combinedRef]);

    return (
      <div
        ref={combinedRef}
        role={isAlert ? 'alert' : 'status'}
        aria-live={ariaLive}
        aria-atomic="true"
        aria-label={ariaLabel}
        data-testid={`toast-accessibility-${toastId}`}
        data-toast-variant={variant}
        className="toast-accessibility-wrapper"
      >
        {children}
      </div>
    );
  }
);

ToastAccessibility.displayName = 'ToastAccessibility';

/**
 * Higher-order component to wrap a toast with accessibility features
 * 
 * @param {React.ReactNode} content - The toast content to wrap
 * @param {Object} options - Configuration options
 * @returns {React.ReactElement} Wrapped content with accessibility features
 * 
 * @example
 * const accessibleToast = withToastAccessibility(
 *   <div>Error message</div>,
 *   {
 *     variant: 'error',
 *     toastId: 'error-1',
 *     ariaLabel: 'Error notification',
 *     onDismiss: () => console.log('Dismissed'),
 *   }
 * );
 */
export function withToastAccessibility(
  content: React.ReactNode,
  options: {
    variant: ToastVariant;
    toastId: string;
    ariaLabel?: string;
    onDismiss: () => void;
    onSwipeDismiss?: () => void;
  }
): React.ReactElement {
  return (
    <ToastAccessibility
      toastId={options.toastId}
      variant={options.variant}
      ariaLabel={options.ariaLabel}
      onDismiss={options.onDismiss}
      onSwipeDismiss={options.onSwipeDismiss}
    >
      {content}
    </ToastAccessibility>
  );
}
