'use client';

/**
 * useToast Hook
 * Provides access to toast notification methods within a ToastProvider context.
 */

import { useContext } from 'react';
import { nanoid } from 'nanoid';

import { ToastContext } from '../context';
import type { Toast, ToastOptions, UseToastReturn } from '../types';

/**
 * Hook to trigger toast notifications from any component.
 * 
 * Must be called within a component that is a descendant of the ToastProvider.
 * This hook provides convenient methods to display success, error, warning, and info toasts,
 * as well as a generic method for advanced use cases.
 * 
 * @throws {Error} If called outside of a ToastProvider with message:
 *         "useToast must be called within a ToastProvider"
 * 
 * @returns {UseToastReturn} Object with toast methods (success, error, warning, info, toast)
 * 
 * @example
 * // Basic usage in a component
 * 'use client';
 * import { useToast } from '@/contexts/toast';
 * 
 * export function MyComponent() {
 *   const toast = useToast();
 *   
 *   const handleSubmit = async () => {
 *     try {
 *       // ... perform operation
 *       toast.success('Operation completed!');
 *     } catch (error) {
 *       toast.error('Something went wrong');
 *     }
 *   };
 *   
 *   return <button onClick={handleSubmit}>Submit</button>;
 * }
 * 
 * @example
 * // With custom options
 * const toastId = toast.warning('This will disappear in 3 seconds', { 
 *   duration: 3000 
 * });
 * 
 * @example
 * // With action button
 * toast.info('File uploaded', {
 *   action: {
 *     label: 'View',
 *     onClick: () => window.open('/files/uploaded')
 *   }
 * });
 * 
 * @example
 * // Persistent toast (no auto-dismiss)
 * toast.error('Critical error. Please contact support.', {
 *   duration: 0
 * });
 * 
 * @example
 * // Generic toast with custom type
 * toast.toast({
 *   type: 'success',
 *   message: 'Custom configuration',
 *   duration: 2000,
 *   position: 'bottom-center'
 * });
 */
export function useToast(): UseToastReturn {
  const context = useContext(ToastContext);

  if (!context) {
    throw new Error(
      'useToast must be called within a ToastProvider. ' +
      'Make sure your component is wrapped with <ToastProvider> in your root layout.'
    );
  }

  /**
   * Display a success toast notification.
   * 
   * @param {string} message - The notification message to display
   * @param {ToastOptions} [options] - Optional configuration for this specific toast
   *                                   (overrides provider defaults)
   * @returns {string} The unique ID of the created toast
   * 
   * @example
   * const toastId = toast.success('Profile updated!');
   * 
   * @example
   * toast.success('File saved', { 
   *   duration: 3000,
   *   position: 'bottom-right'
   * });
   */
  const success = (message: string, options?: ToastOptions): string => {
    return context.addToast({
      type: 'success',
      message,
      ...options,
    });
  };

  /**
   * Display an error toast notification.
   * 
   * Error toasts are high-priority and interrupt screen reader announcements
   * with aria-live="assertive".
   * 
   * @param {string} message - The error message to display (user-friendly, no sensitive details)
   * @param {ToastOptions} [options] - Optional configuration for this specific toast
   *                                   (overrides provider defaults)
   * @returns {string} The unique ID of the created toast
   * 
   * @example
   * const toastId = toast.error('Failed to save changes');
   * 
   * @example
   * toast.error('Network error', {
   *   duration: 0,  // Persistent until manually dismissed
   *   action: {
   *     label: 'Retry',
   *     onClick: async () => {
   *       await retryOperation();
   *       toast.success('Retried successfully');
   *     }
   *   }
   * });
   */
  const error = (message: string, options?: ToastOptions): string => {
    return context.addToast({
      type: 'error',
      message,
      ...options,
    });
  };

  /**
   * Display a warning toast notification.
   * 
   * Warning toasts are high-priority like errors and use aria-live="assertive"
   * for screen readers, but indicate a less severe issue.
   * 
   * @param {string} message - The warning message to display
   * @param {ToastOptions} [options] - Optional configuration for this specific toast
   *                                   (overrides provider defaults)
   * @returns {string} The unique ID of the created toast
   * 
   * @example
   * toast.warning('This action cannot be undone');
   * 
   * @example
   * toast.warning('Storage is running low', {
   *   duration: 5000,
   *   position: 'top-center'
   * });
   */
  const warning = (message: string, options?: ToastOptions): string => {
    return context.addToast({
      type: 'warning',
      message,
      ...options,
    });
  };

  /**
   * Display an info toast notification.
   * 
   * Info toasts are low-priority and allow current screen reader speech to finish
   * before announcement (aria-live="polite").
   * 
   * @param {string} message - The informational message to display
   * @param {ToastOptions} [options] - Optional configuration for this specific toast
   *                                   (overrides provider defaults)
   * @returns {string} The unique ID of the created toast
   * 
   * @example
   * toast.info('New updates available');
   * 
   * @example
   * toast.info('Syncing data...', {
   *   duration: 0,  // Persistent while operation continues
   *   dismissible: false  // Cannot manually close
   * });
   */
  const info = (message: string, options?: ToastOptions): string => {
    return context.addToast({
      type: 'info',
      message,
      ...options,
    });
  };

  /**
   * Display a toast with fully custom configuration.
   * 
   * Use this method for advanced use cases where you need full control over
   * all toast properties. For standard toasts, prefer using success(), error(),
   * warning(), or info() for better code readability.
   * 
   * User-provided options override provider-level defaults for this specific toast.
   * 
   * @param {Omit<Toast, 'id'>} toastObject - Complete toast configuration
   *                                          (ID is auto-generated)
   * @returns {string} The unique ID of the created toast
   * 
   * @example
   * const toastId = toast.toast({
   *   type: 'success',
   *   message: 'Custom configuration',
   *   duration: 2000,
   *   position: 'bottom-left',
   *   dismissible: true
   * });
   * 
   * @example
   * // With complex action
   * toast.toast({
   *   type: 'info',
   *   message: 'Download complete',
   *   duration: 0,
   *   action: {
   *     label: 'Open File',
   *     onClick: async () => {
   *       await openFile();
   *       toast.success('File opened');
   *     }
   *   }
   * });
   */
  const toast = (toastObject: Omit<Toast, 'id'>): string => {
    return context.addToast(toastObject);
  };

  return {
    success,
    error,
    warning,
    info,
    toast,
  };
}
