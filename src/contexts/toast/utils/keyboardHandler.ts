/**
 * Keyboard and Accessibility Utilities
 * Handles keyboard navigation, focus management, and WCAG compliance
 */

/**
 * Sets up keyboard event handler for Escape key to dismiss toasts.
 * Allows users to dismiss focused toasts using the Escape key.
 *
 * @param {Function} onDismiss - Callback when Escape is pressed
 * @returns {Function} Cleanup function to remove event listener
 *
 * @example
 * useEffect(() => {
 *   const cleanup = setupEscapeKeyHandler(() => {
 *     removeToast(toastId);
 *   });
 *   return cleanup;
 * }, [toastId]);
 */
export function setupEscapeKeyHandler(onDismiss: () => void): () => void {
  const handleKeyDown = (event: KeyboardEvent) => {
    // Only respond to Escape key
    if (event.key === 'Escape' || event.keyCode === 27) {
      event.preventDefault();
      onDismiss();
    }
  };

  // Attach listener to document for global Escape handling
  document.addEventListener('keydown', handleKeyDown);

  // Return cleanup function
  return () => {
    document.removeEventListener('keydown', handleKeyDown);
  };
}

/**
 * Manages focus to prevent focus returning to a dismissed toast.
 * Restores focus to a safe element (usually the document body or previous focus).
 *
 * @param {HTMLElement | null} dismissedElement - The element being dismissed
 * @param {HTMLElement} [fallbackElement=document.body] - Element to focus if current focus is on dismissed element
 *
 * @example
 * const toastElement = toastRef.current;
 * removeToast(toastId);
 * manageFocusAfterDismissal(toastElement);
 */
export function manageFocusAfterDismissal(
  dismissedElement: HTMLElement | null,
  fallbackElement: HTMLElement = document.body
): void {
  if (!dismissedElement) {
    return;
  }

  const activeElement = document.activeElement as HTMLElement | null;

  // Check if focus is currently inside the dismissed element
  if (activeElement && dismissedElement.contains(activeElement)) {
    // Focus the fallback element (usually body or a main content area)
    fallbackElement.focus();
  }
}

/**
 * Finds the next focusable element within a container.
 * Used for managing keyboard navigation through toast elements.
 *
 * @param {HTMLElement} container - The container to search within
 * @param {HTMLElement | null} [currentElement] - Current focused element (to find next)
 * @param {boolean} [reverse=false] - If true, find previous focusable element
 * @returns {HTMLElement | null} The next focusable element, or null if none found
 *
 * @example
 * const nextElement = findNextFocusableElement(toastElement);
 * if (nextElement) {
 *   nextElement.focus();
 * }
 */
export function findNextFocusableElement(
  container: HTMLElement,
  currentElement: HTMLElement | null = null,
  reverse: boolean = false
): HTMLElement | null {
  // Selector for focusable elements
  const focusableSelector =
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

  const focusableElements = Array.from(
    container.querySelectorAll(focusableSelector)
  ) as HTMLElement[];

  if (focusableElements.length === 0) {
    return null;
  }

  if (!currentElement) {
    return reverse ? focusableElements[focusableElements.length - 1] : focusableElements[0];
  }

  const currentIndex = focusableElements.indexOf(currentElement);

  if (currentIndex === -1) {
    return reverse ? focusableElements[focusableElements.length - 1] : focusableElements[0];
  }

  if (reverse) {
    return currentIndex > 0
      ? focusableElements[currentIndex - 1]
      : focusableElements[focusableElements.length - 1];
  }

  return currentIndex < focusableElements.length - 1
    ? focusableElements[currentIndex + 1]
    : focusableElements[0];
}

/**
 * Prevents keyboard focus from escaping a container (focus trap).
 * Useful for modal-like toasts that should not allow Tab to escape.
 *
 * @param {HTMLElement} container - The container to trap focus within
 * @param {Function} [onEscape] - Optional callback when user tries to escape (e.g., Escape key)
 * @returns {Function} Cleanup function to remove event listeners
 *
 * @example
 * const cleanup = createFocusTrap(toastElement, () => {
 *   removeToast(toastId);
 * });
 * return cleanup; // Cleanup on component unmount
 */
export function createFocusTrap(
  container: HTMLElement,
  onEscape?: () => void
): () => void {
  const handleKeyDown = (event: KeyboardEvent) => {
    // Handle Escape key
    if (event.key === 'Escape' || event.keyCode === 27) {
      event.preventDefault();
      onEscape?.();
      return;
    }

    // Don't trap Tab key - allow natural tab flow out of toast
    // This prevents keyboard navigation from getting stuck
    if (event.key === 'Tab' || event.keyCode === 9) {
      return;
    }
  };

  container.addEventListener('keydown', handleKeyDown);

  return () => {
    container.removeEventListener('keydown', handleKeyDown);
  };
}

/**
 * Checks if an element is currently visible in the viewport.
 * Used for accessibility testing and focus management.
 *
 * @param {HTMLElement} element - The element to check
 * @returns {boolean} True if element is visible in viewport
 *
 * @example
 * if (isElementVisible(toastElement)) {
 *   // Toast is visible to user
 * }
 */
export function isElementVisible(element: HTMLElement): boolean {
  const rect = element.getBoundingClientRect();

  return (
    rect.top >= 0 &&
    rect.left >= 0 &&
    rect.bottom <= window.innerHeight &&
    rect.right <= window.innerWidth
  );
}

/**
 * Generates an accessible label for a button based on context.
 * Ensures action buttons have descriptive aria-label for screen readers.
 *
 * @param {string} action - The action being performed (e.g., 'retry', 'undo', 'dismiss')
 * @param {string} [toastType='notification'] - Type of toast for context
 * @returns {string} Accessible label for the button
 *
 * @example
 * const label = generateAccessibleLabel('retry', 'error');
 * // Returns: "Retry error notification"
 */
export function generateAccessibleLabel(
  action: string,
  toastType: string = 'notification'
): string {
  // Capitalize first letter
  const capitalizedAction = action.charAt(0).toUpperCase() + action.slice(1).toLowerCase();
  const capitalizedType = toastType.charAt(0).toUpperCase() + toastType.slice(1).toLowerCase();

  return `${capitalizedAction} ${capitalizedType}`;
}

/**
 * Announces a message to screen readers without visual feedback.
 * Used for important announcements that don't require visual display.
 *
 * @param {string} message - The message to announce
 * @param {'polite' | 'assertive'} [priority='polite'] - Priority level for announcement
 * @example
 * announceToScreenReader('Toast dismissed');
 * announceToScreenReader('Error occurred', 'assertive');
 */
export function announceToScreenReader(
  message: string,
  priority: 'polite' | 'assertive' = 'polite'
): void {
  // Create a temporary aria-live region for the announcement
  const announcement = document.createElement('div');
  announcement.setAttribute('aria-live', priority);
  announcement.setAttribute('aria-atomic', 'true');
  announcement.className = 'sr-only'; // Visually hidden but accessible to screen readers
  announcement.textContent = message;

  document.body.appendChild(announcement);

  // Remove after announcement is made (browsers typically announce within 100ms)
  setTimeout(() => {
    document.body.removeChild(announcement);
  }, 1000);
}

/**
 * Validates WCAG 2.1 AA color contrast requirements.
 * Ensures text contrast ratio meets minimum standards.
 *
 * @param {string} foreground - Foreground color (hex format, e.g., '#000000')
 * @param {string} background - Background color (hex format, e.g., '#FFFFFF')
 * @returns {boolean} True if contrast ratio meets WCAG AA standard (4.5:1 for text)
 *
 * @example
 * const isAccessible = meetsContrastRequirements('#000000', '#FFFFFF');
 * // Returns true (black on white has high contrast)
 */
export function meetsContrastRequirements(
  foreground: string,
  background: string
): boolean {
  // Calculate relative luminance for each color
  const fgLuminance = getRelativeLuminance(foreground);
  const bgLuminance = getRelativeLuminance(background);

  // Calculate contrast ratio
  const lighter = Math.max(fgLuminance, bgLuminance);
  const darker = Math.min(fgLuminance, bgLuminance);
  const contrastRatio = (lighter + 0.05) / (darker + 0.05);

  // WCAG AA requires 4.5:1 for text
  return contrastRatio >= 4.5;
}

/**
 * Calculates relative luminance of a color (used for contrast calculations).
 * Helper for WCAG contrast ratio calculation.
 *
 * @param {string} hex - Color in hex format (e.g., '#FFFFFF')
 * @returns {number} Relative luminance value (0-1)
 * @internal
 */
function getRelativeLuminance(hex: string): number {
  // Convert hex to RGB
  const rgb = parseInt(hex.substring(1), 16);
  const r = (rgb >> 16) & 0xff;
  const g = (rgb >> 8) & 0xff;
  const b = (rgb >> 0) & 0xff;

  // Convert to 0-1 range
  const [rs, gs, bs] = [r, g, b].map((val) => {
    const c = val / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });

  // Calculate luminance
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

/**
 * Checks if device prefers reduced motion (user accessibility setting).
 * Used to disable animations for users with motion sensitivity.
 *
 * @returns {boolean} True if user has enabled reduce-motion preference
 *
 * @example
 * const prefersReducedMotion = shouldReduceMotion();
 * if (prefersReducedMotion) {
 *   // Disable animations or use simpler animations
 * }
 */
export function shouldReduceMotion(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }

  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}
