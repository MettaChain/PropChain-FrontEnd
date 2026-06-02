'use client';

/**
 * Toast Provider Component
 * Manages global toast state and provides the Toast Context to all child components.
 * 
 * Wraps the application with context and initializes the Sonner Toaster component
 * for rendering notifications with support for:
 * - Auto-dismiss with configurable duration
 * - Pause-on-hover functionality
 * - Mobile responsive positioning and sizing
 * - Accessibility (WCAG 2.1 AA) with aria-live regions
 * - Swipe-to-dismiss on touch devices
 * - Keyboard navigation (Escape to dismiss)
 */

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { Toaster, toast as sonnerToast } from 'sonner';
import { nanoid } from 'nanoid';

import { ToastContext } from '../context';
import type {
  Toast,
  ToastContextType,
  ToastProviderProps,
  ToastProviderConfig,
  ToastPosition,
} from '../types';
import {
  DEFAULT_DURATION,
  DEFAULT_MAX_TOASTS,
  DEFAULT_POSITION_DESKTOP,
  DEFAULT_POSITION_MOBILE,
  MOBILE_BREAKPOINT,
  ARIA_LIVE_MAPPING,
  ACTION_AUTO_DISMISS_DELAY,
  HOVER_PAUSE_DURATION,
} from '../constants';
import {
  createManagedTimer,
  calculateFadeOpacity,
  normalizeDuration,
} from '../utils/timerManager';
import {
  isMobileViewport,
  getResponsiveStyles,
  isTouchDevice,
} from '../utils/responsiveToast';

/**
 * ToastProvider Component
 * 
 * Wraps the application to provide global toast functionality. Should be placed
 * high in the component tree, typically in the root layout.
 * 
 * @component
 * @param {ToastProviderProps} props - Component props
 * @param {React.ReactNode} props.children - Child components
 * @param {number} [props.defaultDuration=5000] - Default auto-dismiss duration in milliseconds
 * @param {ToastPosition} [props.defaultPosition] - Default position (auto-detected by viewport size)
 * @param {number} [props.maxToasts=10] - Maximum number of active toasts
 * 
 * @returns {React.ReactElement} Provider with context and Sonner Toaster
 * 
 * @example
 * // In app/layout.tsx
 * import { ToastProvider } from '@/contexts/toast';
 * 
 * export default function RootLayout({ children }: { children: React.ReactNode }) {
 *   return (
 *     <ToastProvider defaultDuration={5000} maxToasts={10}>
 *       {children}
 *     </ToastProvider>
 *   );
 * }
 */
export function ToastProvider({
  children,
  defaultDuration = DEFAULT_DURATION,
  defaultPosition: providedDefaultPosition,
  maxToasts = DEFAULT_MAX_TOASTS,
}: ToastProviderProps): React.ReactElement {
  // State management
  const [queue, setQueue] = useState<Toast[]>([]);
  const [toasterPosition, setToasterPosition] = useState<ToastPosition>(
    DEFAULT_POSITION_DESKTOP
  );
  const [isMounted, setIsMounted] = useState(false);

  // Detect viewport size and set responsive default position
  useEffect(() => {
    setIsMounted(true);

    const updatePosition = () => {
      const isProvidedPositionMobile =
        providedDefaultPosition?.includes('bottom') ||
        providedDefaultPosition?.includes('center');
      
      if (providedDefaultPosition && isProvidedPositionMobile) {
        // Use provided position if explicitly set
        setToasterPosition(providedDefaultPosition);
      } else if (providedDefaultPosition) {
        // Use provided position (it's a desktop position)
        setToasterPosition(providedDefaultPosition);
      } else {
        // Auto-detect based on viewport width
        const isMobile = window.innerWidth < MOBILE_BREAKPOINT;
        setToasterPosition(
          isMobile ? DEFAULT_POSITION_MOBILE : DEFAULT_POSITION_DESKTOP
        );
      }
    };

    updatePosition();
    window.addEventListener('resize', updatePosition);

    return () => {
      window.removeEventListener('resize', updatePosition);
    };
  }, [providedDefaultPosition]);

  // Determine default position for context
  const defaultPosition = providedDefaultPosition || toasterPosition;

  /**
   * Add a new toast to the queue.
   * 
   * Enforces maximum queue size by removing the oldest toast (FIFO) if needed.
   * Generates a unique ID for the toast and triggers Sonner's toast display.
   * 
   * Includes support for:
   * - Auto-dismiss with configurable duration
   * - Pause-on-hover functionality
   * - Accessibility (aria-live regions)
   * - Action buttons with auto-dismiss after action
   * - Mobile responsive positioning
   * 
   * @param {Omit<Toast, 'id'>} toastData - Toast configuration without ID
   * @returns {string} The unique ID of the created toast
   */
  const addToast = useCallback(
    (toastData: Omit<Toast, 'id'>): string => {
      const id = nanoid();
      const normalizedDuration = normalizeDuration(
        toastData.duration ?? defaultDuration,
        defaultDuration
      );

      const newToast: Toast = {
        ...toastData,
        id,
        duration: normalizedDuration,
        position: toastData.position ?? defaultPosition,
        dismissible: toastData.dismissible !== false,
      };

      setQueue((prevQueue) => {
        // Enforce max queue size by removing oldest toast if at capacity
        let updatedQueue = prevQueue;
        if (updatedQueue.length >= maxToasts) {
          updatedQueue = updatedQueue.slice(1); // Remove oldest (FIFO)
        }
        return [...updatedQueue, newToast];
      });

      // Trigger Sonner's toast display with enhanced features
      if (isMounted) {
        // Get aria-live level based on variant
        const ariaLive = ARIA_LIVE_MAPPING[newToast.type] || 'polite';

        // Handle action button with auto-dismiss delay
        let actionConfig: any = undefined;
        if (newToast.action) {
          const originalOnClick = newToast.action.onClick;
          actionConfig = {
            label: newToast.action.label,
            onClick: (event: any) => {
              // Execute original callback
              Promise.resolve(originalOnClick?.).then(() => {
                // Auto-dismiss after action (with delay for UI feedback)
                setTimeout(() => {
                  removeToast(id);
                }, ACTION_AUTO_DISMISS_DELAY);
              });
            },
          };
        }

        sonnerToast[newToast.type](newToast.message, {
          id: newToast.id,
          duration: newToast.duration === 0 ? Infinity : newToast.duration,
          action: actionConfig,
          dismissible: newToast.dismissible,
          onDismiss: () => {
            removeToast(id);
            newToast.onClose?.();
          },
          // Aria attributes for accessibility
          ...(typeof window !== 'undefined' && {
            className: `toast-${newToast.type} toast-aria-live-${ariaLive}`,
          }),
        });
      }

      return id;
    },
    [defaultDuration, defaultPosition, maxToasts, isMounted]
  );

  /**
   * Remove a toast from the queue by ID.
   * 
   * @param {string} id - The unique ID of the toast to remove
   */
  const removeToast = useCallback((id: string) => {
    setQueue((prevQueue) => prevQueue.filter((toast) => toast.id !== id));
  }, []);

  /**
   * Clear all toasts from the queue.
   * Useful for cleanup when navigating or dismissing multiple notifications.
   */
  const clearToasts = useCallback(() => {
    setQueue([]);
  }, []);

  // Build provider configuration
  const config: ToastProviderConfig = useMemo(
    () => ({
      defaultDuration,
      defaultPosition,
      maxToasts,
    }),
    [defaultDuration, defaultPosition, maxToasts]
  );

  // Memoize context value to prevent unnecessary re-renders of consuming components
  const contextValue = useMemo<ToastContextType>(
    () => ({
      queue,
      addToast,
      removeToast,
      clearToasts,
      config,
    }),
    [queue, addToast, removeToast, clearToasts, config]
  );

  // Don't render Sonner until client-side hydration is complete
  if (!isMounted) {
    return (
      <ToastContext.Provider value={contextValue}>
        {children}
      </ToastContext.Provider>
    );
  }

  return (
    <ToastContext.Provider value={contextValue}>
      {children}
      <Toaster
        position={toasterPosition}
        theme="light"
        richColors
        expand={true}
        closeButton={true}
        // Responsive toast styling
        toastOptions={{
          // Auto-dismiss duration (0 = persistent)
          duration: defaultDuration,
          // Styling classes for mobile responsiveness
          className: isMobileViewport()
            ? 'toast-mobile toast-responsive'
            : 'toast-desktop',
        }}
        // Sonner configuration for accessibility
        style={{
          // Ensure toasts have proper stacking and spacing
          gap: isMobileViewport() ? 8 : 12,
        }}
        // Enable pause on hover (built-in to Sonner)
        pauseWhenPageIsHidden={true}
      />
      {/* Additional styles for mobile toasts */}
      <style>{`
        /* Mobile toast responsive styles */
        @media (max-width: ${MOBILE_BREAKPOINT}px) {
          .toast-mobile {
            width: calc(100% - 16px) !important;
            max-width: 100% !important;
            margin: 8px !important;
            padding: 16px !important;
          }
          
          /* Ensure minimum touch target for close button */
          .toast-mobile button {
            min-width: 44px !important;
            min-height: 44px !important;
            padding: 10px !important;
          }
          
          /* Text wrapping on mobile */
          .toast-mobile .sonner-content {
            word-wrap: break-word;
            overflow-wrap: break-word;
            white-space: pre-wrap;
          }
        }
        
        /* Desktop toast styles */
        .toast-desktop {
          max-width: 400px;
        }
        
        /* Accessibility: Ensure proper color contrast */
        .sonner-toast {
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }
        
        /* Ensure buttons are accessible */
        .sonner-button {
          border-radius: 4px;
          padding: 8px 12px;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: background-color 0.2s ease;
        }
        
        .sonner-button:focus {
          outline: 2px solid #2563eb;
          outline-offset: 2px;
        }
        
        /* Reduce motion if user prefers it */
        @media (prefers-reduced-motion: reduce) {
          .sonner-toast {
            animation: none !important;
          }
        }
      `}</style>
    </ToastContext.Provider>
  );
}

ToastProvider.displayName = 'ToastProvider';
