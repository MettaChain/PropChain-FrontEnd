/**
 * Viewport Provider
 * 
 * React Context provider for viewport state management.
 * Provides comprehensive viewport information to all child components.
 * 
 * Features:
 * - SSR-safe defaults
 * - Client-side hydration updates
 * - ResizeObserver for accurate viewport tracking
 * - Memoized context value to prevent unnecessary re-renders
 * 
 * Requirements: 2.2, 2.3
 */

'use client';

import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import { 
  getViewportCategory, 
  BREAKPOINTS, 
  type ViewportCategory, 
  type Breakpoint 
} from '@/lib/breakpoints';

export interface ViewportContext {
  width: number;
  height: number;
  category: ViewportCategory;
  breakpoint: Breakpoint;
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  orientation: 'portrait' | 'landscape';
}

// SSR-safe default values (mobile-first)
const DEFAULT_VIEWPORT: ViewportContext = {
  width: 0,
  height: 0,
  category: 'mobile',
  breakpoint: 'sm',
  isMobile: true,
  isTablet: false,
  isDesktop: false,
  orientation: 'portrait',
};

const ViewportContext = createContext<ViewportContext>(DEFAULT_VIEWPORT);

export interface ViewportProviderProps {
  children: React.ReactNode;
}

/**
 * Determine the current breakpoint based on viewport width
 */
function getCurrentBreakpoint(width: number): Breakpoint {
  if (width >= BREAKPOINTS.xl) return 'xl';
  if (width >= BREAKPOINTS.lg) return 'lg';
  if (width >= BREAKPOINTS.md) return 'md';
  return 'sm';
}

/**
 * Determine orientation based on viewport dimensions
 */
function getOrientation(width: number, height: number): 'portrait' | 'landscape' {
  return height > width ? 'portrait' : 'landscape';
}

/**
 * Get current viewport state from window dimensions
 */
function getViewportState(): ViewportContext {
  // SSR safe: return defaults if window is not available
  if (typeof window === 'undefined') {
    return DEFAULT_VIEWPORT;
  }

  const width = window.innerWidth;
  const height = window.innerHeight;
  const category = getViewportCategory();
  const breakpoint = getCurrentBreakpoint(width);
  const orientation = getOrientation(width, height);

  return {
    width,
    height,
    category,
    breakpoint,
    isMobile: category === 'mobile',
    isTablet: category === 'tablet',
    isDesktop: category === 'desktop',
    orientation,
  };
}

export function ViewportProvider({ children }: ViewportProviderProps) {
  // Initialize with SSR-safe defaults
  const [viewport, setViewport] = useState<ViewportContext>(DEFAULT_VIEWPORT);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    // Client-side hydration: update with actual viewport dimensions
    setViewport(getViewportState());
    setIsHydrated(true);

    // Use ResizeObserver for accurate viewport tracking
    let resizeObserver: ResizeObserver | null = null;
    let debounceTimeout: NodeJS.Timeout | null = null;

    try {
      // ResizeObserver provides more accurate tracking than window resize events
      resizeObserver = new ResizeObserver((entries) => {
        // Debounce updates to prevent excessive re-renders (16ms = ~60fps)
        if (debounceTimeout) {
          clearTimeout(debounceTimeout);
        }

        debounceTimeout = setTimeout(() => {
          const newViewport = getViewportState();
          
          // Only update if viewport actually changed
          setViewport((prev) => {
            // Check if any value changed
            if (
              prev.width !== newViewport.width ||
              prev.height !== newViewport.height ||
              prev.category !== newViewport.category ||
              prev.breakpoint !== newViewport.breakpoint ||
              prev.orientation !== newViewport.orientation
            ) {
              return newViewport;
            }
            return prev;
          });
        }, 16);
      });

      // Observe the document element for size changes
      resizeObserver.observe(document.documentElement);
    } catch (error) {
      // Fallback to window resize event if ResizeObserver is not supported
      console.warn('ResizeObserver not supported, falling back to resize event:', error);
      
      const handleResize = () => {
        if (debounceTimeout) {
          clearTimeout(debounceTimeout);
        }

        debounceTimeout = setTimeout(() => {
          setViewport(getViewportState());
        }, 16);
      };

      window.addEventListener('resize', handleResize);

      // Return cleanup function for fallback
      return () => {
        if (debounceTimeout) {
          clearTimeout(debounceTimeout);
        }
        window.removeEventListener('resize', handleResize);
      };
    }

    // Cleanup function
    return () => {
      if (debounceTimeout) {
        clearTimeout(debounceTimeout);
      }
      if (resizeObserver) {
        resizeObserver.disconnect();
      }
    };
  }, []);

  // Memoize context value to prevent unnecessary re-renders
  // Only re-create the value object when viewport state actually changes
  const contextValue = useMemo(() => viewport, [
    viewport.width,
    viewport.height,
    viewport.category,
    viewport.breakpoint,
    viewport.orientation,
  ]);

  return (
    <ViewportContext.Provider value={contextValue}>
      {children}
    </ViewportContext.Provider>
  );
}

/**
 * Hook to access viewport context
 * 
 * @throws Error if used outside of ViewportProvider
 * @returns Current viewport state
 * 
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { isMobile, width, category } = useViewport();
 *   
 *   return (
 *     <div>
 *       {isMobile ? <MobileView /> : <DesktopView />}
 *       <p>Width: {width}px, Category: {category}</p>
 *     </div>
 *   );
 * }
 * ```
 */
export function useViewport(): ViewportContext {
  const context = useContext(ViewportContext);
  
  if (!context) {
    throw new Error('useViewport must be used within a ViewportProvider');
  }
  
  return context;
}

// Export the context for testing purposes
export { ViewportContext as ViewportContextInstance };
