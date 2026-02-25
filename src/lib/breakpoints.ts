/**
 * Breakpoint Manager
 * 
 * Centralized breakpoint definition and viewport size detection system.
 * Provides utility functions for components to query current viewport size
 * and subscribe to breakpoint changes.
 * 
 * Requirements: 2.1, 2.2, 2.3, 2.4, 2.5
 */

// Define critical breakpoints (in pixels)
export const BREAKPOINTS = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
} as const;

export type Breakpoint = keyof typeof BREAKPOINTS;
export type ViewportCategory = 'mobile' | 'tablet' | 'desktop';

export interface BreakpointManager {
  getViewportCategory(): ViewportCategory;
  isAbove(breakpoint: Breakpoint): boolean;
  isBelow(breakpoint: Breakpoint): boolean;
  isBetween(min: Breakpoint, max: Breakpoint): boolean;
  subscribe(callback: (category: ViewportCategory) => void): () => void;
}

/**
 * Get the current viewport width
 * Returns 0 during SSR or if window is not available
 */
function getViewportWidth(): number {
  if (typeof window === 'undefined') {
    return 0;
  }
  return window.innerWidth;
}

/**
 * Determine viewport category based on width
 * - mobile: < 768px
 * - tablet: 768px - 1023px
 * - desktop: >= 1024px
 */
export function getViewportCategory(): ViewportCategory {
  const width = getViewportWidth();
  
  // SSR safe: default to mobile
  if (width === 0) {
    return 'mobile';
  }
  
  if (width < BREAKPOINTS.md) {
    return 'mobile';
  }
  
  if (width < BREAKPOINTS.lg) {
    return 'tablet';
  }
  
  return 'desktop';
}

/**
 * Check if viewport is at or above a breakpoint
 */
export function isAbove(breakpoint: Breakpoint): boolean {
  const width = getViewportWidth();
  
  // SSR safe: default to false
  if (width === 0) {
    return false;
  }
  
  return width >= BREAKPOINTS[breakpoint];
}

/**
 * Check if viewport is below a breakpoint
 */
export function isBelow(breakpoint: Breakpoint): boolean {
  const width = getViewportWidth();
  
  // SSR safe: default to true (mobile-first)
  if (width === 0) {
    return true;
  }
  
  return width < BREAKPOINTS[breakpoint];
}

/**
 * Check if viewport is between two breakpoints (inclusive)
 */
export function isBetween(min: Breakpoint, max: Breakpoint): boolean {
  const width = getViewportWidth();
  
  // SSR safe: default to false
  if (width === 0) {
    return false;
  }
  
  const minWidth = BREAKPOINTS[min];
  const maxWidth = BREAKPOINTS[max];
  
  return width >= minWidth && width <= maxWidth;
}

/**
 * Subscribe to viewport category changes
 * Uses matchMedia API for efficient monitoring with 16ms debounce
 * 
 * @param callback - Function to call when viewport category changes
 * @returns Cleanup function to unsubscribe
 */
export function subscribe(
  callback: (category: ViewportCategory) => void
): () => void {
  // SSR safe: return no-op cleanup function
  if (typeof window === 'undefined') {
    return () => {};
  }
  
  let currentCategory = getViewportCategory();
  let debounceTimeout: NodeJS.Timeout | null = null;
  
  // Debounced handler to prevent excessive callbacks
  const handleResize = () => {
    if (debounceTimeout) {
      clearTimeout(debounceTimeout);
    }
    
    debounceTimeout = setTimeout(() => {
      const newCategory = getViewportCategory();
      
      // Only call callback if category actually changed
      if (newCategory !== currentCategory) {
        currentCategory = newCategory;
        
        try {
          callback(newCategory);
        } catch (error) {
          console.error('Error in breakpoint change callback:', error);
        }
      }
    }, 16); // 16ms debounce (~60fps)
  };
  
  // Use matchMedia for efficient viewport monitoring
  const mediaQueries = [
    window.matchMedia(`(max-width: ${BREAKPOINTS.md - 1}px)`), // mobile
    window.matchMedia(`(min-width: ${BREAKPOINTS.md}px) and (max-width: ${BREAKPOINTS.lg - 1}px)`), // tablet
    window.matchMedia(`(min-width: ${BREAKPOINTS.lg}px)`), // desktop
  ];
  
  // Add listeners to all media queries
  mediaQueries.forEach(mq => {
    // Modern browsers
    if (mq.addEventListener) {
      mq.addEventListener('change', handleResize);
    } else {
      // Fallback for older browsers
      mq.addListener(handleResize);
    }
  });
  
  // Cleanup function
  return () => {
    if (debounceTimeout) {
      clearTimeout(debounceTimeout);
    }
    
    mediaQueries.forEach(mq => {
      // Modern browsers
      if (mq.removeEventListener) {
        mq.removeEventListener('change', handleResize);
      } else {
        // Fallback for older browsers
        mq.removeListener(handleResize);
      }
    });
  };
}

/**
 * Create a BreakpointManager instance
 * This provides a unified interface for all breakpoint operations
 */
export function createBreakpointManager(): BreakpointManager {
  return {
    getViewportCategory,
    isAbove,
    isBelow,
    isBetween,
    subscribe,
  };
}

/**
 * Export CSS custom properties for breakpoint values
 * These can be used in CSS files for consistent breakpoint usage
 */
export const CSS_BREAKPOINTS = {
  '--breakpoint-sm': `${BREAKPOINTS.sm}px`,
  '--breakpoint-md': `${BREAKPOINTS.md}px`,
  '--breakpoint-lg': `${BREAKPOINTS.lg}px`,
  '--breakpoint-xl': `${BREAKPOINTS.xl}px`,
} as const;

/**
 * Helper function to inject CSS custom properties into the document
 * Call this once during app initialization
 */
export function injectBreakpointCSSVariables(): void {
  if (typeof document === 'undefined') {
    return;
  }
  
  const root = document.documentElement;
  
  Object.entries(CSS_BREAKPOINTS).forEach(([key, value]) => {
    root.style.setProperty(key, value);
  });
}

// Default export: singleton instance
export default createBreakpointManager();
