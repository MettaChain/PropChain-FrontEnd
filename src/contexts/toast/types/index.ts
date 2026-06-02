/**
 * Toast Type Definitions
 * Core type definitions for the Global Toast Notification System
 */

/**
 * Represents the visual variant/severity of a toast notification.
 * @typedef {'success' | 'error' | 'warning' | 'info'} ToastVariant
 */
export type ToastVariant = 'success' | 'error' | 'warning' | 'info';

/**
 * Represents the position where a toast notification should be displayed.
 * Supports six positions: three at the top and three at the bottom of the viewport.
 * @typedef {'top-left' | 'top-center' | 'top-right' | 'bottom-left' | 'bottom-center' | 'bottom-right'} ToastPosition
 */
export type ToastPosition =
  | 'top-left'
  | 'top-center'
  | 'top-right'
  | 'bottom-left'
  | 'bottom-center'
  | 'bottom-right';

/**
 * Represents an action button that can be attached to a toast.
 * The action button allows users to respond to the notification without navigating away.
 *
 * @interface ToastAction
 * @property {string} label - The text displayed on the action button
 * @property {() => void | Promise<void>} onClick - Callback function when the button is clicked
 * @property {React.ReactNode} [icon] - Optional icon element to display on the button
 */
export interface ToastAction {
  label: string;
  onClick: () => void | Promise<void>;
  icon?: React.ReactNode;
}

/**
 * Configuration options for displaying a toast notification.
 * These options can be provided when calling toast methods (success, error, etc.)
 * and will override provider-level defaults for that specific toast.
 *
 * @interface ToastOptions
 * @property {number} [duration] - Auto-dismiss duration in milliseconds. Set to 0 for persistent toasts. Default: 5000ms
 * @property {ToastPosition} [position] - Position where the toast should be displayed. Default: varies by device
 * @property {ToastAction} [action] - Optional action button configuration
 * @property {() => void} [onClose] - Optional callback when the toast is dismissed
 * @property {boolean} [dismissible] - Whether to show a close button. Default: true
 */
export interface ToastOptions {
  duration?: number;
  position?: ToastPosition;
  action?: ToastAction;
  onClose?: () => void;
  dismissible?: boolean;
}

/**
 * Represents a single toast notification.
 * Contains all information needed to render and manage a toast.
 *
 * @interface Toast
 * @property {string} id - Unique identifier for the toast (auto-generated)
 * @property {ToastVariant} type - The visual variant of the toast
 * @property {string} message - The notification message to display
 * @property {number} [duration] - Auto-dismiss duration in milliseconds. 0 means persistent
 * @property {ToastPosition} [position] - Position where the toast is displayed
 * @property {ToastAction} [action] - Optional action button
 * @property {() => void} [onClose] - Optional callback on dismissal
 * @property {boolean} [dismissible] - Whether the close button is visible
 */
export interface Toast {
  id: string;
  type: ToastVariant;
  message: string;
  duration?: number;
  position?: ToastPosition;
  action?: ToastAction;
  onClose?: () => void;
  dismissible?: boolean;
}

/**
 * Configuration for the ToastProvider component.
 * These are the default settings that apply to all toasts unless overridden.
 *
 * @interface ToastProviderConfig
 * @property {number} defaultDuration - Default auto-dismiss duration in milliseconds for all toasts
 * @property {ToastPosition} defaultPosition - Default position for all toasts
 * @property {number} maxToasts - Maximum number of toasts to display simultaneously
 */
export interface ToastProviderConfig {
  defaultDuration: number;
  defaultPosition: ToastPosition;
  maxToasts: number;
}

/**
 * The context type for the Toast notification system.
 * Provides methods to manage the toast queue and access configuration.
 *
 * @interface ToastContextType
 * @property {Toast[]} queue - Current array of active toasts
 * @property {(toast: Omit<Toast, 'id'>) => string} addToast - Add a new toast to the queue. Returns the toast ID.
 * @property {(id: string) => void} removeToast - Remove a toast by ID from the queue
 * @property {() => void} clearToasts - Remove all toasts from the queue
 * @property {ToastProviderConfig} config - Current provider configuration
 */
export interface ToastContextType {
  queue: Toast[];
  addToast: (toast: Omit<Toast, 'id'>) => string;
  removeToast: (id: string) => void;
  clearToasts: () => void;
  config: ToastProviderConfig;
}

/**
 * Props for the ToastProvider component.
 *
 * @interface ToastProviderProps
 * @property {React.ReactNode} children - Child components to render within the provider
 * @property {number} [defaultDuration] - Default auto-dismiss duration in milliseconds. Default: 5000ms
 * @property {ToastPosition} [defaultPosition] - Default position for toasts. Default: 'top-right' (desktop) or 'bottom-center' (mobile)
 * @property {number} [maxToasts] - Maximum number of toasts to display simultaneously. Default: 10
 */
export interface ToastProviderProps {
  children: React.ReactNode;
  defaultDuration?: number;
  defaultPosition?: ToastPosition;
  maxToasts?: number;
}

/**
 * Return type for the useToast hook.
 * Provides convenient methods to trigger toast notifications of different types.
 *
 * @interface UseToastReturn
 * @property {(message: string, options?: ToastOptions) => string} success - Display a success toast. Returns toast ID.
 * @property {(message: string, options?: ToastOptions) => string} error - Display an error toast. Returns toast ID.
 * @property {(message: string, options?: ToastOptions) => string} warning - Display a warning toast. Returns toast ID.
 * @property {(message: string, options?: ToastOptions) => string} info - Display an info toast. Returns toast ID.
 * @property {(toast: Omit<Toast, 'id'>) => string} toast - Display a toast with custom configuration. Returns toast ID.
 *
 * @example
 * const toast = useToast();
 * toast.success('Operation completed!');
 * toast.error('An error occurred');
 * const toastId = toast.warning('This is a warning', { duration: 3000 });
 */
export interface UseToastReturn {
  success: (message: string, options?: ToastOptions) => string;
  error: (message: string, options?: ToastOptions) => string;
  warning: (message: string, options?: ToastOptions) => string;
  info: (message: string, options?: ToastOptions) => string;
  toast: (toast: Omit<Toast, 'id'>) => string;
}
