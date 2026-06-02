/**
 * Global Toast Notification System
 * Public API exports for the toast notification system.
 *
 * @module toast
 *
 * @example
 * // In your app layout:
 * import { ToastProvider } from '@/contexts/toast';
 * export default function RootLayout({ children }) {
 *   return (
 *     <ToastProvider>
 *       {children}
 *     </ToastProvider>
 *   );
 * }
 *
 * @example
 * // In your components:
 * import { useToast } from '@/contexts/toast';
 * export function MyComponent() {
 *   const toast = useToast();
 *   return (
 *     <button onClick={() => toast.success('Success!')}>
 *       Show Toast
 *     </button>
 *   );
 * }
 */

// Components
export { ToastProvider } from './components/ToastProvider';
export { ToastAccessibility, withToastAccessibility } from './components/ToastAccessibility';
export { MockToastProvider } from './__mocks__/MockToastProvider';

// Hooks
export { useToast } from './hooks/useToast';

// Types
export type {
  Toast,
  ToastVariant,
  ToastPosition,
  ToastAction,
  ToastOptions,
  ToastContextType,
  ToastProviderProps,
  ToastProviderConfig,
  UseToastReturn,
} from './types';

// Utilities - Error handling (Task 10)
export { 
  showErrorToast,
  getErrorIcon,
  isRetryableError,
  getErrorSeverity,
  extractSafeErrorDetails,
} from './utils/errorToast';

// Utilities - Timer management (Task 8)
export {
  createManagedTimer,
  formatCountdown,
  calculateCountdownProgress,
  calculateFadeOpacity,
  isValidDuration,
  normalizeDuration,
} from './utils/timerManager';

// Utilities - Responsive behavior (Task 6)
export {
  isMobileViewport,
  getResponsivePosition,
  getResponsiveStyles,
  getAccessibleButtonSize,
  isTouchDevice,
  getToastStackSpacing,
  getTextWrappingStyles,
  isSmallViewport,
  getMaxVisibleToasts,
} from './utils/responsiveToast';

// Utilities - Keyboard and accessibility (Task 7)
export {
  setupEscapeKeyHandler,
  manageFocusAfterDismissal,
  findNextFocusableElement,
  createFocusTrap,
  isElementVisible,
  generateAccessibleLabel,
  announceToScreenReader,
  meetsContrastRequirements,
  shouldReduceMotion,
} from './utils/keyboardHandler';

// Utilities - Swipe gestures (Task 6)
export {
  SwipeDirection,
  setupSwipeGesture,
  detectSwipeDirection,
  calculateSwipeVelocity,
  setupSwipeToDismiss,
  setupSwipeWithFeedback,
} from './utils/swipeHandler';

// Constants
export {
  DEFAULT_DURATION,
  DEFAULT_MAX_TOASTS,
  DEFAULT_POSITION_DESKTOP,
  DEFAULT_POSITION_MOBILE,
  MOBILE_BREAKPOINT,
  TOAST_VARIANTS,
  TOAST_POSITIONS,
  ARIA_LIVE_MAPPING,
  MIN_TOUCH_TARGET_SIZE,
  ACTION_AUTO_DISMISS_DELAY,
  HOVER_PAUSE_DURATION,
  MAX_MESSAGE_LENGTH,
} from './constants';
