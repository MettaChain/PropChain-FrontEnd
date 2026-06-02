/**
 * Swipe Gesture Handler Utilities
 * Provides swipe-to-dismiss functionality for touch devices
 */

/**
 * Swipe direction enumeration
 */
export enum SwipeDirection {
  UP = 'up',
  DOWN = 'down',
  LEFT = 'left',
  RIGHT = 'right',
}

/**
 * Configuration for swipe gesture detection
 */
interface SwipeConfig {
  /** Minimum distance in pixels to consider as a swipe */
  minDistance?: number;
  /** Minimum velocity in pixels/ms to consider as a swipe */
  minVelocity?: number;
  /** Maximum time in ms for a gesture to be considered a swipe */
  maxDuration?: number;
  /** Callback when swipe is detected */
  onSwipe: (direction: SwipeDirection) => void;
  /** Optional callback for any touch end (even if not a swipe) */
  onTouchEnd?: () => void;
}

/**
 * Sets up swipe-to-dismiss gesture detection on an element.
 * Useful for mobile toast notifications that users can swipe away.
 *
 * Swipe gestures:
 * - Swipe UP or LEFT: Dismiss the toast (common on mobile)
 * - Swipe DOWN or RIGHT: Can optionally trigger other actions
 *
 * @param {HTMLElement} element - The element to attach swipe handler to
 * @param {SwipeConfig} config - Configuration for swipe detection
 * @returns {Function} Cleanup function to remove event listeners
 *
 * @example
 * useEffect(() => {
 *   const element = toastRef.current;
 *   if (!element) return;
 *
 *   const cleanup = setupSwipeGesture(element, {
 *     onSwipe: (direction) => {
 *       if (direction === SwipeDirection.UP || direction === SwipeDirection.LEFT) {
 *         removeToast(toastId);
 *       }
 *     },
 *   });
 *
 *   return cleanup;
 * }, [toastId]);
 */
export function setupSwipeGesture(
  element: HTMLElement,
  config: SwipeConfig
): () => void {
  const {
    minDistance = 50,
    minVelocity = 0.5,
    maxDuration = 500,
    onSwipe,
    onTouchEnd,
  } = config;

  let startX = 0;
  let startY = 0;
  let startTime = 0;
  let isTracking = false;

  const handleTouchStart = (event: TouchEvent) => {
    if (event.touches.length !== 1) {
      return; // Only handle single touch
    }

    const touch = event.touches[0];
    startX = touch.clientX;
    startY = touch.clientY;
    startTime = Date.now();
    isTracking = true;
  };

  const handleTouchMove = (event: TouchEvent) => {
    // Can be used for visual feedback (e.g., track opacity change)
    // Currently just tracking for the end handler
  };

  const handleTouchEnd = (event: TouchEvent) => {
    if (!isTracking) {
      return;
    }

    isTracking = false;

    if (event.changedTouches.length !== 1) {
      onTouchEnd?.();
      return;
    }

    const touch = event.changedTouches[0];
    const endX = touch.clientX;
    const endY = touch.clientY;
    const endTime = Date.now();

    // Calculate swipe properties
    const deltaX = endX - startX;
    const deltaY = endY - startY;
    const duration = endTime - startTime;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    const velocity = distance / duration;

    // Determine if this is a valid swipe
    if (
      duration <= maxDuration &&
      distance >= minDistance &&
      velocity >= minVelocity
    ) {
      // Determine swipe direction
      const direction = detectSwipeDirection(deltaX, deltaY);
      onSwipe(direction);
    }

    onTouchEnd?.();
  };

  // Attach event listeners
  element.addEventListener('touchstart', handleTouchStart, { passive: true });
  element.addEventListener('touchmove', handleTouchMove, { passive: true });
  element.addEventListener('touchend', handleTouchEnd, { passive: true });

  // Return cleanup function
  return () => {
    element.removeEventListener('touchstart', handleTouchStart);
    element.removeEventListener('touchmove', handleTouchMove);
    element.removeEventListener('touchend', handleTouchEnd);
  };
}

/**
 * Detects the swipe direction based on X and Y deltas.
 * Determines which direction the user swiped based on the magnitude of movement.
 *
 * @param {number} deltaX - Horizontal distance in pixels (positive = right)
 * @param {number} deltaY - Vertical distance in pixels (positive = down)
 * @returns {SwipeDirection} The detected swipe direction
 *
 * @example
 * const direction = detectSwipeDirection(-100, 20);
 * // Returns SwipeDirection.LEFT (more horizontal movement to the left)
 */
export function detectSwipeDirection(deltaX: number, deltaY: number): SwipeDirection {
  const absDeltaX = Math.abs(deltaX);
  const absDeltaY = Math.abs(deltaY);

  // Determine if swipe is more horizontal or vertical
  if (absDeltaX > absDeltaY) {
    // Horizontal swipe
    return deltaX > 0 ? SwipeDirection.RIGHT : SwipeDirection.LEFT;
  }

  // Vertical swipe
  return deltaY > 0 ? SwipeDirection.DOWN : SwipeDirection.UP;
}

/**
 * Calculates swipe velocity (pixels per millisecond).
 * Can be used to detect "flick" gestures vs. slow drags.
 *
 * @param {number} distance - Total distance in pixels
 * @param {number} duration - Time taken in milliseconds
 * @returns {number} Velocity in pixels per millisecond
 *
 * @example
 * const velocity = calculateSwipeVelocity(100, 200);
 * // Returns 0.5 (50 pixels per 100ms)
 */
export function calculateSwipeVelocity(distance: number, duration: number): number {
  if (duration === 0) {
    return 0;
  }
  return distance / duration;
}

/**
 * Creates a swipe-responsive handler that dismisses toasts on swipe.
 * Handles common swipe patterns (up, left) for dismissal.
 *
 * @param {HTMLElement} element - The element to attach handler to
 * @param {Function} onDismiss - Callback when user swipes to dismiss
 * @returns {Function} Cleanup function to remove event listeners
 *
 * @example
 * useEffect(() => {
 *   const cleanup = setupSwipeToDismiss(toastElement, () => {
 *     removeToast(toastId);
 *   });
 *   return cleanup;
 * }, [toastId]);
 */
export function setupSwipeToDismiss(
  element: HTMLElement,
  onDismiss: () => void
): () => void {
  return setupSwipeGesture(element, {
    minDistance: 50,
    minVelocity: 0.3,
    maxDuration: 600,
    onSwipe: (direction) => {
      // Dismiss on swipe up or left (common mobile patterns)
      if (
        direction === SwipeDirection.UP ||
        direction === SwipeDirection.LEFT
      ) {
        onDismiss();
      }
    },
  });
}

/**
 * Sets up visual feedback during swipe gesture.
 * Updates element opacity/transform to show swipe progress.
 *
 * @param {HTMLElement} element - The element to update during swipe
 * @param {Function} [onDismiss] - Optional dismiss callback
 * @returns {Function} Cleanup function to remove event listeners
 *
 * @example
 * useEffect(() => {
 *   const cleanup = setupSwipeWithFeedback(toastElement, () => {
 *     removeToast(toastId);
 *   });
 *   return cleanup;
 * }, [toastId]);
 */
export function setupSwipeWithFeedback(
  element: HTMLElement,
  onDismiss?: () => void
): () => void {
  let startX = 0;
  let startY = 0;
  let isTracking = false;

  const handleTouchStart = (event: TouchEvent) => {
    if (event.touches.length !== 1) {
      return;
    }

    const touch = event.touches[0];
    startX = touch.clientX;
    startY = touch.clientY;
    isTracking = true;

    // Prepare element for animation
    element.style.transition = 'none';
  };

  const handleTouchMove = (event: TouchEvent) => {
    if (!isTracking || event.changedTouches.length !== 1) {
      return;
    }

    const touch = event.changedTouches[0];
    const deltaX = touch.clientX - startX;
    const deltaY = touch.clientY - startY;

    // Calculate opacity based on swipe distance (fade as user swipes)
    const maxDistance = 100;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    const opacity = Math.max(0.5, 1 - distance / maxDistance);

    // Apply visual feedback
    element.style.opacity = opacity.toString();
    element.style.transform = `translateX(${deltaX}px)`;
  };

  const handleTouchEnd = (event: TouchEvent) => {
    isTracking = false;

    if (event.changedTouches.length !== 1) {
      return;
    }

    const touch = event.changedTouches[0];
    const deltaX = touch.clientX - startX;
    const deltaY = touch.clientY - startY;

    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    const direction = detectSwipeDirection(deltaX, deltaY);

    // Check if swipe threshold was met
    const dismissThreshold = 50;
    if (
      distance > dismissThreshold &&
      (direction === SwipeDirection.UP || direction === SwipeDirection.LEFT)
    ) {
      // Complete the swipe animation
      element.style.transition = 'all 0.3s ease-out';
      element.style.opacity = '0';
      element.style.transform = 'translateX(100%)';

      // Call dismiss after animation completes
      setTimeout(() => {
        onDismiss?.();
      }, 300);
    } else {
      // Reset to original position if not swiped enough
      element.style.transition = 'all 0.2s ease-out';
      element.style.opacity = '1';
      element.style.transform = 'translateX(0)';
    }
  };

  // Attach event listeners
  element.addEventListener('touchstart', handleTouchStart, { passive: true });
  element.addEventListener('touchmove', handleTouchMove, { passive: true });
  element.addEventListener('touchend', handleTouchEnd, { passive: true });

  // Return cleanup function
  return () => {
    element.removeEventListener('touchstart', handleTouchStart);
    element.removeEventListener('touchmove', handleTouchMove);
    element.removeEventListener('touchend', handleTouchEnd);
  };
}
