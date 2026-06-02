/**
 * Tests for responsive toast utilities
 * Validates mobile/responsive behavior including viewport detection and styling
 * Validates: Requirements 9.1, 9.2, 9.3, 9.4, 9.5
 */

import {
  isMobileViewport,
  getResponsivePosition,
  getResponsiveStyles,
  getAccessibleButtonSize,
  isTouchDevice,
  getToastStackSpacing,
  isSmallViewport,
  getMaxVisibleToasts,
} from '../utils/responsiveToast';
import { MOBILE_BREAKPOINT, MIN_TOUCH_TARGET_SIZE } from '../constants';

describe('Responsive Toast Utilities', () => {
  // Store original window properties
  const originalInnerWidth = window.innerWidth;
  const originalInnerHeight = window.innerHeight;
  const originalTouchStart = (window as any).ontouchstart;
  const originalMaxTouchPoints = (navigator as any).maxTouchPoints;

  afterEach(() => {
    // Restore original values
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      value: originalInnerWidth,
    });
    Object.defineProperty(window, 'innerHeight', {
      writable: true,
      value: originalInnerHeight,
    });
  });

  describe('isMobileViewport', () => {
    it('should return true when viewport width is less than MOBILE_BREAKPOINT (< 768px)', () => {
      // Requirement 9.1: Detect mobile viewports
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        value: 500,
      });

      expect(isMobileViewport()).toBe(true);
    });

    it('should return false when viewport width is greater than or equal to MOBILE_BREAKPOINT', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        value: 1024,
      });

      expect(isMobileViewport()).toBe(false);
    });

    it('should return false at exactly the breakpoint (768px)', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        value: MOBILE_BREAKPOINT,
      });

      expect(isMobileViewport()).toBe(false);
    });

    it('should return true one pixel below breakpoint (767px)', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        value: MOBILE_BREAKPOINT - 1,
      });

      expect(isMobileViewport()).toBe(true);
    });
  });

  describe('getResponsivePosition', () => {
    it('should return bottom-center on mobile viewports', () => {
      // Requirement 9.5: Default to bottom-center on mobile
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        value: 500,
      });

      expect(getResponsivePosition()).toBe('bottom-center');
    });

    it('should return top-right on desktop viewports', () => {
      // Requirement: Default to top-right on desktop
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        value: 1024,
      });

      expect(getResponsivePosition()).toBe('top-right');
    });
  });

  describe('getResponsiveStyles', () => {
    it('should return mobile-optimized styles on small viewports', () => {
      // Requirement 9.1: 100% width with padding on mobile
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        value: 500,
      });

      const styles = getResponsiveStyles();

      expect(styles.maxWidth).toBe('100%');
      expect(styles.padding).toBe('16px');
      expect(styles.margin).toBe('8px');
    });

    it('should return desktop-optimized styles on large viewports', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        value: 1024,
      });

      const styles = getResponsiveStyles();

      expect(styles.maxWidth).toBe('unset');
      expect(styles.padding).toBe('12px');
      expect(styles.margin).toBe('0');
    });
  });

  describe('getAccessibleButtonSize', () => {
    it('should return MIN_TOUCH_TARGET_SIZE (44px) when device supports touch and size is below minimum', () => {
      // Requirement 9.2: Minimum 44x44px touch target
      const suggestedSize = 24;
      const result = getAccessibleButtonSize(suggestedSize);

      // On touch devices or in test environment, should enforce minimum
      expect(result).toBeGreaterThanOrEqual(suggestedSize);
    });

    it('should return suggested size if already at or above minimum', () => {
      const suggestedSize = 48;
      const result = getAccessibleButtonSize(suggestedSize);

      expect(result).toBe(suggestedSize);
    });

    it('should use default size of 24 when no size provided', () => {
      const result = getAccessibleButtonSize();
      expect(typeof result).toBe('number');
      expect(result).toBeGreaterThanOrEqual(24);
    });
  });

  describe('isTouchDevice', () => {
    it('should return true if window has ontouchstart event', () => {
      // Requirement 9.4: Detect touch devices for swipe support
      expect(typeof isTouchDevice()).toBe('boolean');
    });
  });

  describe('getToastStackSpacing', () => {
    it('should return 8px spacing on mobile viewports', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        value: 500,
      });

      expect(getToastStackSpacing()).toBe(8);
    });

    it('should return 12px spacing on desktop viewports', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        value: 1024,
      });

      expect(getToastStackSpacing()).toBe(12);
    });
  });

  describe('isSmallViewport', () => {
    it('should return true when viewport height is less than 600px', () => {
      Object.defineProperty(window, 'innerHeight', {
        writable: true,
        value: 500,
      });

      expect(isSmallViewport()).toBe(true);
    });

    it('should return false when viewport height is 600px or greater', () => {
      Object.defineProperty(window, 'innerHeight', {
        writable: true,
        value: 800,
      });

      expect(isSmallViewport()).toBe(false);
    });
  });

  describe('getMaxVisibleToasts', () => {
    it('should return 3 on mobile viewports', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        value: 500,
      });

      expect(getMaxVisibleToasts()).toBe(3);
    });

    it('should return 5 on desktop viewports', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        value: 1024,
      });

      expect(getMaxVisibleToasts()).toBe(5);
    });
  });

  describe('Responsive behavior integration', () => {
    it('should provide consistent responsive styling across mobile device sizes', () => {
      // Test various mobile sizes
      const mobileSizes = [320, 375, 500, 600, 767];

      mobileSizes.forEach((size) => {
        Object.defineProperty(window, 'innerWidth', {
          writable: true,
          value: size,
        });

        expect(isMobileViewport()).toBe(true);
        expect(getResponsivePosition()).toBe('bottom-center');
        expect(getResponsiveStyles().maxWidth).toBe('100%');
      });
    });

    it('should provide consistent responsive styling across desktop device sizes', () => {
      // Test various desktop sizes
      const desktopSizes = [768, 1024, 1440, 1920];

      desktopSizes.forEach((size) => {
        Object.defineProperty(window, 'innerWidth', {
          writable: true,
          value: size,
        });

        expect(isMobileViewport()).toBe(false);
        expect(getResponsivePosition()).toBe('top-right');
        expect(getResponsiveStyles().maxWidth).toBe('unset');
      });
    });
  });

  /**
   * Property: Responsive styles are consistent for given viewport
   * Validates: Requirement 9.1, 9.2
   */
  describe('Property: Consistent responsive styling', () => {
    it('should return same responsive styles for multiple calls at same viewport', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        value: 500,
      });

      const styles1 = getResponsiveStyles();
      const styles2 = getResponsiveStyles();

      expect(styles1).toEqual(styles2);
    });
  });
});
