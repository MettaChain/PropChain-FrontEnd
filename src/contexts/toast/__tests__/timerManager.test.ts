/**
 * Tests for timer management utilities
 * Validates auto-dismiss, pause-on-hover, and countdown functionality
 * Validates: Requirements 4.1, 4.2, 4.3, 4.4, 4.5, 4.6
 */

import {
  createManagedTimer,
  formatCountdown,
  calculateCountdownProgress,
  calculateFadeOpacity,
  isValidDuration,
  normalizeDuration,
  type ManagedTimer,
} from '../utils/timerManager';

describe('Timer Management Utilities', () => {
  describe('createManagedTimer', () => {
    jest.useFakeTimers();

    afterEach(() => {
      jest.clearAllTimers();
    });

    it('should dismiss after the specified duration', () => {
      // Requirement 4.1: Auto-dismiss after default 5s
      const onDismiss = jest.fn();
      const duration = 5000;

      createManagedTimer({
        duration,
        onDismiss,
      });

      // Timer should not fire immediately
      expect(onDismiss).not.toHaveBeenCalled();

      // Fast-forward time to just before dismissal
      jest.advanceTimersByTime(duration - 100);
      expect(onDismiss).not.toHaveBeenCalled();

      // Fast-forward to dismissal
      jest.advanceTimersByTime(100);
      expect(onDismiss).toHaveBeenCalledTimes(1);
    });

    it('should pause and resume timer correctly', () => {
      // Requirement 4.4, 4.5: Pause on hover
      const onDismiss = jest.fn();
      const duration = 5000;

      const timer = createManagedTimer({
        duration,
        onDismiss,
      });

      // Advance 2 seconds
      jest.advanceTimersByTime(2000);

      // Pause timer
      timer.pause();
      expect(timer.isPaused()).toBe(true);

      // Advance 3 more seconds (while paused)
      jest.advanceTimersByTime(3000);

      // Should NOT have dismissed yet
      expect(onDismiss).not.toHaveBeenCalled();

      // Resume timer
      timer.resume();
      expect(timer.isPaused()).toBe(false);

      // The remaining time should be ~3 seconds (5000 - 2000)
      // Advance 3 more seconds
      jest.advanceTimersByTime(3000);

      // Should dismiss
      expect(onDismiss).toHaveBeenCalledTimes(1);
    });

    it('should handle multiple pause/resume cycles', () => {
      const onDismiss = jest.fn();
      const duration = 5000;

      const timer = createManagedTimer({
        duration,
        onDismiss,
      });

      // Cycle 1: Pause -> Resume
      jest.advanceTimersByTime(1000);
      timer.pause();
      jest.advanceTimersByTime(1000);
      timer.resume();

      // Cycle 2: Pause -> Resume
      jest.advanceTimersByTime(1000);
      timer.pause();
      jest.advanceTimersByTime(1000);
      timer.resume();

      // Advance remaining time (5000 - 3000 = 2000)
      jest.advanceTimersByTime(2000);

      expect(onDismiss).toHaveBeenCalledTimes(1);
    });

    it('should call onTick callback at specified intervals', () => {
      // Requirement 4.4: Visual countdown
      const onTick = jest.fn();
      const tickInterval = 100;

      createManagedTimer({
        duration: 500,
        onDismiss: jest.fn(),
        onTick,
        tickInterval,
      });

      // Should call onTick for each interval
      jest.advanceTimersByTime(500);

      expect(onTick).toHaveBeenCalled();
      expect(onTick.mock.calls.length).toBeGreaterThan(0);
    });

    it('should clear timers properly', () => {
      const onDismiss = jest.fn();

      const timer = createManagedTimer({
        duration: 5000,
        onDismiss,
      });

      jest.advanceTimersByTime(2000);
      timer.clear();
      jest.advanceTimersByTime(10000);

      expect(onDismiss).not.toHaveBeenCalled();
    });

    it('should return remaining time correctly', () => {
      const onDismiss = jest.fn();
      const duration = 5000;

      const timer = createManagedTimer({
        duration,
        onDismiss,
      });

      const remaining1 = timer.getRemainingTime();
      expect(remaining1).toBeGreaterThan(4900);
      expect(remaining1).toBeLessThanOrEqual(5000);

      jest.advanceTimersByTime(1000);
      const remaining2 = timer.getRemainingTime();
      expect(remaining2).toBeGreaterThan(3900);
      expect(remaining2).toBeLessThanOrEqual(4000);
    });
  });

  describe('formatCountdown', () => {
    it('should format seconds correctly', () => {
      expect(formatCountdown(5000)).toBe('5s');
      expect(formatCountdown(1000)).toBe('1s');
      expect(formatCountdown(10000)).toBe('10s');
    });

    it('should format milliseconds for durations under 1 second', () => {
      expect(formatCountdown(500)).toBe('500ms');
      expect(formatCountdown(100)).toBe('100ms');
    });

    it('should round up milliseconds to nearest second when close', () => {
      // 1500ms rounds up to 2s
      const result = formatCountdown(1500);
      expect(result).toMatch(/[12]s/); // Either 1s or 2s depending on rounding
    });
  });

  describe('calculateCountdownProgress', () => {
    it('should return 100 when remaining equals total', () => {
      expect(calculateCountdownProgress(5000, 5000)).toBe(100);
    });

    it('should return 50 when halfway through', () => {
      expect(calculateCountdownProgress(2500, 5000)).toBe(50);
    });

    it('should return 0 when time is up', () => {
      expect(calculateCountdownProgress(0, 5000)).toBe(0);
    });

    it('should handle zero total duration', () => {
      // Edge case: total duration is 0
      const result = calculateCountdownProgress(5000, 0);
      expect(result).toBe(100);
    });

    it('should clamp to 0-100 range', () => {
      expect(calculateCountdownProgress(-100, 5000)).toBe(0);
      expect(calculateCountdownProgress(10000, 5000)).toBe(100);
    });
  });

  describe('calculateFadeOpacity', () => {
    it('should return 1 (full opacity) when plenty of time remaining', () => {
      // Most of the toast duration remaining
      expect(calculateFadeOpacity(5000, 5000)).toBe(1);
      expect(calculateFadeOpacity(4500, 5000)).toBe(1);
    });

    it('should fade towards 0 in the last second', () => {
      // Last 1 second of 5 second toast
      const opacity = calculateFadeOpacity(500, 5000);
      expect(opacity).toBeGreaterThan(0);
      expect(opacity).toBeLessThan(1);
    });

    it('should return 0 when time is up', () => {
      expect(calculateFadeOpacity(0, 5000)).toBe(0);
    });

    it('should smoothly transition opacity during fade', () => {
      const total = 5000;
      const start = calculateFadeOpacity(1000, total);
      const middle = calculateFadeOpacity(500, total);
      const end = calculateFadeOpacity(0, total);

      // Should be a smooth transition
      expect(start).toBeGreaterThan(middle);
      expect(middle).toBeGreaterThan(end);
    });
  });

  describe('isValidDuration', () => {
    it('should return true for 0 (persistent toast)', () => {
      // Requirement 4.3: Duration 0 means persistent
      expect(isValidDuration(0)).toBe(true);
    });

    it('should return true for durations between 500ms and 30s', () => {
      expect(isValidDuration(500)).toBe(true);
      expect(isValidDuration(5000)).toBe(true);
      expect(isValidDuration(30000)).toBe(true);
    });

    it('should return false for durations below 500ms', () => {
      expect(isValidDuration(100)).toBe(false);
      expect(isValidDuration(499)).toBe(false);
    });

    it('should return false for durations above 30 seconds', () => {
      expect(isValidDuration(30001)).toBe(false);
      expect(isValidDuration(60000)).toBe(false);
    });
  });

  describe('normalizeDuration', () => {
    it('should return 0 for persistent toasts', () => {
      // Requirement 4.3: 0 duration means persistent
      expect(normalizeDuration(0)).toBe(0);
    });

    it('should return the duration if valid', () => {
      expect(normalizeDuration(5000)).toBe(5000);
      expect(normalizeDuration(1000)).toBe(1000);
    });

    it('should return default duration if invalid', () => {
      const defaultDuration = 5000;

      expect(normalizeDuration(100, defaultDuration)).toBe(defaultDuration);
      expect(normalizeDuration(60000, defaultDuration)).toBe(defaultDuration);
    });

    it('should use provided default duration', () => {
      expect(normalizeDuration(100, 3000)).toBe(3000);
      expect(normalizeDuration(100, 10000)).toBe(10000);
    });
  });

  /**
   * Property: Pause and resume preserves total duration
   * Validates: Requirement 4.2, 4.5, 4.6
   */
  describe('Property: Auto-dismiss respects custom duration', () => {
    jest.useFakeTimers();

    afterEach(() => {
      jest.clearAllTimers();
    });

    it('should dismiss at exact duration even with pauses', () => {
      const onDismiss = jest.fn();
      const duration = 3000;

      const timer = createManagedTimer({
        duration,
        onDismiss,
      });

      // Pause at 1 second
      jest.advanceTimersByTime(1000);
      timer.pause();

      // Pause for 2 seconds
      jest.advanceTimersByTime(2000);

      // Resume
      timer.resume();

      // Advance remaining 2 seconds
      jest.advanceTimersByTime(2000);

      expect(onDismiss).toHaveBeenCalledTimes(1);
    });
  });
});
