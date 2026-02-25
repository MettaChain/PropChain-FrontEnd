# Design Document: Mobile Responsiveness Improvements

## Overview

This design establishes a comprehensive responsive design system for the PropChain Next.js application. The system addresses current inconsistencies in mobile rendering, implements standardized breakpoints, optimizes touch interactions, and ensures feature parity across all device sizes.

### Current State

The application has:
- Basic mobile detection utilities (`src/utils/mobileDetection.ts`)
- A single mobile hook (`src/hooks/use-mobile.ts`) with hardcoded 768px breakpoint
- Mobile-specific CSS (`src/styles/mobile.css`) with touch interactions and gestures
- Mobile-specific components (AR preview, location-based discovery)
- Tailwind CSS v4 with inline theme configuration
- shadcn/ui component library

### Problems Addressed

1. **Inconsistent Breakpoints**: Components use different breakpoint values, leading to layout inconsistencies
2. **Poor Mobile Performance**: Large images and unoptimized assets slow mobile load times
3. **Touch Interaction Issues**: Some interactive elements are too small for comfortable touch input
4. **Layout Overflow**: Certain components cause horizontal scrolling on mobile devices
5. **Feature Gaps**: Some desktop features lack mobile-optimized equivalents

### Design Goals

1. Establish a unified breakpoint system across all components
2. Optimize performance for mobile networks (target: <1.8s FCP on 3G)
3. Ensure all interactive elements meet 44x44px minimum touch target size
4. Implement fluid layouts that eliminate horizontal overflow
5. Achieve feature parity with mobile-optimized UX patterns
6. Maintain accessibility compliance across all viewport sizes

## Architecture

### System Components

```
┌─────────────────────────────────────────────────────────────┐
│                     Application Layer                        │
│  (Pages, Features, Business Logic)                          │
└────────────────┬────────────────────────────────────────────┘
                 │
┌────────────────┴────────────────────────────────────────────┐
│              Responsive System Layer                         │
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │  Breakpoint  │  │    Touch     │  │   Mobile     │     │
│  │   Manager    │  │   Handler    │  │  Optimizer   │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │   Viewport   │  │   Gesture    │  │    Image     │     │
│  │   Provider   │  │   System     │  │   Service    │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└────────────────┬────────────────────────────────────────────┘
                 │
┌────────────────┴────────────────────────────────────────────┐
│                  Infrastructure Layer                        │
│  (React Context, Hooks, CSS Variables, Service Worker)      │
└──────────────────────────────────────────────────────────────┘
```

### Architectural Principles

1. **Progressive Enhancement**: Core functionality works on all devices; enhanced features activate based on capability detection
2. **Mobile-First Design**: Styles and logic start with mobile constraints, then enhance for larger screens
3. **Performance Budget**: Strict limits on bundle size, image payload, and render time for mobile
4. **Separation of Concerns**: Breakpoint logic, touch handling, and optimization are independent systems
5. **Testability**: All responsive behaviors are testable through property-based tests

## Components and Interfaces

### 1. Breakpoint Manager

**Purpose**: Centralized breakpoint definition and viewport size detection

**Location**: `src/lib/breakpoints.ts`

**Interface**:
```typescript
export const BREAKPOINTS = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
} as const;

export type Breakpoint = keyof typeof BREAKPOINTS;
export type ViewportCategory = 'mobile' | 'tablet' | 'desktop';

export interface BreakpointManager {
  // Get current viewport category
  getViewportCategory(): ViewportCategory;
  
  // Check if viewport is at or above a breakpoint
  isAbove(breakpoint: Breakpoint): boolean;
  
  // Check if viewport is below a breakpoint
  isBelow(breakpoint: Breakpoint): boolean;
  
  // Check if viewport is between two breakpoints
  isBetween(min: Breakpoint, max: Breakpoint): boolean;
  
  // Subscribe to breakpoint changes
  subscribe(callback: (category: ViewportCategory) => void): () => void;
}
```

**Implementation Strategy**:
- Use CSS custom properties for breakpoint values
- Implement React hook `useBreakpoint()` for component-level detection
- Use `matchMedia` API for efficient viewport monitoring
- Debounce resize events to prevent excessive re-renders (16ms threshold)

### 2. Viewport Provider

**Purpose**: React Context provider for viewport state management

**Location**: `src/providers/ViewportProvider.tsx`

**Interface**:
```typescript
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

export const ViewportProvider: React.FC<{ children: React.ReactNode }>;
export const useViewport: () => ViewportContext;
```

**Implementation Strategy**:
- Initialize with server-side safe defaults
- Update on client-side hydration
- Use ResizeObserver for accurate viewport tracking
- Memoize context value to prevent unnecessary re-renders

### 3. Touch Handler

**Purpose**: Unified touch interaction and gesture management

**Location**: `src/lib/touch.ts`

**Interface**:
```typescript
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
  // Validate touch target size
  validateTouchTarget(element: HTMLElement): boolean;
  
  // Add touch feedback
  addTouchFeedback(element: HTMLElement): void;
  
  // Register gesture handlers
  registerGestures(element: HTMLElement, config: GestureConfig): () => void;
  
  // Prevent double-tap zoom
  preventDoubleTapZoom(element: HTMLElement): void;
}
```

**Implementation Strategy**:
- Extend existing `useGestures` hook with validation
- Add visual feedback within 100ms of touch
- Use passive event listeners for scroll performance
- Implement haptic feedback API where supported

### 4. Mobile Optimizer

**Purpose**: Asset optimization and performance management for mobile devices

**Location**: `src/lib/mobile-optimizer.ts`

**Interface**:
```typescript
export interface ImageOptimizationConfig {
  devicePixelRatio: number;
  viewportWidth: number;
  connectionSpeed: 'slow-2g' | '2g' | '3g' | '4g' | 'unknown';
}

export interface MobileOptimizer {
  // Get optimized image source
  getOptimizedImageSrc(
    src: string,
    config: ImageOptimizationConfig
  ): string;
  
  // Preload critical resources
  preloadCriticalResources(urls: string[]): void;
  
  // Lazy load images
  setupLazyLoading(container: HTMLElement): void;
  
  // Monitor performance metrics
  getPerformanceMetrics(): {
    fcp: number;
    lcp: number;
    cls: number;
    fid: number;
  };
}
```

**Implementation Strategy**:
- Use Next.js Image component with responsive sizes
- Implement Network Information API for adaptive loading
- Configure service worker for asset caching
- Use Intersection Observer for lazy loading

### 5. Responsive Layout System

**Purpose**: Fluid layout components that adapt to viewport size

**Location**: `src/components/responsive/`

**Components**:
```typescript
// Container with responsive padding
export const ResponsiveContainer: React.FC<{
  children: React.ReactNode;
  className?: string;
}>;

// Grid that adapts column count
export const ResponsiveGrid: React.FC<{
  children: React.ReactNode;
  minColumnWidth?: number;
  gap?: number;
}>;

// Stack that switches between horizontal and vertical
export const ResponsiveStack: React.FC<{
  children: React.ReactNode;
  direction?: 'row' | 'column';
  breakpoint?: Breakpoint;
}>;

// Typography that scales with viewport
export const ResponsiveText: React.FC<{
  children: React.ReactNode;
  variant: 'body' | 'heading' | 'caption';
  as?: React.ElementType;
}>;
```

### 6. Mobile-Specific UX Components

**Purpose**: Mobile-optimized UI patterns

**Location**: `src/components/mobile-ux/`

**Components**:
```typescript
// Hamburger menu with slide-out drawer
export const MobileNavigation: React.FC<{
  items: NavigationItem[];
}>;

// Bottom navigation bar
export const BottomNav: React.FC<{
  items: BottomNavItem[];
  activeItem: string;
}>;

// Bottom sheet modal
export const BottomSheet: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
}>;

// Swipeable tabs
export const SwipeableTabs: React.FC<{
  tabs: TabConfig[];
  activeTab: string;
  onTabChange: (tab: string) => void;
}>;

// Pull-to-refresh
export const PullToRefresh: React.FC<{
  onRefresh: () => Promise<void>;
  children: React.ReactNode;
}>;
```

## Data Models

### Viewport State

```typescript
interface ViewportState {
  width: number;
  height: number;
  category: 'mobile' | 'tablet' | 'desktop';
  breakpoint: 'sm' | 'md' | 'lg' | 'xl';
  orientation: 'portrait' | 'landscape';
  pixelRatio: number;
  hasTouch: boolean;
  connectionSpeed: 'slow-2g' | '2g' | '3g' | '4g' | 'unknown';
}
```

### Touch Event Data

```typescript
interface TouchEventData {
  type: 'tap' | 'swipe' | 'longpress' | 'pinch' | 'doubletap';
  timestamp: number;
  target: HTMLElement;
  coordinates: { x: number; y: number };
  direction?: 'left' | 'right' | 'up' | 'down';
  distance?: number;
  scale?: number;
}
```

### Performance Metrics

```typescript
interface PerformanceMetrics {
  // Core Web Vitals
  fcp: number;  // First Contentful Paint
  lcp: number;  // Largest Contentful Paint
  cls: number;  // Cumulative Layout Shift
  fid: number;  // First Input Delay
  
  // Custom metrics
  tti: number;  // Time to Interactive
  tbt: number;  // Total Blocking Time
  
  // Resource metrics
  jsSize: number;
  cssSize: number;
  imageSize: number;
  totalSize: number;
  
  // Network metrics
  connectionType: string;
  effectiveType: string;
  downlink: number;
  rtt: number;
}
```

### Image Optimization Config

```typescript
interface ImageConfig {
  src: string;
  alt: string;
  sizes: {
    mobile: number;   // Width for mobile viewport
    tablet: number;   // Width for tablet viewport
    desktop: number;  // Width for desktop viewport
  };
  priority?: boolean;  // Preload this image
  quality?: number;    // Image quality (1-100)
  formats?: ('webp' | 'avif' | 'jpeg' | 'png')[];
}
```

### Responsive Component Config

```typescript
interface ResponsiveConfig {
  // Breakpoint-specific values
  values: {
    mobile?: any;
    tablet?: any;
    desktop?: any;
  };
  
  // Fluid scaling between breakpoints
  fluid?: {
    min: number;
    max: number;
    minViewport: number;
    maxViewport: number;
  };
}
```


## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property Reflection

After analyzing all acceptance criteria, I identified the following redundancies and consolidations:

**Redundancy Analysis**:
1. Properties 4.1 and 8.6 both test touch target sizing - can be combined into a comprehensive touch target validation property
2. Properties 3.1 and 3.4 both test layout constraints - can be combined into a comprehensive layout validation property
3. Properties 5.1, 5.2, 5.3, and 5.4 all test image optimization - can be combined into fewer comprehensive properties
4. Properties 4.3, 4.4, 4.5, 4.6, and 4.7 all test gesture handling - can be consolidated into gesture behavior properties

**Consolidated Properties**:
- Touch target validation: Combines size requirements (44x44px) and spacing requirements (8px)
- Image optimization: Combines responsive sizing, lazy loading, and format optimization
- Gesture handling: Combines swipe, pull-to-refresh, tap, and long-press behaviors

### Property 1: Breakpoint Manager Returns Accurate Viewport Information

*For any* viewport width, when querying the Breakpoint Manager for the current viewport category, the returned category should accurately reflect whether the width is mobile (<768px), tablet (768-1024px), or desktop (≥1024px).

**Validates: Requirements 2.2**

### Property 2: No Horizontal Overflow on Mobile

*For any* page rendered at mobile viewport width (<768px), the content width should not exceed the viewport width, ensuring no horizontal scrolling is required.

**Validates: Requirements 3.1**

### Property 3: Typography and Spacing Scale Proportionally

*For any* viewport width between two consecutive breakpoints, the computed font sizes, padding, and margin values should scale proportionally according to the fluid scaling formula: `min + (max - min) * (viewport - minViewport) / (maxViewport - minViewport)`.

**Validates: Requirements 3.2, 8.5**

### Property 4: Readable Line Lengths Maintained

*For any* viewport size, text content line lengths should be between 45 and 75 characters, ensuring optimal readability.

**Validates: Requirements 3.4**

### Property 5: Touch Targets Meet Minimum Size and Spacing

*For any* interactive element in mobile viewport, the element dimensions should be at least 44x44 pixels, and the spacing between adjacent interactive elements should be at least 8 pixels.

**Validates: Requirements 4.1, 8.6**

### Property 6: Swipe Gestures Navigate Content

*For any* swipeable content container (property listings, image galleries), a swipe gesture in a given direction should navigate to the adjacent content item in that direction.

**Validates: Requirements 4.3**

### Property 7: Pull-to-Refresh Triggers Refresh

*For any* scrollable content list, when the user pulls down from the top of the list beyond a threshold, the refresh callback should be invoked.

**Validates: Requirements 4.4**

### Property 8: Tap Toggles Expandable Sections

*For any* expandable section, a tap gesture should toggle the section between expanded and collapsed states.

**Validates: Requirements 4.5**

### Property 9: Double-Tap Zoom Prevented on Interactive Elements

*For any* interactive element, double-tap events should not trigger browser zoom behavior.

**Validates: Requirements 4.6**

### Property 10: Long-Press Displays Contextual Actions

*For any* property card, a long-press gesture should display contextual action menu.

**Validates: Requirements 4.7**

### Property 11: Images Sized for Device Pixel Ratio

*For any* image served to mobile viewport, the image dimensions should be appropriate for the device pixel ratio (e.g., 2x images for retina displays), ensuring sharp rendering without excessive file size.

**Validates: Requirements 5.1**

### Property 12: Below-Fold Images Lazy Loaded

*For any* image that is not in the initial viewport, the image should have lazy loading enabled, deferring the load until the image approaches the viewport.

**Validates: Requirements 5.2**

### Property 13: Adaptive Image Quality Based on Network

*For any* image request on a slow network connection (slow-2g, 2g, 3g), the served image should be lower resolution than on fast connections (4g), with progressive enhancement.

**Validates: Requirements 5.3**

### Property 14: Modern Image Formats with Fallbacks

*For any* image, the image source should include modern formats (WebP, AVIF) with fallback formats (JPEG, PNG) for browsers that don't support modern formats.

**Validates: Requirements 5.4**

### Property 15: Initial Page Image Payload Under Budget

*For any* page loaded on mobile viewport, the total size of images loaded before user interaction should be 500KB or less.

**Validates: Requirements 5.6**

### Property 16: Data Tables Render as Cards on Mobile

*For any* data table component rendered in mobile viewport, the table should be transformed into a card-based layout instead of a traditional table structure.

**Validates: Requirements 6.5**

### Property 17: First Contentful Paint Within Budget

*For any* page loaded on mobile viewport with simulated 3G network, the First Contentful Paint metric should be 1.8 seconds or less.

**Validates: Requirements 7.1**

### Property 18: Mobile Bundle Excludes Desktop-Only Code

*For any* JavaScript bundle served to mobile viewport, the bundle should not include code that is only used in desktop viewport (e.g., desktop-specific features, hover interactions).

**Validates: Requirements 7.4**

### Property 19: Critical Resources Prefetched on Navigation

*For any* page navigation, critical resources for likely next pages should be prefetched before the user navigates to those pages.

**Validates: Requirements 7.5**

### Property 20: Minimum Font Size Maintained

*For any* viewport size, body text font size should be at least 14px, ensuring readability on all devices.

**Validates: Requirements 8.2**

### Property 21: Headings Scale with Modular Scale

*For any* heading level (h1-h6), the font size should follow a modular scale ratio (e.g., 1.25 or 1.333), ensuring proportional hierarchy across viewport sizes.

**Validates: Requirements 8.3**

### Property 22: Form Inputs Use Appropriate Types

*For any* form input field on mobile viewport, the input type attribute should be appropriate for the expected data (e.g., type="email" for email fields, type="tel" for phone numbers), triggering the correct mobile keyboard.

**Validates: Requirements 9.3**

### Property 23: Modals Render Full-Screen on Mobile

*For any* modal dialog rendered in mobile viewport, the modal should occupy the full screen (100% width and height) rather than appearing as a centered overlay.

**Validates: Requirements 9.5**

### Property 24: Date Pickers Use Native Controls on Mobile

*For any* date picker input on mobile viewport, the input should use native mobile date picker controls (type="date") rather than custom JavaScript date pickers.

**Validates: Requirements 9.7**

## Error Handling

### Viewport Detection Errors

**Scenario**: Viewport size cannot be determined (e.g., during SSR or in unsupported environments)

**Handling**:
- Default to mobile-first assumptions (smallest breakpoint)
- Log warning for debugging
- Gracefully degrade to functional but non-optimized experience
- Re-attempt detection on client-side hydration

**Example**:
```typescript
function getViewportCategory(): ViewportCategory {
  try {
    if (typeof window === 'undefined') {
      // SSR: default to mobile
      return 'mobile';
    }
    const width = window.innerWidth;
    if (width < 768) return 'mobile';
    if (width < 1024) return 'tablet';
    return 'desktop';
  } catch (error) {
    console.warn('Viewport detection failed:', error);
    return 'mobile'; // Safe default
  }
}
```

### Touch Event Errors

**Scenario**: Touch events are not supported or fail to register

**Handling**:
- Detect touch support before registering touch handlers
- Provide mouse event fallbacks for all touch interactions
- Log errors for unsupported gesture types
- Gracefully degrade to click-based interactions

**Example**:
```typescript
function registerGestures(element: HTMLElement, config: GestureConfig) {
  try {
    if ('ontouchstart' in window) {
      // Touch events supported
      element.addEventListener('touchstart', handleTouchStart);
    } else {
      // Fallback to mouse events
      element.addEventListener('mousedown', handleMouseDown);
    }
  } catch (error) {
    console.error('Failed to register gestures:', error);
    // Fallback to basic click handler
    element.addEventListener('click', config.onTap || (() => {}));
  }
}
```

### Image Optimization Errors

**Scenario**: Image optimization fails (e.g., format not supported, network error)

**Handling**:
- Always provide fallback image formats
- Implement retry logic with exponential backoff
- Show placeholder or skeleton while loading
- Log errors for monitoring
- Degrade to original image if optimization fails

**Example**:
```typescript
function getOptimizedImageSrc(src: string, config: ImageOptimizationConfig): string {
  try {
    const { devicePixelRatio, viewportWidth, connectionSpeed } = config;
    
    // Calculate optimal size
    const targetWidth = Math.ceil(viewportWidth * devicePixelRatio);
    
    // Adjust quality based on connection
    const quality = connectionSpeed === '3g' || connectionSpeed === '2g' ? 60 : 80;
    
    // Generate optimized URL
    return `/api/images/optimize?src=${encodeURIComponent(src)}&w=${targetWidth}&q=${quality}`;
  } catch (error) {
    console.error('Image optimization failed:', error);
    return src; // Return original image
  }
}
```

### Performance Metric Collection Errors

**Scenario**: Performance API is not available or metrics cannot be collected

**Handling**:
- Check for Performance API support before collecting metrics
- Provide mock metrics for unsupported environments
- Log warnings for missing APIs
- Continue execution without metrics

**Example**:
```typescript
function getPerformanceMetrics(): PerformanceMetrics {
  try {
    if (!('performance' in window)) {
      console.warn('Performance API not supported');
      return getMockMetrics();
    }
    
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    const paint = performance.getEntriesByType('paint');
    
    return {
      fcp: paint.find(p => p.name === 'first-contentful-paint')?.startTime || 0,
      lcp: 0, // Requires PerformanceObserver
      cls: 0,
      fid: 0,
      // ... other metrics
    };
  } catch (error) {
    console.error('Failed to collect performance metrics:', error);
    return getMockMetrics();
  }
}
```

### Breakpoint Change Errors

**Scenario**: Breakpoint change listeners fail or cause excessive re-renders

**Handling**:
- Debounce resize events to prevent excessive updates
- Use try-catch around listener callbacks
- Implement circuit breaker for failing listeners
- Provide unsubscribe mechanism to prevent memory leaks

**Example**:
```typescript
function subscribeToBreakpointChanges(callback: (category: ViewportCategory) => void): () => void {
  let timeoutId: NodeJS.Timeout;
  let errorCount = 0;
  const MAX_ERRORS = 5;
  
  const handleResize = () => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      try {
        if (errorCount >= MAX_ERRORS) {
          console.error('Too many errors in breakpoint listener, unsubscribing');
          cleanup();
          return;
        }
        
        const category = getViewportCategory();
        callback(category);
      } catch (error) {
        errorCount++;
        console.error('Breakpoint change callback failed:', error);
      }
    }, 16); // Debounce to ~60fps
  };
  
  window.addEventListener('resize', handleResize);
  
  const cleanup = () => {
    clearTimeout(timeoutId);
    window.removeEventListener('resize', handleResize);
  };
  
  return cleanup;
}
```

### Service Worker Registration Errors

**Scenario**: Service worker fails to register or update

**Handling**:
- Check for service worker support before registration
- Implement retry logic for registration failures
- Provide fallback for offline functionality
- Log errors for monitoring
- Continue execution without service worker if registration fails

**Example**:
```typescript
async function registerServiceWorker(): Promise<void> {
  try {
    if (!('serviceWorker' in navigator)) {
      console.warn('Service workers not supported');
      return;
    }
    
    const registration = await navigator.serviceWorker.register('/sw.js');
    console.log('Service worker registered:', registration);
    
    // Handle updates
    registration.addEventListener('updatefound', () => {
      const newWorker = registration.installing;
      newWorker?.addEventListener('statechange', () => {
        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
          // New version available
          console.log('New service worker available');
        }
      });
    });
  } catch (error) {
    console.error('Service worker registration failed:', error);
    // Continue without service worker
  }
}
```

## Testing Strategy

### Dual Testing Approach

This feature requires both unit tests and property-based tests to ensure comprehensive coverage:

**Unit Tests**: Focus on specific examples, edge cases, and integration points
- Specific breakpoint transitions (e.g., 767px → 768px)
- Edge cases (e.g., viewport width of 0, extremely large viewports)
- Error conditions (e.g., missing viewport API, touch events not supported)
- Integration between components (e.g., ViewportProvider + useBreakpoint hook)

**Property-Based Tests**: Verify universal properties across all inputs
- Viewport detection accuracy across all possible widths
- Touch target sizing for all interactive elements
- Image optimization for all device pixel ratios
- Layout constraints for all page components

### Property-Based Testing Configuration

**Library**: Use `fast-check` for TypeScript/JavaScript property-based testing

**Installation**:
```bash
npm install --save-dev fast-check @types/fast-check
```

**Configuration**:
- Minimum 100 iterations per property test
- Each test must reference its design document property
- Tag format: `Feature: mobile-responsiveness-improvements, Property {number}: {property_text}`

**Example Property Test**:
```typescript
import fc from 'fast-check';
import { describe, it, expect } from 'vitest';
import { getViewportCategory } from '@/lib/breakpoints';

describe('Breakpoint Manager', () => {
  it('Property 1: Returns accurate viewport category for any width', () => {
    // Feature: mobile-responsiveness-improvements, Property 1: Breakpoint Manager Returns Accurate Viewport Information
    
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 3840 }), // Viewport widths from 1px to 4K
        (width) => {
          // Mock window.innerWidth
          Object.defineProperty(window, 'innerWidth', {
            writable: true,
            configurable: true,
            value: width,
          });
          
          const category = getViewportCategory();
          
          // Verify category matches width
          if (width < 768) {
            expect(category).toBe('mobile');
          } else if (width < 1024) {
            expect(category).toBe('tablet');
          } else {
            expect(category).toBe('desktop');
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});
```

### Unit Test Examples

**Breakpoint Transitions**:
```typescript
describe('Breakpoint Manager - Edge Cases', () => {
  it('should return mobile for width 767px', () => {
    Object.defineProperty(window, 'innerWidth', { value: 767 });
    expect(getViewportCategory()).toBe('mobile');
  });
  
  it('should return tablet for width 768px', () => {
    Object.defineProperty(window, 'innerWidth', { value: 768 });
    expect(getViewportCategory()).toBe('tablet');
  });
  
  it('should return tablet for width 1023px', () => {
    Object.defineProperty(window, 'innerWidth', { value: 1023 });
    expect(getViewportCategory()).toBe('tablet');
  });
  
  it('should return desktop for width 1024px', () => {
    Object.defineProperty(window, 'innerWidth', { value: 1024 });
    expect(getViewportCategory()).toBe('desktop');
  });
});
```

**Touch Target Validation**:
```typescript
describe('Touch Handler - Touch Target Validation', () => {
  it('should validate touch target meets minimum size', () => {
    const element = document.createElement('button');
    element.style.width = '44px';
    element.style.height = '44px';
    
    expect(validateTouchTarget(element)).toBe(true);
  });
  
  it('should reject touch target below minimum size', () => {
    const element = document.createElement('button');
    element.style.width = '40px';
    element.style.height = '40px';
    
    expect(validateTouchTarget(element)).toBe(false);
  });
});
```

### Integration Tests

**Viewport Provider Integration**:
```typescript
describe('ViewportProvider Integration', () => {
  it('should provide viewport context to child components', () => {
    const { result } = renderHook(() => useViewport(), {
      wrapper: ViewportProvider,
    });
    
    expect(result.current).toHaveProperty('width');
    expect(result.current).toHaveProperty('height');
    expect(result.current).toHaveProperty('category');
    expect(result.current).toHaveProperty('isMobile');
  });
  
  it('should update context when viewport changes', async () => {
    const { result, rerender } = renderHook(() => useViewport(), {
      wrapper: ViewportProvider,
    });
    
    // Simulate viewport resize
    Object.defineProperty(window, 'innerWidth', { value: 500 });
    window.dispatchEvent(new Event('resize'));
    
    await waitFor(() => {
      expect(result.current.category).toBe('mobile');
    });
  });
});
```

### Visual Regression Tests

**Tool**: Use Playwright for visual regression testing across breakpoints

**Configuration**:
```typescript
import { test, expect } from '@playwright/test';

const BREAKPOINTS = [
  { name: 'mobile', width: 375, height: 667 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'desktop', width: 1280, height: 720 },
];

for (const breakpoint of BREAKPOINTS) {
  test(`Homepage renders correctly at ${breakpoint.name}`, async ({ page }) => {
    await page.setViewportSize({ 
      width: breakpoint.width, 
      height: breakpoint.height 
    });
    
    await page.goto('/');
    
    // Wait for content to load
    await page.waitForLoadState('networkidle');
    
    // Take screenshot
    await expect(page).toHaveScreenshot(`homepage-${breakpoint.name}.png`);
  });
}
```

### Performance Tests

**Tool**: Use Lighthouse CI for automated performance testing

**Configuration** (`.lighthouserc.json`):
```json
{
  "ci": {
    "collect": {
      "numberOfRuns": 3,
      "settings": {
        "preset": "desktop",
        "throttling": {
          "rttMs": 40,
          "throughputKbps": 10240,
          "cpuSlowdownMultiplier": 1
        }
      }
    },
    "assert": {
      "assertions": {
        "first-contentful-paint": ["error", { "maxNumericValue": 1800 }],
        "largest-contentful-paint": ["error", { "maxNumericValue": 2500 }],
        "cumulative-layout-shift": ["error", { "maxNumericValue": 0.1 }],
        "total-blocking-time": ["error", { "maxNumericValue": 300 }]
      }
    }
  }
}
```

### Test Coverage Goals

- Unit test coverage: 80% minimum
- Property-based test coverage: All 24 correctness properties
- Visual regression tests: All critical pages at all breakpoints
- Performance tests: All critical pages meet performance budgets
- Integration tests: All component interactions with responsive system

### Continuous Integration

**GitHub Actions Workflow**:
```yaml
name: Responsive Design Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run unit tests
        run: npm test
      
      - name: Run property-based tests
        run: npm test -- --grep "Property [0-9]+"
      
      - name: Run visual regression tests
        run: npx playwright test
      
      - name: Run Lighthouse CI
        run: npm run perf:ci
```

