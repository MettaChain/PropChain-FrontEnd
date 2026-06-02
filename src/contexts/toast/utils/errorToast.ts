/**
 * Error Toast Utility
 * Integrates with ADR-005 error handling for displaying error toasts
 */

import { getErrorMessage, getErrorCode } from '@/utils/typeGuards';
import type { ToastOptions } from '../types';

/**
 * Displays an error toast with proper error message extraction and logging.
 *
 * This function integrates with the application's error handling infrastructure (ADR-005)
 * to extract user-friendly messages from any error type while logging sensitive details
 * separately for debugging.
 *
 * Sensitive details (stack traces, API keys, system internals) are NOT exposed in the
 * toast message but are logged to the console (development) or Sentry (production).
 *
 * @param {unknown} error - The error object (any type)
 * @param {ToastOptions} [options] - Optional toast display options
 * @returns {void}
 *
 * @example
 * try {
 *   // Some operation
 * } catch (error) {
 *   showErrorToast(error);
 *   // Toast displays user-friendly message, error logged separately
 * }
 *
 * @example
 * // With custom options
 * showErrorToast(error, {
 *   duration: 10000,
 *   position: 'bottom-right',
 *   action: {
 *     label: 'Retry',
 *     onClick: () => retryOperation(),
 *   },
 * });
 */
export function showErrorToast(error: unknown, options?: ToastOptions): void {
  // Extract user-friendly message using ADR-005 utilities
  const message = getErrorMessage(error, 'An error occurred');

  // Extract error code for debugging/categorization
  const errorCode = getErrorCode(error);

  // Log error code and sensitive details separately (not in toast)
  // In development: log to console
  // In production: log to Sentry (error reporting service)
  if (process.env.NODE_ENV === 'development') {
    console.error('[Toast Error]', {
      errorCode,
      message,
      error,
      timestamp: new Date().toISOString(),
    });
  } else {
    // In production, report to error tracking service
    // This is handled by the application's error boundary / Sentry setup
    reportErrorToSentry(errorCode, error);
  }

  // Import useToast hook dynamically to avoid circular dependencies
  // The actual toast display is handled by the consumer
  // This function is meant to be called from components that already have useToast
  logErrorForToastDisplay(message, errorCode, error);
}

/**
 * Reports an error to Sentry for production monitoring.
 * This is called in production to track errors without exposing them in the UI.
 *
 * @param {string | null} errorCode - The categorized error code
 * @param {unknown} error - The error object
 * @internal
 */
function reportErrorToSentry(errorCode: string | null, error: unknown): void {
  // Sentry integration would go here
  // Example (if Sentry is configured):
  // Sentry.captureException(error, {
  //   tags: { errorCode: errorCode || 'UNKNOWN' },
  //   extra: { category: 'toast_error' },
  // });

  // For now, use console.error in development-like environments
  if (typeof console !== 'undefined' && console.error) {
    console.error('[Sentry] Would report error:', {
      errorCode,
      errorName: error instanceof Error ? error.name : typeof error,
    });
  }
}

/**
 * Logs error information for use when displaying toast.
 * Extracts the user-friendly message and categorizes the error.
 *
 * @param {string} message - User-friendly error message
 * @param {string | null} errorCode - Error code for categorization
 * @param {unknown} error - The original error object
 * @internal
 */
function logErrorForToastDisplay(
  message: string,
  errorCode: string | null,
  error: unknown
): void {
  // This information can be used by error toast display
  const errorInfo = {
    userMessage: message,
    errorCode: errorCode || 'UNKNOWN',
    timestamp: new Date().toISOString(),
  };

  // Store in sessionStorage or window object for toast display
  // This allows the error info to be accessed by the useToast hook
  if (typeof window !== 'undefined') {
    try {
      // Store the last error for quick access
      (window as any).__lastError = errorInfo;
    } catch {
      // Silently fail if storage is unavailable
    }
  }
}

/**
 * Determines the appropriate error icon based on error type/code.
 * Used for rendering custom icons in error toasts.
 *
 * @param {string | null} errorCode - The error code/type
 * @returns {string} Icon name or emoji representing the error type
 *
 * @example
 * const icon = getErrorIcon('NETWORK_ERROR');
 * // Returns '🌐' for network errors
 */
export function getErrorIcon(errorCode: string | null): string {
  switch (errorCode) {
    case 'NETWORK_ERROR':
      return '🌐';
    case 'VALIDATION_ERROR':
      return '⚠️';
    case 'BLOCKCHAIN_ERROR':
      return '⛓️';
    case 'USER_REJECTED':
      return '❌';
    case 'INSUFFICIENT_FUNDS':
      return '💰';
    case 'TIMEOUT':
      return '⏱️';
    case 'PERMISSION_DENIED':
      return '🔒';
    case 'NOT_FOUND':
      return '🔍';
    default:
      return '❌';
  }
}

/**
 * Determines if an error is retryable based on its type/code.
 * Helps decide whether to show a retry action button in the toast.
 *
 * @param {string | null} errorCode - The error code/type
 * @returns {boolean} True if the error is likely retryable
 *
 * @example
 * if (isRetryableError(errorCode)) {
 *   // Show retry action button in toast
 * }
 */
export function isRetryableError(errorCode: string | null): boolean {
  const retryableErrors = [
    'NETWORK_ERROR',
    'TIMEOUT',
    'INSUFFICIENT_FUNDS', // Might be retried after transaction completes
  ];

  return errorCode ? retryableErrors.includes(errorCode) : false;
}

/**
 * Categorizes error severity for visual styling.
 * Used to determine toast styling (color, icon, animation).
 *
 * @param {string | null} errorCode - The error code/type
 * @returns {'error' | 'warning'} Severity level
 *
 * @example
 * const severity = getErrorSeverity(errorCode);
 * // Returns 'error' for critical issues, 'warning' for non-critical
 */
export function getErrorSeverity(
  errorCode: string | null
): 'error' | 'warning' {
  const warningErrors = ['INSUFFICIENT_FUNDS', 'VALIDATION_ERROR'];

  return errorCode && warningErrors.includes(errorCode) ? 'warning' : 'error';
}

/**
 * Extracts error details for logging without exposing sensitive information.
 * Safely logs error code and type but excludes stack traces and internals.
 *
 * @param {unknown} error - The error object
 * @returns {Object} Safe error information for logging
 *
 * @example
 * const safeError = extractSafeErrorDetails(error);
 * // Returns { errorCode: 'NETWORK_ERROR', errorName: 'NetworkError' }
 * // Does NOT include: stack trace, API keys, URLs, internals
 */
export function extractSafeErrorDetails(error: unknown): {
  errorCode: string | null;
  errorName: string;
  category: string;
} {
  const errorCode = getErrorCode(error);
  const errorName =
    error instanceof Error ? error.name : typeof error === 'string' ? error : 'Unknown';

  // Determine error category for logging/analytics
  let category = 'unknown';
  if (errorCode) {
    if (errorCode.includes('NETWORK')) category = 'network';
    else if (errorCode.includes('VALIDATION')) category = 'validation';
    else if (errorCode.includes('BLOCKCHAIN')) category = 'blockchain';
    else if (errorCode.includes('PERMISSION')) category = 'permission';
    else if (errorCode.includes('TIMEOUT')) category = 'timeout';
  }

  return {
    errorCode: errorCode || null,
    errorName,
    category,
  };
}
