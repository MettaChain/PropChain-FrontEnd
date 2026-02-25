"use client";

/**
 * Touch Handler Module
 * 
 * Provides unified touch interaction and gesture management with:
 * - Touch target validation (minimum 44x44px)
 * - Visual feedback within 100ms
 * - Gesture registration and handling
 * - Double-tap zoom prevention
 * - Passive event listeners for scroll performance
 * - Haptic feedback support
 * 
 * Requirements: 4.1, 4.2, 4.6, 8.6
 */

export interface TouchTarget {
  minWidth: number;  // Minimum 44px
  minHeight: number; // Minimum 44px
  spacing: number;   // Minimum 8px between targets
}

export interface GestureConfig {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
  onLongPress?: () => void;
  onDoubleTap?: () => void;
  onPinch?: (scale: number) => void;
}

export interface TouchHandler {
  validateTouchTarget(element: HTMLElement): boolean;
  addTouchFeedback(element: HTMLElement): void;
  registerGestures(element: HTMLElement, config: GestureConfig): () => void;
  preventDoubleTapZoom(element: HTMLElement): void;
}

// Constants for touch target validation
const MIN_TOUCH_TARGET_SIZE = 44; // pixels (WCAG 2.1 Level AAA)
const MIN_TOUCH_TARGET_SPACING = 8; // pixels

// Constants for gesture detection
const SWIPE_THRESHOLD = 50; // pixels
const LONG_PRESS_DELAY = 500; // milliseconds
const DOUBLE_TAP_DELAY = 300; // milliseconds
const FEEDBACK_DURATION = 100; // milliseconds

/**
 * Validates that an element meets minimum touch target size requirements
 * Requirement 4.1: Minimum 44x44px touch targets
 * Requirement 8.6: Minimum 8px spacing between targets
 */
export function validateTouchTarget(element: HTMLElement): boolean {
  try {
    const rect = element.getBoundingClientRect();
    const computedStyle = window.getComputedStyle(element);
    
    // Get actual dimensions including padding but not margin
    const width = rect.width;
    const height = rect.height;
    
    // Check minimum size requirements
    const meetsMinWidth = width >= MIN_TOUCH_TARGET_SIZE;
    const meetsMinHeight = height >= MIN_TOUCH_TARGET_SIZE;
    
    if (!meetsMinWidth || !meetsMinHeight) {
      console.warn(
        `Touch target validation failed: Element has dimensions ${width}x${height}px, ` +
        `but minimum required is ${MIN_TOUCH_TARGET_SIZE}x${MIN_TOUCH_TARGET_SIZE}px`,
        element
      );
      return false;
    }
    
    // Check spacing between adjacent interactive elements
    const siblings = Array.from(element.parentElement?.children || [])
      .filter(child => child !== element && isInteractiveElement(child as HTMLElement));
    
    for (const sibling of siblings) {
      const siblingRect = sibling.getBoundingClientRect();
      const spacing = calculateSpacing(rect, siblingRect);
      
      if (spacing < MIN_TOUCH_TARGET_SPACING) {
        console.warn(
          `Touch target spacing validation failed: ${spacing}px spacing between elements, ` +
          `but minimum required is ${MIN_TOUCH_TARGET_SPACING}px`,
          element,
          sibling
        );
        return false;
      }
    }
    
    return true;
  } catch (error) {
    console.error('Touch target validation error:', error);
    return false;
  }
}

/**
 * Checks if an element is interactive (button, link, input, etc.)
 */
function isInteractiveElement(element: HTMLElement): boolean {
  const interactiveTags = ['BUTTON', 'A', 'INPUT', 'SELECT', 'TEXTAREA'];
  const hasClickHandler = element.onclick !== null || 
                         element.getAttribute('onclick') !== null;
  const hasRole = ['button', 'link', 'checkbox', 'radio', 'tab'].includes(
    element.getAttribute('role') || ''
  );
  
  return interactiveTags.includes(element.tagName) || hasClickHandler || hasRole;
}

/**
 * Calculates minimum spacing between two element rectangles
 */
function calculateSpacing(rect1: DOMRect, rect2: DOMRect): number {
  // Calculate horizontal and vertical gaps
  const horizontalGap = Math.max(
    0,
    Math.max(rect1.left, rect2.left) - Math.min(rect1.right, rect2.right)
  );
  
  const verticalGap = Math.max(
    0,
    Math.max(rect1.top, rect2.top) - Math.min(rect1.bottom, rect2.bottom)
  );
  
  // Return the minimum gap (elements might be adjacent horizontally or vertically)
  if (horizontalGap === 0 && verticalGap === 0) {
    // Elements overlap
    return 0;
  } else if (horizontalGap === 0) {
    // Vertically adjacent
    return verticalGap;
  } else if (verticalGap === 0) {
    // Horizontally adjacent
    return horizontalGap;
  } else {
    // Diagonally positioned - use Euclidean distance
    return Math.sqrt(horizontalGap * horizontalGap + verticalGap * verticalGap);
  }
}

/**
 * Adds visual and haptic feedback to touch interactions
 * Requirement 4.2: Visual feedback within 100ms of touch
 */
export function addTouchFeedback(element: HTMLElement): void {
  try {
    // Add CSS class for touch feedback styling
    element.classList.add('touch-feedback');
    
    // Store original transform to restore later
    const originalTransform = element.style.transform;
    
    const handleTouchStart = () => {
      // Visual feedback: scale down slightly
      element.style.transform = 'scale(0.98)';
      element.style.transition = 'transform 0.1s ease';
      
      // Haptic feedback if supported
      triggerHapticFeedback('light');
      
      // Ensure feedback is visible for at least 100ms
      setTimeout(() => {
        element.style.transform = originalTransform;
      }, FEEDBACK_DURATION);
    };
    
    const handleTouchEnd = () => {
      // Restore original state
      element.style.transform = originalTransform;
    };
    
    const handleTouchCancel = () => {
      // Restore original state on cancel
      element.style.transform = originalTransform;
    };
    
    // Use passive listeners for better scroll performance
    element.addEventListener('touchstart', handleTouchStart, { passive: true });
    element.addEventListener('touchend', handleTouchEnd, { passive: true });
    element.addEventListener('touchcancel', handleTouchCancel, { passive: true });
    
    // Store cleanup function on element for later removal
    (element as any).__touchFeedbackCleanup = () => {
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchend', handleTouchEnd);
      element.removeEventListener('touchcancel', handleTouchCancel);
      element.classList.remove('touch-feedback');
    };
  } catch (error) {
    console.error('Failed to add touch feedback:', error);
  }
}

/**
 * Triggers haptic feedback if supported by the device
 */
function triggerHapticFeedback(intensity: 'light' | 'medium' | 'heavy' = 'light'): void {
  try {
    if ('vibrate' in navigator) {
      const patterns = {
        light: 10,
        medium: 20,
        heavy: 30,
      };
      navigator.vibrate(patterns[intensity]);
    }
  } catch (error) {
    // Silently fail if vibration is not supported
  }
}

/**
 * Registers gesture handlers on an element
 * Integrates with existing gesture system while adding validation
 */
export function registerGestures(
  element: HTMLElement,
  config: GestureConfig
): () => void {
  try {
    // Validate touch target before registering gestures
    if (!validateTouchTarget(element)) {
      console.warn('Registering gestures on element that does not meet touch target requirements');
    }
    
    // Add touch feedback
    addTouchFeedback(element);
    
    // Gesture state
    let touchStart: { x: number; y: number; time: number } | null = null;
    let touchEnd: { x: number; y: number } | null = null;
    let lastTap = 0;
    let longPressTimer: NodeJS.Timeout | null = null;
    let initialDistance = 0;
    
    const getDistance = (touch1: Touch, touch2: Touch): number => {
      const dx = touch1.clientX - touch2.clientX;
      const dy = touch1.clientY - touch2.clientY;
      return Math.sqrt(dx * dx + dy * dy);
    };
    
    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 1) {
        const touch = e.touches[0];
        touchStart = { 
          x: touch.clientX, 
          y: touch.clientY,
          time: Date.now()
        };
        touchEnd = null;
        
        // Start long press timer
        if (config.onLongPress) {
          longPressTimer = setTimeout(() => {
            config.onLongPress?.();
            triggerHapticFeedback('medium');
          }, LONG_PRESS_DELAY);
        }
      } else if (e.touches.length === 2 && config.onPinch) {
        // Pinch gesture
        initialDistance = getDistance(e.touches[0], e.touches[1]);
        
        // Clear long press timer for multi-touch
        if (longPressTimer) {
          clearTimeout(longPressTimer);
          longPressTimer = null;
        }
      }
    };
    
    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 1) {
        const touch = e.touches[0];
        touchEnd = { x: touch.clientX, y: touch.clientY };
        
        // Clear long press timer on move
        if (longPressTimer) {
          clearTimeout(longPressTimer);
          longPressTimer = null;
        }
      } else if (e.touches.length === 2 && config.onPinch && initialDistance > 0) {
        // Handle pinch
        const currentDistance = getDistance(e.touches[0], e.touches[1]);
        const scale = currentDistance / initialDistance;
        config.onPinch(scale);
      }
    };
    
    const handleTouchEnd = () => {
      // Clear long press timer
      if (longPressTimer) {
        clearTimeout(longPressTimer);
        longPressTimer = null;
      }
      
      if (!touchStart || !touchEnd) {
        // Check for tap/double-tap
        if (touchStart) {
          const now = Date.now();
          if (now - lastTap < DOUBLE_TAP_DELAY && config.onDoubleTap) {
            config.onDoubleTap();
            triggerHapticFeedback('light');
            lastTap = 0; // Reset to prevent triple tap
          } else {
            lastTap = now;
          }
        }
        
        touchStart = null;
        touchEnd = null;
        initialDistance = 0;
        return;
      }
      
      const deltaX = touchEnd.x - touchStart.x;
      const deltaY = touchEnd.y - touchStart.y;
      const absDeltaX = Math.abs(deltaX);
      const absDeltaY = Math.abs(deltaY);
      
      // Check for swipe gestures
      if (Math.max(absDeltaX, absDeltaY) > SWIPE_THRESHOLD) {
        if (absDeltaX > absDeltaY) {
          // Horizontal swipe
          if (deltaX > 0 && config.onSwipeRight) {
            config.onSwipeRight();
            triggerHapticFeedback('light');
          } else if (deltaX < 0 && config.onSwipeLeft) {
            config.onSwipeLeft();
            triggerHapticFeedback('light');
          }
        } else {
          // Vertical swipe
          if (deltaY > 0 && config.onSwipeDown) {
            config.onSwipeDown();
            triggerHapticFeedback('light');
          } else if (deltaY < 0 && config.onSwipeUp) {
            config.onSwipeUp();
            triggerHapticFeedback('light');
          }
        }
      }
      
      // Reset touch positions
      touchStart = null;
      touchEnd = null;
      initialDistance = 0;
    };
    
    // Use passive listeners for scroll performance where possible
    element.addEventListener('touchstart', handleTouchStart, { passive: true });
    element.addEventListener('touchmove', handleTouchMove, { passive: true });
    element.addEventListener('touchend', handleTouchEnd, { passive: true });
    
    // Return cleanup function
    return () => {
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchmove', handleTouchMove);
      element.removeEventListener('touchend', handleTouchEnd);
      
      if (longPressTimer) {
        clearTimeout(longPressTimer);
      }
      
      // Clean up touch feedback
      if ((element as any).__touchFeedbackCleanup) {
        (element as any).__touchFeedbackCleanup();
        delete (element as any).__touchFeedbackCleanup;
      }
    };
  } catch (error) {
    console.error('Failed to register gestures:', error);
    return () => {}; // Return no-op cleanup function
  }
}

/**
 * Prevents double-tap zoom on interactive elements
 * Requirement 4.6: Prevent accidental double-tap zoom
 */
export function preventDoubleTapZoom(element: HTMLElement): void {
  try {
    // Add touch-action CSS property to prevent zoom
    element.style.touchAction = 'manipulation';
    
    // Also prevent default on double-tap events
    let lastTouchEnd = 0;
    
    const handleTouchEnd = (e: TouchEvent) => {
      const now = Date.now();
      if (now - lastTouchEnd <= DOUBLE_TAP_DELAY) {
        e.preventDefault();
      }
      lastTouchEnd = now;
    };
    
    // Non-passive listener required to call preventDefault
    element.addEventListener('touchend', handleTouchEnd, { passive: false });
    
    // Store cleanup function
    (element as any).__preventZoomCleanup = () => {
      element.removeEventListener('touchend', handleTouchEnd);
      element.style.touchAction = '';
    };
  } catch (error) {
    console.error('Failed to prevent double-tap zoom:', error);
  }
}

/**
 * Creates a TouchHandler instance with all methods
 */
export function createTouchHandler(): TouchHandler {
  return {
    validateTouchTarget,
    addTouchFeedback,
    registerGestures,
    preventDoubleTapZoom,
  };
}

// Export default instance
export const touchHandler = createTouchHandler();

// Export constants for testing and configuration
export const TOUCH_CONSTANTS = {
  MIN_TOUCH_TARGET_SIZE,
  MIN_TOUCH_TARGET_SPACING,
  SWIPE_THRESHOLD,
  LONG_PRESS_DELAY,
  DOUBLE_TAP_DELAY,
  FEEDBACK_DURATION,
} as const;
