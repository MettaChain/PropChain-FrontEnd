/**
 * Toast Timer Management Utilities
 * Handles auto-dismiss timers, pause-on-hover, and countdown logic
 */

/**
 * Timer configuration for managing auto-dismiss behavior
 */
interface TimerConfig {
  /** Initial duration in milliseconds */
  duration: number;
  /** Callback when timer completes */
  onDismiss: () => void;
  /** Optional callback for remaining time updates (for countdown UI) */
  onTick?: (remaining: number) => void;
  /** Tick interval for countdown in milliseconds */
  tickInterval?: number;
}

/**
 * Managed timer instance with pause/resume capabilities
 */
export interface ManagedTimer {
  /** Pause the countdown timer */
  pause: () => void;
  /** Resume the countdown timer */
  resume: () => void;
  /** Completely clear and stop the timer */
  clear: () => void;
  /** Check if timer is currently paused */
  isPaused: () => boolean;
  /** Get remaining time in milliseconds */
  getRemainingTime: () => number;
}

/**
 * Creates a managed timer with pause/resume capabilities.
 * Useful for implementing pause-on-hover functionality for toasts.
 *
 * @param {TimerConfig} config - Timer configuration
 * @returns {ManagedTimer} Managed timer with pause/resume methods
 *
 * @example
 * const timer = createManagedTimer({
 *   duration: 5000,
 *   onDismiss: () => console.log('Toast dismissed'),
 *   onTick: (remaining) => console.log(`${remaining}ms remaining`),
 *   tickInterval: 100,
 * });
 *
 * // Later, pause on mouse enter
 * element.addEventListener('mouseenter', () => timer.pause());
 *
 * // Resume on mouse leave
 * element.addEventListener('mouseleave', () => timer.resume());
 *
 * // Cleanup on component unmount
 * element.addEventListener('unmount', () => timer.clear());
 */
export function createManagedTimer(config: TimerConfig): ManagedTimer {
  let remainingTime = config.duration;
  let isPaused = false;
  let mainTimeout: NodeJS.Timeout | null = null;
  let tickInterval: NodeJS.Timer | null = null;
  let pausedAt: number | null = null;

  /**
   * Start the main dismissal timer and optional tick interval
   */
  function startTimer(): void {
    if (mainTimeout) {
      clearTimeout(mainTimeout);
    }

    mainTimeout = setTimeout(() => {
      config.onDismiss();
      clear();
    }, remainingTime);

    // Start tick interval if provided
    if (config.onTick && config.tickInterval) {
      if (tickInterval) {
        clearInterval(tickInterval);
      }

      tickInterval = setInterval(() => {
        if (!isPaused) {
          remainingTime = Math.max(0, remainingTime - config.tickInterval!);
          config.onTick?.(remainingTime);

          if (remainingTime <= 0) {
            config.onDismiss();
            clear();
          }
        }
      }, config.tickInterval);
    }
  }

  /**
   * Pause the timer and save the pause timestamp
   */
  function pause(): void {
    if (isPaused) {
      return;
    }

    isPaused = true;
    pausedAt = Date.now();

    if (mainTimeout) {
      clearTimeout(mainTimeout);
      mainTimeout = null;
    }
  }

  /**
   * Resume the paused timer
   */
  function resume(): void {
    if (!isPaused || pausedAt === null) {
      return;
    }

    const pauseDuration = Date.now() - pausedAt;
    remainingTime = Math.max(0, remainingTime - pauseDuration);

    isPaused = false;
    pausedAt = null;

    if (remainingTime > 0) {
      startTimer();
    } else {
      config.onDismiss();
    }
  }

  /**
   * Clear and cleanup all timers
   */
  function clear(): void {
    if (mainTimeout) {
      clearTimeout(mainTimeout);
      mainTimeout = null;
    }

    if (tickInterval) {
      clearInterval(tickInterval);
      tickInterval = null;
    }

    isPaused = false;
    pausedAt = null;
  }

  // Start the timer
  startTimer();

  return {
    pause,
    resume,
    clear,
    isPaused: () => isPaused,
    getRemainingTime: () => Math.max(0, remainingTime),
  };
}

/**
 * Formats remaining time for display in countdown UI.
 * Converts milliseconds to human-readable format.
 *
 * @param {number} milliseconds - Remaining time in milliseconds
 * @returns {string} Formatted time string (e.g., "5s", "500ms")
 *
 * @example
 * formatCountdown(5000); // "5s"
 * formatCountdown(500);  // "500ms"
 * formatCountdown(1500); // "1s"
 */
export function formatCountdown(milliseconds: number): string {
  const seconds = Math.ceil(milliseconds / 1000);

  if (seconds >= 1) {
    return `${seconds}s`;
  }

  return `${Math.ceil(milliseconds)}ms`;
}

/**
 * Calculates the progress percentage for countdown visualization.
 * Useful for rendering progress bars or fade effects.
 *
 * @param {number} remaining - Remaining time in milliseconds
 * @param {number} total - Total duration in milliseconds
 * @returns {number} Progress percentage (0-100)
 *
 * @example
 * const progress = calculateCountdownProgress(2500, 5000);
 * // Returns 50 (50% of time remaining)
 */
export function calculateCountdownProgress(
  remaining: number,
  total: number
): number {
  if (total === 0) {
    return 100;
  }

  return Math.max(0, Math.min(100, (remaining / total) * 100));
}

/**
 * Calculates fade effect opacity based on remaining time.
 * Gradually fades the toast towards the end of its countdown.
 *
 * @param {number} remaining - Remaining time in milliseconds
 * @param {number} total - Total duration in milliseconds
 * @returns {number} Opacity value (0-1)
 *
 * @example
 * const opacity = calculateFadeOpacity(500, 5000);
 * // Returns value between 0 (fully transparent) and 1 (fully opaque)
 */
export function calculateFadeOpacity(
  remaining: number,
  total: number
): number {
  // Start fading in the last 1 second of the toast's life
  const fadeStartTime = Math.min(1000, total * 0.1);

  if (remaining > fadeStartTime) {
    return 1; // Fully opaque until fade starts
  }

  // Fade from 1 to 0 over the last second
  return Math.max(0, remaining / fadeStartTime);
}

/**
 * Validates that a duration value is reasonable for toast display.
 * Ensures duration is either 0 (persistent) or between 500ms and 30 seconds.
 *
 * @param {number} duration - Duration to validate in milliseconds
 * @returns {boolean} True if duration is valid
 *
 * @example
 * isValidDuration(5000);  // true
 * isValidDuration(0);     // true (persistent)
 * isValidDuration(100);   // false (too short)
 * isValidDuration(60000); // false (too long)
 */
export function isValidDuration(duration: number): boolean {
  if (duration === 0) {
    return true; // Persistent toast
  }

  return duration >= 500 && duration <= 30000;
}

/**
 * Normalizes a duration value to a reasonable range.
 * If duration is invalid, returns a sensible default.
 *
 * @param {number} duration - Duration to normalize in milliseconds
 * @param {number} [defaultDuration=5000] - Default duration if invalid
 * @returns {number} Normalized duration value
 *
 * @example
 * normalizeDuration(100, 5000);  // 5000 (too short, use default)
 * normalizeDuration(5000, 5000); // 5000 (valid)
 * normalizeDuration(0, 5000);    // 0 (persistent)
 */
export function normalizeDuration(
  duration: number,
  defaultDuration: number = 5000
): number {
  if (duration === 0) {
    return 0; // Persistent toast
  }

  if (!isValidDuration(duration)) {
    return defaultDuration;
  }

  return duration;
}
