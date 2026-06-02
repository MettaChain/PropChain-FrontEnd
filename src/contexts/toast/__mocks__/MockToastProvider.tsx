/**
 * Mock Toast Provider for Testing
 * 
 * Provides a mock implementation of the ToastProvider for use in tests.
 * Captures all toast calls in an accessible array for test assertions.
 * 
 * Designed to work with Jest, Vitest, and React Testing Library.
 * 
 * @example
 * ```typescript
 * import { render, screen } from '@testing-library/react';
 * import { MockToastProvider } from '@/contexts/toast/__mocks__/MockToastProvider';
 * import { useToast } from '@/contexts/toast';
 * 
 * const TestComponent = () => {
 *   const toast = useToast();
 *   return <button onClick={() => toast.success('Done!')}>Show Toast</button>;
 * };
 * 
 * it('should capture success toast', () => {
 *   const { getByText } = render(
 *     <MockToastProvider>
 *       <TestComponent />
 *     </MockToastProvider>
 *   );
 *   
 *   getByText('Show Toast').click();
 *   
 *   expect(MockToastProvider.__toasts).toHaveLength(1);
 *   expect(MockToastProvider.__toasts[0]).toEqual(
 *     expect.objectContaining({ type: 'success', message: 'Done!' })
 *   );
 * });
 * ```
 */

'use client';

import React, { useState, useCallback, useMemo } from 'react';
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
} from '../constants';

/**
 * Extended context type for mock provider with exposed test helpers
 */
interface MockToastContextType extends ToastContextType {
  __toasts: Toast[];
  __reset: () => void;
}

/**
 * Stores reference to mock provider instance for test access.
 * Allows tests to inspect toasts without passing the provider instance.
 * 
 * @internal
 */
let mockProviderInstance: {
  toasts: Toast[];
  reset: () => void;
} | null = null;

/**
 * Mock Toast Provider Component
 * 
 * Replaces the real ToastProvider in tests. Captures all toast calls in an
 * in-memory array instead of rendering them with Sonner.
 * 
 * @component
 * @param {ToastProviderProps} props - Component props (same as ToastProvider)
 * @param {React.ReactNode} props.children - Child components
 * @param {number} [props.defaultDuration=5000] - Default auto-dismiss duration
 * @param {ToastPosition} [props.defaultPosition='top-right'] - Default position
 * @param {number} [props.maxToasts=10] - Maximum number of toasts
 * 
 * @returns {React.ReactElement} Provider with mock context
 */
export function MockToastProvider({
  children,
  defaultDuration = DEFAULT_DURATION,
  defaultPosition = DEFAULT_POSITION_DESKTOP,
  maxToasts = DEFAULT_MAX_TOASTS,
}: ToastProviderProps): React.ReactElement {
  // State for capturing toasts
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [isMounted, setIsMounted] = useState(false);

  // Mount detection for hydration safety
  React.useEffect(() => {
    setIsMounted(true);
  }, []);

  /**
   * Add a new toast to the captured toasts array.
   * 
   * Enforces maximum queue size by removing oldest toast if needed.
   * Generates unique ID for the toast.
   * 
   * @param {Omit<Toast, 'id'>} toastData - Toast configuration without ID
   * @returns {string} The unique ID of the created toast
   */
  const addToast = useCallback(
    (toastData: Omit<Toast, 'id'>): string => {
      const id = nanoid();
      const newToast: Toast = {
        ...toastData,
        id,
        duration: toastData.duration ?? defaultDuration,
        position: toastData.position ?? defaultPosition,
        dismissible: toastData.dismissible !== false,
      };

      setToasts((prevToasts) => {
        // Enforce max queue size
        let updatedToasts = prevToasts;
        if (updatedToasts.length >= maxToasts) {
          updatedToasts = updatedToasts.slice(1); // Remove oldest (FIFO)
        }
        return [...updatedToasts, newToast];
      });

      return id;
    },
    [defaultDuration, defaultPosition, maxToasts]
  );

  /**
   * Remove a toast by ID from the captured toasts array.
   * 
   * @param {string} id - The unique ID of the toast to remove
   */
  const removeToast = useCallback((id: string) => {
    setToasts((prevToasts) => prevToasts.filter((toast) => toast.id !== id));
  }, []);

  /**
   * Clear all toasts from the captured array.
   */
  const clearToasts = useCallback(() => {
    setToasts([]);
  }, []);

  /**
   * Reset the mock provider state.
   * Clears all captured toasts and resets counters.
   * Should be called in test cleanup or beforeEach hooks.
   */
  const reset = useCallback(() => {
    setToasts([]);
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

  // Memoize context value to match real provider behavior
  const contextValue = useMemo<MockToastContextType>(
    () => ({
      queue: toasts,
      addToast,
      removeToast,
      clearToasts,
      config,
      __toasts: toasts,
      __reset: reset,
    }),
    [toasts, addToast, removeToast, clearToasts, config, reset]
  );

  // Update static reference for test access
  React.useEffect(() => {
    mockProviderInstance = {
      toasts,
      reset,
    };
  }, [toasts, reset]);

  return (
    <ToastContext.Provider value={contextValue}>
      {children}
    </ToastContext.Provider>
  );
}

MockToastProvider.displayName = 'MockToastProvider';

/**
 * Static accessor to captured toasts for test assertions.
 * 
 * Usage: MockToastProvider.__toasts
 * 
 * @example
 * expect(MockToastProvider.__toasts).toHaveLength(1);
 * expect(MockToastProvider.__toasts[0].type).toBe('success');
 */
Object.defineProperty(MockToastProvider, '__toasts', {
  get: () => mockProviderInstance?.toasts || [],
  configurable: true,
});

/**
 * Static method to reset captured toasts.
 * 
 * Usage: MockToastProvider.__reset()
 * 
 * Call this in test cleanup (afterEach) or before each test to ensure
 * test isolation and prevent state leakage between tests.
 * 
 * @example
 * afterEach(() => {
 *   MockToastProvider.__reset();
 * });
 */
Object.defineProperty(MockToastProvider, '__reset', {
  value: () => {
    if (mockProviderInstance) {
      mockProviderInstance.reset();
    }
  },
  configurable: true,
});
