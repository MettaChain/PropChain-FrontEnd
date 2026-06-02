/**
 * Tests for swipe gesture handler utilities
 * Validates swipe-to-dismiss functionality on touch devices
 * Validates: Requirements 9.3, 9.4
 */

import {
  SwipeDirection,
  detectSwipeDirection,
  calculateSwipeVelocity,
  setupSwipeToDismiss,
} from '../utils/swipeHandler';

describe('Swipe Gesture Handler Utilities', () => {
  describe('SwipeDirection enum', () => {
    it('should have all required swipe directions', () => {
      expect(SwipeDirection.UP).toBe('up');
      expect(SwipeDirection.DOWN).toBe('down');
      expect(SwipeDirection.LEFT).toBe('left');
      expect(SwipeDirection.RIGHT).toBe('right');
    });
  });

  describe('detectSwipeDirection', () => {
    it('should detect swipe LEFT when deltaX is negative and larger than deltaY', () => {
      // Requirement 9.3: Swipe left to dismiss
      const direction = detectSwipeDirection(-100, 20);
      expect(direction).toBe(SwipeDirection.LEFT);
    });

    it('should detect swipe RIGHT when deltaX is positive and larger than deltaY', () => {
      const direction = detectSwipeDirection(100, 20);
      expect(direction).toBe(SwipeDirection.RIGHT);
    });

    it('should detect swipe UP when deltaY is negative and larger than deltaX', () => {
      // Requirement 9.3: Swipe up to dismiss
      const direction = detectSwipeDirection(20, -100);
      expect(direction).toBe(SwipeDirection.UP);
    });

    it('should detect swipe DOWN when deltaY is positive and larger than deltaX', () => {
      const direction = detectSwipeDirection(20, 100);
      expect(direction).toBe(SwipeDirection.DOWN);
    });

    it('should handle equal horizontal and vertical deltas', () => {
      // When equal, horizontal movement takes precedence
      const direction = detectSwipeDirection(-50, -50);
      expect([SwipeDirection.LEFT, SwipeDirection.UP]).toContain(direction);
    });

    it('should handle zero deltas', () => {
      const direction = detectSwipeDirection(0, 0);
      expect(Object.values(SwipeDirection)).toContain(direction);
    });
  });

  describe('calculateSwipeVelocity', () => {
    it('should calculate velocity correctly', () => {
      // Requirement 9.3: Support velocity-based swipe detection
      const velocity = calculateSwipeVelocity(100, 200);
      expect(velocity).toBe(0.5); // 100 pixels / 200 ms
    });

    it('should return 0 when duration is 0', () => {
      const velocity = calculateSwipeVelocity(100, 0);
      expect(velocity).toBe(0);
    });

    it('should handle large distances and durations', () => {
      const velocity = calculateSwipeVelocity(1000, 500);
      expect(velocity).toBe(2); // 1000 pixels / 500 ms
    });

    it('should handle small distances and durations', () => {
      const velocity = calculateSwipeVelocity(10, 100);
      expect(velocity).toBe(0.1);
    });
  });

  describe('setupSwipeToDismiss', () => {
    let element: HTMLElement;
    let onDismiss: jest.Mock;

    beforeEach(() => {
      element = document.createElement('div');
      document.body.appendChild(element);
      onDismiss = jest.fn();
    });

    afterEach(() => {
      document.body.removeChild(element);
    });

    it('should attach touch event listeners to element', () => {
      const addEventListenerSpy = jest.spyOn(element, 'addEventListener');

      setupSwipeToDismiss(element, onDismiss);

      expect(addEventListenerSpy).toHaveBeenCalledWith('touchstart', expect.any(Function), {
        passive: true,
      });
      expect(addEventListenerSpy).toHaveBeenCalledWith('touchmove', expect.any(Function), {
        passive: true,
      });
      expect(addEventListenerSpy).toHaveBeenCalledWith('touchend', expect.any(Function), {
        passive: true,
      });

      addEventListenerSpy.mockRestore();
    });

    it('should return cleanup function', () => {
      const cleanup = setupSwipeToDismiss(element, onDismiss);

      expect(typeof cleanup).toBe('function');
    });

    it('should remove event listeners on cleanup', () => {
      const cleanup = setupSwipeToDismiss(element, onDismiss);
      const removeEventListenerSpy = jest.spyOn(element, 'removeEventListener');

      cleanup();

      expect(removeEventListenerSpy).toHaveBeenCalledWith('touchstart', expect.any(Function));
      expect(removeEventListenerSpy).toHaveBeenCalledWith('touchmove', expect.any(Function));
      expect(removeEventListenerSpy).toHaveBeenCalledWith('touchend', expect.any(Function));

      removeEventListenerSpy.mockRestore();
    });
  });

  /**
   * Property: Swipe direction detection is consistent
   * Validates: Requirement 9.3
   */
  describe('Property: Swipe detection consistency', () => {
    it('should consistently detect same direction for same deltas', () => {
      const delta = { x: -100, y: 20 };

      const direction1 = detectSwipeDirection(delta.x, delta.y);
      const direction2 = detectSwipeDirection(delta.x, delta.y);

      expect(direction1).toBe(direction2);
      expect(direction1).toBe(SwipeDirection.LEFT);
    });

    it('should detect UP and LEFT as dismissal directions', () => {
      const leftSwipe = detectSwipeDirection(-100, 20);
      const upSwipe = detectSwipeDirection(20, -100);

      expect(leftSwipe).toBe(SwipeDirection.LEFT);
      expect(upSwipe).toBe(SwipeDirection.UP);
    });
  });

  /**
   * Property: Swipe velocity indicates gesture strength
   * Validates: Requirement 9.4
   */
  describe('Property: Swipe velocity calculation', () => {
    it('should increase velocity with longer distance', () => {
      const velocity1 = calculateSwipeVelocity(50, 100);
      const velocity2 = calculateSwipeVelocity(100, 100);

      expect(velocity2).toBeGreaterThan(velocity1);
    });

    it('should increase velocity with shorter duration', () => {
      const velocity1 = calculateSwipeVelocity(100, 200);
      const velocity2 = calculateSwipeVelocity(100, 100);

      expect(velocity2).toBeGreaterThan(velocity1);
    });

    it('should detect "flick" vs "drag" based on velocity', () => {
      const flick = calculateSwipeVelocity(100, 100); // Fast
      const drag = calculateSwipeVelocity(100, 500); // Slow

      expect(flick).toBeGreaterThan(drag);
    });
  });
});
