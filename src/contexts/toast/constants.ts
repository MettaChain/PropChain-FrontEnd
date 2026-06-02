/**
 * Toast System Constants
 * Default values and constant definitions for the Global Toast Notification System
 */

import type { ToastVariant, ToastPosition } from './types';

/**
 * Default duration for auto-dismissing toasts (in milliseconds).
 * Toasts will disappear automatically after 5 seconds unless a custom duration is specified.
 * @constant
 */
export const DEFAULT_DURATION = 5000;

/**
 * Default maximum number of toasts that can be displayed simultaneously.
 * When this limit is reached, the oldest toast is removed to make room for new ones.
 * @constant
 */
export const DEFAULT_MAX_TOASTS = 10;

/**
 * Default position for toasts on desktop viewports.
 * Used when no specific position is configured in the ToastProvider or toast options.
 * @constant
 */
export const DEFAULT_POSITION_DESKTOP: ToastPosition = 'top-right';

/**
 * Default position for toasts on mobile viewports (< 768px).
 * Mobile devices default to bottom-center for better accessibility and touch targets.
 * @constant
 */
export const DEFAULT_POSITION_MOBILE: ToastPosition = 'bottom-center';

/**
 * Mobile viewport width breakpoint (in pixels).
 * Viewports narrower than this are considered "mobile" for position and sizing decisions.
 * @constant
 */
export const MOBILE_BREAKPOINT = 768;

/**
 * All supported toast variants in order.
 * These represent the four severity/type levels for notifications.
 * @constant
 */
export const TOAST_VARIANTS: ToastVariant[] = [
  'success',
  'error',
  'warning',
  'info',
];

/**
 * All supported toast positions.
 * These are the six possible positions where toasts can be displayed on the viewport.
 * @constant
 */
export const TOAST_POSITIONS: ToastPosition[] = [
  'top-left',
  'top-center',
  'top-right',
  'bottom-left',
  'bottom-center',
  'bottom-right',
];

/**
 * Aria-live politeness levels for different toast variants.
 * Maps toast variant to the appropriate aria-live level for screen reader announcement.
 *
 * - 'polite': Announcements wait until current speech finishes (used for success/info)
 * - 'assertive': Announcements interrupt current speech immediately (used for error/warning)
 *
 * @constant
 */
export const ARIA_LIVE_MAPPING: Record<ToastVariant, 'polite' | 'assertive'> = {
  success: 'polite',
  error: 'assertive',
  warning: 'assertive',
  info: 'polite',
};

/**
 * Minimum touch target size in pixels (WCAG 2.1 requirement).
 * Used for close buttons and action buttons on touch devices.
 * @constant
 */
export const MIN_TOUCH_TARGET_SIZE = 44;

/**
 * Delay before auto-dismissing a toast after an action button is clicked (in milliseconds).
 * This provides visual feedback that the action was executed before the toast disappears.
 * @constant
 */
export const ACTION_AUTO_DISMISS_DELAY = 500;

/**
 * Duration for hover/pause state visual indication (in milliseconds).
 * Used when visualizing the timer pause on mouse hover.
 * @constant
 */
export const HOVER_PAUSE_DURATION = 100;

/**
 * Maximum length for toast messages (in characters).
 * Messages longer than this should be truncated or wrapped with ellipsis.
 * @constant
 */
export const MAX_MESSAGE_LENGTH = 500;
