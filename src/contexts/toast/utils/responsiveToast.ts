/**
 * Responsive Toast Utilities
 * Provides utilities for mobile and responsive toast behavior
 */

import {
  MOBILE_BREAKPOINT,
  MIN_TOUCH_TARGET_SIZE,
  DEFAULT_POSITION_MOBILE,
  DEFAULT_POSITION_DESKTOP,
} from '../constants';
import type { ToastPosition } from '../types';

/**
 * Detects if the current viewport is mobile (< 768px width).
 * Used for responsive positioning and touch interaction logic.
 *
 * @returns {boolean} True if viewport width is less than MOBILE_BREAKPOINT
 * @example
 * if (isMobileViewport()) {
 *   // Use mobile-optimized positioning
 * }
 */
export function isMobileViewport(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }
  return window.innerWidth < MOBILE_BREAKPOINT;
}

/**
 * Gets the appropriate default toast position based on viewport size.
 * Mobile devices default to 'bottom-center' for better accessibility.
 * Desktop defaults to 'top-right'.
 *
 * @returns {ToastPosition} The recommended position for current viewport
 * @example
 * const position = getResponsivePosition();
 * // Returns 'bottom-center' on mobile, 'top-right' on desktop
 */
export function getResponsivePosition(): ToastPosition {
  return isMobileViewport() ? DEFAULT_POSITION_MOBILE : DEFAULT_POSITION_DESKTOP;
}

/**
 * Calculates responsive toast styling based on viewport size.
 * On mobile, toasts use 100% width with padding to prevent text overflow.
 * On desktop, toasts use fixed width with appropriate margins.
 *
 * @returns {Object} Object containing responsive CSS properties
 * @returns {string} returns.maxWidth - Maximum width of toast (e.g., '100%' or '400px')
 * @returns {string} returns.margin - Margin around toast (e.g., '8px' or '0')
 * @returns {string} returns.padding - Padding inside toast (e.g., '16px' or '12px')
 *
 * @example
 * const styles = getResponsiveStyles();
 * // On mobile: { maxWidth: '100%', margin: '8px', padding: '16px' }
 * // On desktop: { maxWidth: 'unset', margin: '0', padding: '12px' }
 */
export function getResponsiveStyles(): {
  maxWidth: string;
  margin: string;
  padding: string;
} {
  const isMobile = isMobileViewport();
  
  return {
    maxWidth: isMobile ? '100%' : 'unset',
    margin: isMobile ? '8px' : '0',
    padding: isMobile ? '16px' : '12px',
  };
}

/**
 * Validates that touch targets meet WCAG 2.1 requirements (44x44px minimum).
 * Returns the appropriate button size, ensuring minimum touch target compliance.
 *
 * @param {number} [suggestedSize=24] - Suggested button size in pixels
 * @returns {number} The validated button size (minimum 44px on touch devices)
 *
 * @example
 * const buttonSize = getAccessibleButtonSize(24);
 * // Returns 44 on touch devices, 24 on non-touch
 */
export function getAccessibleButtonSize(suggestedSize: number = 24): number {
  // Check if device supports touch and if suggested size is below minimum
  const isTouchDevice =
    typeof window !== 'undefined' &&
    ('ontouchstart' in window || navigator.maxTouchPoints > 0);

  if (isTouchDevice && suggestedSize < MIN_TOUCH_TARGET_SIZE) {
    return MIN_TOUCH_TARGET_SIZE;
  }

  return suggestedSize;
}

/**
 * Detects if device supports touch interaction.
 * Used for enabling swipe-to-dismiss and other touch features.
 *
 * @returns {boolean} True if device supports touch events
 * @example
 * if (isTouchDevice()) {
 *   // Enable swipe-to-dismiss gesture
 * }
 */
export function isTouchDevice(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }
  return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
}

/**
 * Gets the appropriate vertical spacing for stacked toasts.
 * Returns smaller spacing on mobile to fit more toasts in limited viewport.
 *
 * @returns {number} Vertical spacing in pixels (8px on mobile, 12px on desktop)
 * @example
 * const spacing = getToastStackSpacing();
 * // Returns 8 on mobile, 12 on desktop
 */
export function getToastStackSpacing(): number {
  return isMobileViewport() ? 8 : 12;
}

/**
 * Computes text wrapping styles for mobile toasts.
 * Ensures text doesn't overflow on small screens.
 *
 * @returns {Object} Object containing text-related CSS properties
 * @returns {string} returns.wordWrap - Word wrap behavior
 * @returns {string} returns.overflowWrap - Overflow wrap behavior
 * @returns {string} returns.whiteSpace - White space handling
 *
 * @example
 * const textStyles = getTextWrappingStyles();
 * // Returns styles ensuring text wraps properly on mobile
 */
export function getTextWrappingStyles(): {
  wordWrap: string;
  overflowWrap: string;
  whiteSpace: string;
} {
  return {
    wordWrap: 'break-word',
    overflowWrap: 'break-word',
    whiteSpace: 'pre-wrap',
  };
}

/**
 * Detects if viewport height is small (< 600px).
 * Used to adjust toast stacking and spacing on limited vertical space.
 *
 * @returns {boolean} True if viewport height is less than 600px
 * @example
 * if (isSmallViewport()) {
 *   // Use reduced vertical spacing for toasts
 * }
 */
export function isSmallViewport(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }
  return window.innerHeight < 600;
}

/**
 * Gets the maximum number of toasts that can fit in the viewport.
 * Adjusts based on viewport size to prevent overwhelming the user.
 * Mobile: 3 toasts, Desktop: 5 toasts.
 *
 * @returns {number} Maximum toasts that should be displayed
 * @example
 * const maxVisible = getMaxVisibleToasts();
 * // Returns 3 on mobile, 5 on desktop
 */
export function getMaxVisibleToasts(): number {
  return isMobileViewport() ? 3 : 5;
}
