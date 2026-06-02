# Global Toast Notification System - Implementation Reference

This document provides detailed technical specifications, type definitions, and implementation guidelines for developers building the toast system.

---

## Complete Type Definitions

### Toast Variant and Position Types

```typescript
// src/contexts/toast/types/index.ts

/**
 * Toast notification severity/style variant
 * @typedef {string} ToastVariant
 */
export type ToastVariant = 'success' | 'error' | 'warning' | 'info';

/**
 * Toast display position on screen
 * @typedef {string} ToastPosition
 */
export type ToastPosition = 
  | 'top-left'
  | 'top-center'
  | 'top-right'
  | 'bottom-left'
  | 'bottom-center'
  | 'bottom-right';

/**
 * Action button configuration for toasts
 */
export interface ToastAction {
  /** Button label text */
  label: string;
  
  /** Callback function on button click */
  onClick: (event?: React.MouseEvent<HTMLButtonElement>) => void | Promise<void>;
  
  /** Optional icon to display with label */
  icon?: React.ReactNode;
}

/**
 * Core toast object structure
 */
export interface Toast {
  /** Unique identifier for toast */
  id: string;
  
  /** Toast variant/severity */
  type: ToastVariant;
  
  /** Display message */
  message: string;
  
  /** Display duration in milliseconds (0 = persistent) */
  duration?: number;
  
  /** Position on screen */
  position?: ToastPosition;
  
  /** Optional action button */
  action?: ToastAction;
  
  /** Callback when toast is dismissed */
  onClose?: () => void;
  
  /** Show close button (default: true) */
  dismissible?: boolean;
}

/**
 * Options for creating a toast (without ID)
 */
export interface ToastOptions {
  duration?: number;
  position?: ToastPosition;
  action?: ToastAction;
  onClose?: () => void;
  dismissible?: boolean;
}

/**
 * Provider configuration
 */
export interface ToastProviderConfig {
  /** Default auto-dismiss duration (ms) */
  defaultDuration: number;
  
  /** Default position when not specified */
  defaultPosition: ToastPosition;
  
  /** Maximum concurrent toasts */
  maxToasts: number;
}

/**
 * Context value type
 */
export interface ToastContextType {
  /** Current toast queue */
  queue: Toast[];
  
  /** Add toast to queue */
  addToast: (toast: Omit<Toast, 'id'>) => string;
  
  /** Remove toast by ID */
  removeToast: (id: string) => void;
  
  /** Clear all toasts */
  clearToasts: () => void;
  
  /** Provider configuration */
  config: ToastProviderConfig;
}

/**
 * Toast context (would be created with createContext)
 */
export const ToastContext = React.createContext<ToastContextType | undefined>(undefined);

/**
 * Provider component props
 */
export interface ToastProviderProps {
  children: React.ReactNode;
  defaultDuration?: number;
  defaultPosition?: ToastPosition;
  maxToasts?: number;
}

/**
 * useToast hook return type
 */
export interface UseToastReturn {
  /**
   * Display success notification
   * @param message - Toast message
   * @param options - Optional configuration
   * @returns Toast ID
   */
  success: (message: string, options?: ToastOptions) => string;
  
  /**
   * Display error notification
   * @param message - Toast message
   * @param options - Optional configuration
   * @returns Toast ID
   */
  error: (message: string, options?: ToastOptions) => string;
  
  /**
   * Display warning notification
   * @param message - Toast message
   * @param options - Optional configuration
   * @returns Toast ID
   */
  warning: (message: string, options?: ToastOptions) => string;
  
  /**
   * Display info notification
   * @param message - Toast message
   * @param options - Optional configuration
   * @returns Toast ID
   */
  info: (message: string, options?: ToastOptions) => string;
  
  /**
   * Display toast with full configuration
   * @param toast - Toast object (without ID)
   * @returns Toast ID
   */
  toast: (toast: Omit<Toast, 'id'>) => string;
}
```

---

## Component Implementation Skeleton

### ToastProvider Component

```typescript
// src/contexts/toast/components/ToastProvider.tsx

'use client';

import React, { useCallback, useMemo, useState } from 'react';
import { Toaster } from 'sonner';
import { nanoid } from 'nanoid';
import type { Toast, ToastContextType, ToastProviderProps, ToastProviderConfig } from '../types';
import { ToastContext } from '../context';
import { DEFAULT_DURATION, DEFAULT_POSITION, MAX_TOASTS } from '../constants';

const DEFAULT_CONFIG: ToastProviderConfig = {
  defaultDuration: DEFAULT_DURATION,
  defaultPosition: DEFAULT_POSITION,
  maxToasts: MAX_TOASTS,
};

/**
 * ToastProvider wraps the application and manages centralized toast state
 * 
 * @component
 * @example
 * ```tsx
 * export default function RootLayout({ children }) {
 *   return (
 *     <html>
 *       <body>
 *         <ToastProvider>
 *           {children}
 *         </ToastProvider>
 *       </body>
 *     </html>
 *   );
 * }
 * ```
 */
export function ToastProvider({
  children,
  defaultDuration = DEFAULT_DURATION,
  defaultPosition = DEFAULT_POSITION,
  maxToasts = MAX_TOASTS,
}: ToastProviderProps) {
  const [queue, setQueue] = useState<Toast[]>([]);

  // Configuration for this provider instance
  const config: ToastProviderConfig = useMemo(
    () => ({
      defaultDuration,
      defaultPosition,
      maxToasts,
    }),
    [defaultDuration, defaultPosition, maxToasts]
  );

  /**
   * Add toast to queue, enforcing max limit
   * If queue at max capacity, remove oldest toast first
   */
  const addToast = useCallback((toast: Omit<Toast, 'id'>) => {
    const id = nanoid(6); // Compact, collision-free IDs
    const fullToast: Toast = {
      ...toast,
      id,
      duration: toast.duration ?? config.defaultDuration,
      position: toast.position ?? config.defaultPosition,
    };

    setQueue((prev) => {
      let newQueue = [...prev, fullToast];
      
      // Enforce max queue size
      if (newQueue.length > config.maxToasts) {
        newQueue = newQueue.slice(-config.maxToasts);
      }
      
      return newQueue;
    });

    return id;
  }, [config]);

  /**
   * Remove toast by ID
   */
  const removeToast = useCallback((id: string) => {
    setQueue((prev) => prev.filter((t) => t.id !== id));
  }, []);

  /**
   * Clear all toasts
   */
  const clearToasts = useCallback(() => {
    setQueue([]);
  }, []);

  /**
   * Memoize context value to prevent unnecessary re-renders
   */
  const value = useMemo<ToastContextType>(
    () => ({
      queue,
      addToast,
      removeToast,
      clearToasts,
      config,
    }),
    [queue, addToast, removeToast, clearToasts, config]
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      {/* Sonner Toaster renders toasts from internal state */}
      {/* We coordinate queue management through context */}
      <Toaster
        position={defaultPosition === 'bottom-center' ? 'bottom-center' : 'top-right'}
        theme="light"
        richColors
        expand
        closeButton
        duration={defaultDuration}
      />
    </ToastContext.Provider>
  );
}
```

### useToast Hook

```typescript
// src/contexts/toast/hooks/useToast.ts

'use client';

import { useContext } from 'react';
import { toast as sonnerToast } from 'sonner';
import type { ToastContextType, UseToastReturn, ToastOptions } from '../types';
import { ToastContext } from '../context';

const PROVIDER_ERROR_MESSAGE = 
  'useToast must be called within a ToastProvider. ' +
  'Ensure your component is wrapped with <ToastProvider> in a parent layout.';

/**
 * useToast hook - provides methods to display notifications
 * 
 * @throws {Error} If called outside ToastProvider
 * @returns {UseToastReturn} Toast display methods
 * 
 * @example
 * ```tsx
 * const toast = useToast();
 * toast.success('Operation completed!');
 * toast.error('Something went wrong', { duration: 3000 });
 * ```
 */
export function useToast(): UseToastReturn {
  const context = useContext(ToastContext);

  if (!context) {
    throw new Error(PROVIDER_ERROR_MESSAGE);
  }

  const createToastMethod = (type: 'success' | 'error' | 'warning' | 'info') => {
    return (message: string, options?: ToastOptions): string => {
      const toastId = context.addToast({
        type,
        message,
        ...options,
      });

      // Trigger actual rendering through Sonner
      const sonnerOptions = {
        duration: options?.duration ?? context.config.defaultDuration,
        position: options?.position ?? context.config.defaultPosition,
      };

      switch (type) {
        case 'success':
          sonnerToast.success(message, sonnerOptions);
          break;
        case 'error':
          sonnerToast.error(message, sonnerOptions);
          break;
        case 'warning':
          sonnerToast.loading(message, sonnerOptions); // or custom icon
          break;
        case 'info':
          sonnerToast(message, sonnerOptions);
          break;
      }

      return toastId;
    };
  };

  return {
    success: createToastMethod('success'),
    error: createToastMethod('error'),
    warning: createToastMethod('warning'),
    info: createToastMethod('info'),
    toast: (toast) => {
      const toastId = context.addToast(toast);
      // Implementation depends on integration with Sonner
      return toastId;
    },
  };
}
```

---

## Error Handling Integration

### Error Toast Utility

```typescript
// src/contexts/toast/utils/errorToast.ts

import { getErrorMessage, getErrorCode } from '@/utils/typeGuards';
import type { AppError } from '@/types/errors';
import { reportErrorToSentry } from '@/utils/sentry'; // or wherever Sentry is configured

/**
 * Display error toast with integrated error handling
 * 
 * Extracts user-friendly message from error object and displays as toast.
 * Logs sensitive details separately (console in dev, Sentry in prod).
 * 
 * @param error - Error object of any type
 * @param options - Optional toast configuration
 * @returns Toast ID
 * 
 * @example
 * ```tsx
 * try {
 *   await submitForm(data);
 * } catch (error) {
 *   showErrorToast(error);
 * }
 * ```
 */
export function showErrorToast(
  error: unknown,
  options?: ToastOptions
): string {
  // Extract user-friendly message
  const message = getErrorMessage(error, 'An error occurred');
  
  // Extract error code for debugging
  const errorCode = getErrorCode(error);

  // Log sensitive details separately
  if (process.env.NODE_ENV === 'development') {
    console.error('[Toast Error]', {
      message,
      errorCode,
      error,
      timestamp: new Date().toISOString(),
    });
  } else {
    // In production, log to Sentry for monitoring
    reportErrorToSentry(error as Error, {
      tags: {
        source: 'toast_error',
        errorCode: String(errorCode),
      },
    });
  }

  // Display error toast using hook
  // NOTE: This assumes showErrorToast is called from a client component
  // If called from server, need different approach
  const toast = useToast();
  return toast.error(message, {
    duration: 5000, // Errors stay longer
    ...options,
  });
}

// Alternative: Direct Sonner integration if not using context
export function showErrorToastDirect(
  error: unknown,
  options?: ToastOptions
): string {
  const message = getErrorMessage(error, 'An error occurred');
  const errorCode = getErrorCode(error);

  if (process.env.NODE_ENV === 'development') {
    console.error('[Toast Error]', { message, errorCode, error });
  } else {
    reportErrorToSentry(error as Error);
  }

  // Use Sonner directly
  return sonnerToast.error(message, {
    duration: 5000,
    ...options,
  });
}
```

---

## Queue Management Utilities

### Advanced Queue Operations

```typescript
// src/contexts/toast/utils/queueManager.ts

import type { Toast, ToastVariant } from '../types';

/**
 * Filter toasts by variant
 */
export function filterToastsByVariant(
  queue: Toast[],
  variant: ToastVariant
): Toast[] {
  return queue.filter((t) => t.type === variant);
}

/**
 * Remove all toasts of specific variant
 */
export function removeToastsByVariant(
  queue: Toast[],
  variant: ToastVariant
): Toast[] {
  return queue.filter((t) => t.type !== variant);
}

/**
 * Check if queue is at capacity
 */
export function isQueueAtCapacity(
  queue: Toast[],
  maxToasts: number
): boolean {
  return queue.length >= maxToasts;
}

/**
 * Get toasts expiring soon (within 1 second)
 */
export function getExpiringToasts(
  queue: Toast[],
  now: number = Date.now()
): Toast[] {
  // Requires tracking creation time on Toast type
  return queue.filter((t) => {
    if (!t.duration || t.duration === 0) return false;
    const createdAt = (t as any)._createdAt || now;
    const expiresAt = createdAt + t.duration;
    return expiresAt - now < 1000; // Expiring within 1 second
  });
}
```

---

## Constants and Configuration

### Default Values

```typescript
// src/contexts/toast/constants.ts

export const DEFAULT_DURATION = 5000; // milliseconds

export const DEFAULT_POSITION = 'top-right' as const;

export const MAX_TOASTS = 10;

export const TOAST_VARIANTS = ['success', 'error', 'warning', 'info'] as const;

export const TOAST_POSITIONS = [
  'top-left',
  'top-center',
  'top-right',
  'bottom-left',
  'bottom-center',
  'bottom-right',
] as const;

export const VARIANT_CONFIG = {
  success: {
    icon: '✓',
    color: 'bg-green-500',
    ariaLive: 'polite',
  },
  error: {
    icon: '✕',
    color: 'bg-red-500',
    ariaLive: 'assertive',
  },
  warning: {
    icon: '⚠',
    color: 'bg-yellow-500',
    ariaLive: 'assertive',
  },
  info: {
    icon: 'ℹ',
    color: 'bg-blue-500',
    ariaLive: 'polite',
  },
} as const;
```

---

## Accessibility Implementation Details

### ARIA Attributes

```typescript
// src/contexts/toast/components/ToastA11y.tsx

/**
 * Accessibility wrapper for toast
 */
export function ToastA11yWrapper({
  toast,
  children,
}: {
  toast: Toast;
  children: React.ReactNode;
}) {
  const isUrgent = toast.type === 'error' || toast.type === 'warning';
  
  return (
    <div
      role="alert"
      aria-live={isUrgent ? 'assertive' : 'polite'}
      aria-atomic="true"
      className="toast-container"
    >
      {children}
    </div>
  );
}

/**
 * Action button with accessibility
 */
export function ToastActionButton({
  action,
  onDismiss,
}: {
  action: Toast['action'];
  onDismiss: () => void;
}) {
  if (!action) return null;

  const handleClick = async (e: React.MouseEvent<HTMLButtonElement>) => {
    try {
      await action.onClick(e);
    } catch (error) {
      console.error('Toast action error:', error);
    }
    onDismiss();
  };

  return (
    <button
      onClick={handleClick}
      aria-label={`${action.label} (toast action)`}
      className="toast-action-button"
      tabIndex={0}
    >
      {action.icon}
      {action.label}
    </button>
  );
}

/**
 * Close button with accessibility
 */
export function ToastCloseButton({ onClose }: { onClose: () => void }) {
  return (
    <button
      onClick={onClose}
      aria-label="Close notification"
      className="toast-close-button"
      tabIndex={0}
    >
      ×
    </button>
  );
}
```

### Keyboard Handler

```typescript
// src/contexts/toast/utils/keyboardHandler.ts

/**
 * Setup keyboard handlers for toast
 */
export function setupToastKeyboardHandlers(
  toastElement: HTMLElement,
  onDismiss: () => void,
  onActionClick?: () => void
): () => void {
  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      onDismiss();
    } else if (e.key === 'Enter' && e.ctrlKey && onActionClick) {
      e.preventDefault();
      onActionClick();
    }
  };

  toastElement.addEventListener('keydown', handleKeyDown);

  // Return cleanup function
  return () => {
    toastElement.removeEventListener('keydown', handleKeyDown);
  };
}
```

---

## Testing Utilities

### Mock Provider Implementation

```typescript
// src/contexts/toast/__mocks__/MockToastProvider.tsx

'use client';

import React, { useCallback, useMemo, useState } from 'react';
import { nanoid } from 'nanoid';
import type { Toast, ToastContextType, ToastProviderProps } from '../types';
import { ToastContext } from '../context';
import { DEFAULT_DURATION, DEFAULT_POSITION, MAX_TOASTS } from '../constants';

interface MockToastContextType extends ToastContextType {
  /** Exposed for test assertions */
  __toasts: Toast[];
  /** Reset toasts for test cleanup */
  __reset: () => void;
}

export function MockToastProvider({
  children,
  defaultDuration = DEFAULT_DURATION,
  defaultPosition = DEFAULT_POSITION,
  maxToasts = MAX_TOASTS,
}: ToastProviderProps) {
  const [queue, setQueue] = useState<Toast[]>([]);

  const addToast = useCallback((toast: Omit<Toast, 'id'>) => {
    const id = nanoid(6);
    const fullToast: Toast = {
      ...toast,
      id,
      duration: toast.duration ?? defaultDuration,
      position: toast.position ?? defaultPosition,
    };

    setQueue((prev) => {
      let newQueue = [...prev, fullToast];
      if (newQueue.length > maxToasts) {
        newQueue = newQueue.slice(-maxToasts);
      }
      return newQueue;
    });

    return id;
  }, [defaultDuration, defaultPosition, maxToasts]);

  const removeToast = useCallback((id: string) => {
    setQueue((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const clearToasts = useCallback(() => {
    setQueue([]);
  }, []);

  const config = useMemo(
    () => ({
      defaultDuration,
      defaultPosition,
      maxToasts,
    }),
    [defaultDuration, defaultPosition, maxToasts]
  );

  const value = useMemo<MockToastContextType>(
    () => ({
      queue,
      addToast,
      removeToast,
      clearToasts,
      config,
      __toasts: queue,
      __reset: clearToasts,
    }),
    [queue, addToast, removeToast, clearToasts, config]
  );

  return (
    <ToastContext.Provider value={value as ToastContextType}>
      {children}
    </ToastContext.Provider>
  );
}

/**
 * Test helper to extract toasts from mock provider
 */
export function getToastsFromMock(context: ToastContextType): Toast[] {
  return (context as MockToastContextType).__toasts;
}

/**
 * Test helper to reset mock provider
 */
export function resetToastMock(context: ToastContextType): void {
  (context as MockToastContextType).__reset();
}
```

### Property Test Generators

```typescript
// src/contexts/toast/__tests__/generators.ts

import fc from 'fast-check';
import type { Toast, ToastVariant, ToastPosition } from '../types';

// Generate valid toast variants
export const variantArb = fc.constantFrom<ToastVariant>(
  'success',
  'error',
  'warning',
  'info'
);

// Generate valid positions
export const positionArb = fc.constantFrom<ToastPosition>(
  'top-left',
  'top-center',
  'top-right',
  'bottom-left',
  'bottom-center',
  'bottom-right'
);

// Generate valid durations (0 or 100-30000ms)
export const durationArb = fc.oneof(
  fc.constant(0),
  fc.integer({ min: 100, max: 30000 })
);

// Generate valid toast messages
export const messageArb = fc.string({
  minLength: 1,
  maxLength: 500,
});

// Generate complete toast objects
export const toastArb = fc.record({
  type: variantArb,
  message: messageArb,
  duration: durationArb,
  position: positionArb,
});
```

---

## Performance Optimization Details

### Memoization Strategy

```typescript
// src/contexts/toast/components/ToastProvider.tsx

// ✅ GOOD: Context value memoized - prevents re-renders of all consumers
const value = useMemo<ToastContextType>(
  () => ({
    queue,
    addToast,
    removeToast,
    clearToasts,
    config,
  }),
  [queue, addToast, removeToast, clearToasts, config]
);

// ✅ GOOD: Callbacks memoized - dependencies explicit
const addToast = useCallback((toast: Omit<Toast, 'id'>) => {
  // ...
}, [config]);

// ❌ BAD: Would cause re-renders on every state change
// const value: ToastContextType = {
//   queue,
//   addToast,
//   removeToast,
//   clearToasts,
//   config,
// };
```

### Bundle Size Impact

Expected bundle sizes (gzipped):
- Toast provider + hook: ~3KB
- Type definitions: ~1KB
- Error integration utilities: ~0.5KB
- **Total: ~4.5KB** (Sonner already included)

### Memory Usage

- Per-toast overhead: ~200 bytes
- Max 10 toasts: ~2KB
- Context value: ~1KB
- Listeners/timers: Cleaned up on removal

---

## Migration Path for Existing Error Handling

If integrating with existing error toasts:

```typescript
// src/contexts/toast/utils/errorToast.ts

// Old approach (would replace this):
// const dispatch = useDispatch();
// dispatch(showErrorNotification(error));

// New approach:
// const toast = useToast();
// showErrorToast(error); // Uses toast internally

// For backwards compatibility during migration:
export function legacyShowErrorNotification(
  error: unknown,
  legacyOptions?: any
) {
  showErrorToast(error, {
    duration: legacyOptions?.duration ?? 5000,
    position: legacyOptions?.position ?? 'top-right',
  });
}
```

---

## Security Considerations

### Preventing XSS

Always sanitize user input in toast messages:

```typescript
// ❌ UNSAFE: Don't do this
toast.error(`<script>alert('xss')</script>`); // String interpolation

// ✅ SAFE: Use plain text messages
toast.error('An error occurred');

// ✅ SAFE: If using variables, they're automatically escaped by React
const errorMsg = getUserInput(); // Could contain <script> tags
toast.error(`Error: ${errorMsg}`); // React escapes this
```

### Sensitive Data

Never include in toast messages:
- API keys, tokens, secrets
- User PII (beyond what user already entered)
- Stack traces, internal error codes
- File paths, system details

Log these separately:

```typescript
showErrorToast(error); // Shows friendly message only

// Sensitive details logged separately:
console.error(error); // Dev only
reportErrorToSentry(error); // Production only
```

---

## Deployment Checklist

- [ ] Provider integrated in root layout
- [ ] All error handlers updated to use showErrorToast
- [ ] Tests written and passing (unit + property + a11y)
- [ ] Performance budget verified (< 5KB gzipped)
- [ ] Accessibility audit completed
- [ ] Documentation reviewed
- [ ] E2E tests include toast interactions
- [ ] Error boundary handles toast errors gracefully
- [ ] Mobile responsive testing completed
- [ ] SSR hydration verified (no mismatches)

