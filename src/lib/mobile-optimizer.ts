"use client";

/**
 * Mobile Optimizer Module
 * 
 * Provides asset optimization and performance management for mobile devices:
 * - Image optimization based on device pixel ratio
 * - Adaptive image quality based on network connection speed
 * - Support for modern image formats (WebP, AVIF) with fallbacks
 * - Lazy loading for below-fold images
 * - Performance metrics collection
 * - Resource preloading
 * 
 * Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 7.1, 7.2
 */

export interface ImageOptimizationConfig {
  devicePixelRatio: number;
  viewportWidth: number;
  connectionSpeed: 'slow-2g' | '2g' | '3g' | '4g' | 'unknown';
}

export interface MobileOptimizer {
  getOptimizedImageSrc(src: string, config: ImageOptimizationConfig): string;
  preloadCriticalResources(urls: string[]): void;
  setupLazyLoading(container: HTMLElement): void;
  getPerformanceMetrics(): PerformanceMetrics;
}

// Image format support detection cache
let formatSupport: {
  webp: boolean | null;
  avif: boolean | null;
} = {
  webp: null,
  avif: null,
};

/**
 * Detects browser support for modern image formats
 */
async function detectFormatSupport(format: 'webp' | 'avif'): Promise<boolean> {
  // Return cached result if available
  if (formatSupport[format] !== null) {
    return formatSupport[format]!;
  }

  // SSR safe: assume no support
  if (typeof window === 'undefined' || typeof Image === 'undefined') {
    formatSupport[format] = false;
    return false;
  }

  return new Promise((resolve) => {
    const img = new Image();
    
    img.onload = () => {
      const supported = img.width > 0 && img.height > 0;
      formatSupport[format] = supported;
      resolve(supported);
    };
    
    img.onerror = () => {
      formatSupport[format] = false;
      resolve(false);
    };

    // Test images (1x1 pixel)
    const testImages = {
      webp: 'data:image/webp;base64,UklGRiQAAABXRUJQVlA4IBgAAAAwAQCdASoBAAEAAwA0JaQAA3AA/vuUAAA=',
      avif: 'data:image/avif;base64,AAAAIGZ0eXBhdmlmAAAAAGF2aWZtaWYxbWlhZk1BMUIAAADybWV0YQAAAAAAAAAoaGRscgAAAAAAAAAAcGljdAAAAAAAAAAAAAAAAGxpYmF2aWYAAAAADnBpdG0AAAAAAAEAAAAeaWxvYwAAAABEAAABAAEAAAABAAABGgAAAB0AAAAoaWluZgAAAAAAAQAAABppbmZlAgAAAAABAABhdjAxQ29sb3IAAAAAamlwcnAAAABLaXBjbwAAABRpc3BlAAAAAAAAAAIAAAACAAAAEHBpeGkAAAAAAwgICAAAAAxhdjFDgQ0MAAAAABNjb2xybmNseAACAAIAAYAAAAAXaXBtYQAAAAAAAAABAAEEAQKDBAAAACVtZGF0EgAKCBgANogQEAwgMg8f8D///8WfhwB8+ErK42A=',
    };

    img.src = testImages[format];
  });
}

/**
 * Gets the current network connection speed
 * Uses Network Information API if available
 */
function getConnectionSpeed(): 'slow-2g' | '2g' | '3g' | '4g' | 'unknown' {
  try {
    // SSR safe
    if (typeof navigator === 'undefined') {
      return 'unknown';
    }

    // Check for Network Information API
    const connection = (navigator as any).connection || 
                      (navigator as any).mozConnection || 
                      (navigator as any).webkitConnection;

    if (!connection) {
      return 'unknown';
    }

    // Get effective connection type
    const effectiveType = connection.effectiveType;

    if (['slow-2g', '2g', '3g', '4g'].includes(effectiveType)) {
      return effectiveType as 'slow-2g' | '2g' | '3g' | '4g';
    }

    return 'unknown';
  } catch (error) {
    console.warn('Failed to detect connection speed:', error);
    return 'unknown';
  }
}

/**
 * Gets the device pixel ratio
 */
function getDevicePixelRatio(): number {
  if (typeof window === 'undefined') {
    return 1;
  }
  return window.devicePixelRatio || 1;
}

/**
 * Gets the viewport width
 */
function getViewportWidth(): number {
  if (typeof window === 'undefined') {
    return 0;
  }
  return window.innerWidth;
}

/**
 * Calculates optimal image quality based on connection speed
 */
function getOptimalQuality(connectionSpeed: ImageOptimizationConfig['connectionSpeed']): number {
  const qualityMap = {
    'slow-2g': 40,
    '2g': 50,
    '3g': 60,
    '4g': 80,
    'unknown': 75, // Default to reasonable quality
  };

  return qualityMap[connectionSpeed];
}

/**
 * Determines the best image format to use based on browser support
 */
async function getBestImageFormat(src: string): Promise<string> {
  // If source already has a modern format, return as-is
  if (src.includes('.webp') || src.includes('.avif')) {
    return src;
  }

  // Check for AVIF support first (better compression)
  const supportsAvif = await detectFormatSupport('avif');
  if (supportsAvif) {
    return src.replace(/\.(jpg|jpeg|png)$/i, '.avif');
  }

  // Check for WebP support
  const supportsWebp = await detectFormatSupport('webp');
  if (supportsWebp) {
    return src.replace(/\.(jpg|jpeg|png)$/i, '.webp');
  }

  // Fallback to original format
  return src;
}

/**
 * Generates optimized image source URL with appropriate parameters
 * Requirement 5.1: Images sized for device pixel ratio
 * Requirement 5.3: Adaptive quality based on network speed
 * Requirement 5.4: Modern formats with fallbacks
 */
export function getOptimizedImageSrc(
  src: string,
  config: ImageOptimizationConfig
): string {
  try {
    // Handle empty or invalid sources
    if (!src || typeof src !== 'string') {
      console.warn('Invalid image source provided:', src);
      return src || '';
    }

    // Handle data URLs and external URLs
    if (src.startsWith('data:') || src.startsWith('http://') || src.startsWith('https://')) {
      // For external URLs, we can't optimize them directly
      // Return as-is (Next.js Image component will handle optimization)
      return src;
    }

    const { devicePixelRatio, viewportWidth, connectionSpeed } = config;

    // Calculate optimal image width based on viewport and DPR
    // Cap at 2x for performance (diminishing returns beyond 2x)
    const effectiveDPR = Math.min(devicePixelRatio, 2);
    const targetWidth = Math.ceil(viewportWidth * effectiveDPR);

    // Calculate optimal quality based on connection speed
    const quality = getOptimalQuality(connectionSpeed);

    // Build optimized URL parameters
    // This assumes Next.js Image optimization API or similar
    const params = new URLSearchParams({
      w: targetWidth.toString(),
      q: quality.toString(),
    });

    // Determine if we should add format parameter
    // Note: Format detection is async, so we'll handle this in a separate function
    // For now, we'll return the URL with width and quality parameters
    const separator = src.includes('?') ? '&' : '?';
    const optimizedSrc = `${src}${separator}${params.toString()}`;

    return optimizedSrc;
  } catch (error) {
    console.error('Failed to optimize image source:', error);
    return src; // Return original source on error
  }
}

/**
 * Preloads critical resources for faster page load
 * Requirement 5.5: Preload first visible image
 */
export function preloadCriticalResources(urls: string[]): void {
  try {
    // SSR safe
    if (typeof document === 'undefined') {
      return;
    }

    urls.forEach((url) => {
      // Check if already preloaded
      const existing = document.querySelector(`link[rel="preload"][href="${url}"]`);
      if (existing) {
        return;
      }

      // Create preload link
      const link = document.createElement('link');
      link.rel = 'preload';
      link.as = 'image';
      link.href = url;

      // Add to document head
      document.head.appendChild(link);
    });
  } catch (error) {
    console.error('Failed to preload critical resources:', error);
  }
}

/**
 * Sets up lazy loading for images in a container using Intersection Observer
 * Requirement 5.2: Lazy load below-fold images
 * Requirement 5.5: Preload first visible image
 * 
 * Features:
 * - Lazy loads images with data-src attribute when they approach viewport
 * - 50px root margin for early loading (better UX)
 * - Automatically adds loading placeholders
 * - Handles loading states and errors
 */
export function setupLazyLoading(container: HTMLElement): void {
  try {
    // SSR safe
    if (typeof window === 'undefined' || typeof IntersectionObserver === 'undefined') {
      console.warn('Intersection Observer not available, lazy loading disabled');
      return;
    }

    // Find all images with data-src attribute (lazy load candidates)
    const images = container.querySelectorAll('img[data-src]');

    if (images.length === 0) {
      return;
    }

    // Create intersection observer
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const img = entry.target as HTMLImageElement;
            const src = img.getAttribute('data-src');

            if (src) {
              // Add loading class for styling
              img.classList.add('lazy-loading');

              // Create a temporary image to preload
              const tempImg = new Image();
              
              tempImg.onload = () => {
                // Load the image
                img.src = src;
                img.removeAttribute('data-src');
                img.classList.remove('lazy-loading');
                img.classList.add('lazy-loaded');
                
                // Trigger fade-in animation
                img.style.opacity = '1';
              };

              tempImg.onerror = () => {
                // Handle error
                img.classList.remove('lazy-loading');
                img.classList.add('lazy-error');
                console.error('Failed to load lazy image:', src);
              };

              // Start loading
              tempImg.src = src;

              // Stop observing this image
              observer.unobserve(img);
            }
          }
        });
      },
      {
        // Start loading when image is 50px from viewport
        // This provides better UX by loading images slightly before they're visible
        rootMargin: '50px',
        threshold: 0.01,
      }
    );

    // Observe all lazy load images
    images.forEach((img) => {
      // Set initial styles for smooth transition
      const imgElement = img as HTMLImageElement;
      imgElement.style.opacity = '0';
      imgElement.style.transition = 'opacity 0.3s ease-in-out';
      
      observer.observe(img);
    });

    // Store observer on container for cleanup
    (container as any).__lazyLoadObserver = observer;
  } catch (error) {
    console.error('Failed to setup lazy loading:', error);
  }
}

/**
 * Cleans up lazy loading observer
 */
export function cleanupLazyLoading(container: HTMLElement): void {
  try {
    const observer = (container as any).__lazyLoadObserver;
    if (observer) {
      observer.disconnect();
      delete (container as any).__lazyLoadObserver;
    }
  } catch (error) {
    console.error('Failed to cleanup lazy loading:', error);
  }
}

/**
 * Performance metrics interface with Core Web Vitals, custom metrics, resource metrics, and network metrics
 * Requirement 7.1: Monitor FCP and performance
 * Requirement 7.2: Monitor Core Web Vitals and comprehensive metrics
 */
export interface PerformanceMetrics {
  // Core Web Vitals
  fcp: number;  // First Contentful Paint (ms)
  lcp: number;  // Largest Contentful Paint (ms)
  cls: number;  // Cumulative Layout Shift (score)
  fid: number;  // First Input Delay (ms)
  
  // Custom metrics
  tti: number;  // Time to Interactive (ms)
  tbt: number;  // Total Blocking Time (ms)
  
  // Resource metrics
  jsSize: number;      // JavaScript bundle size (bytes)
  cssSize: number;     // CSS size (bytes)
  imageSize: number;   // Total image size (bytes)
  totalSize: number;   // Total resource size (bytes)
  
  // Network metrics
  connectionType: string;      // Connection type (e.g., '4g', 'wifi')
  effectiveType: string;       // Effective connection type
  downlink: number;            // Downlink speed (Mbps)
  rtt: number;                 // Round-trip time (ms)
}

/**
 * Calculates Time to Interactive (TTI)
 * TTI is when the page is fully interactive (main thread quiet for 5s)
 */
function calculateTTI(): number {
  try {
    if (typeof window === 'undefined' || !('performance' in window)) {
      return 0;
    }

    // Get navigation timing
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    if (!navigation) {
      return 0;
    }

    // TTI is approximated as domInteractive
    // More accurate TTI requires long task monitoring
    return navigation.domInteractive || 0;
  } catch (error) {
    console.warn('Failed to calculate TTI:', error);
    return 0;
  }
}

/**
 * Calculates Total Blocking Time (TBT)
 * TBT is the sum of blocking time for all long tasks between FCP and TTI
 */
function calculateTBT(): number {
  try {
    if (typeof window === 'undefined' || !('performance' in window)) {
      return 0;
    }

    // Get all long tasks (tasks > 50ms)
    const longTasks = performance.getEntriesByType('longtask') as any[];
    
    // Sum blocking time (time beyond 50ms threshold)
    const tbt = longTasks.reduce((sum, task) => {
      const blockingTime = Math.max(0, task.duration - 50);
      return sum + blockingTime;
    }, 0);

    return tbt;
  } catch (error) {
    // longtask API may not be available
    console.warn('Failed to calculate TBT:', error);
    return 0;
  }
}

/**
 * Collects resource metrics (JS, CSS, image sizes)
 */
function getResourceMetrics(): {
  jsSize: number;
  cssSize: number;
  imageSize: number;
  totalSize: number;
} {
  try {
    if (typeof window === 'undefined' || !('performance' in window)) {
      return { jsSize: 0, cssSize: 0, imageSize: 0, totalSize: 0 };
    }

    const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
    
    let jsSize = 0;
    let cssSize = 0;
    let imageSize = 0;
    let totalSize = 0;

    resources.forEach((resource) => {
      const size = resource.transferSize || 0;
      totalSize += size;

      // Categorize by resource type
      if (resource.initiatorType === 'script' || resource.name.endsWith('.js')) {
        jsSize += size;
      } else if (resource.initiatorType === 'css' || resource.name.endsWith('.css')) {
        cssSize += size;
      } else if (resource.initiatorType === 'img' || /\.(jpg|jpeg|png|gif|webp|avif|svg)$/i.test(resource.name)) {
        imageSize += size;
      }
    });

    return { jsSize, cssSize, imageSize, totalSize };
  } catch (error) {
    console.warn('Failed to collect resource metrics:', error);
    return { jsSize: 0, cssSize: 0, imageSize: 0, totalSize: 0 };
  }
}

/**
 * Collects network metrics using Network Information API
 */
function getNetworkMetrics(): {
  connectionType: string;
  effectiveType: string;
  downlink: number;
  rtt: number;
} {
  try {
    if (typeof navigator === 'undefined') {
      return { connectionType: 'unknown', effectiveType: 'unknown', downlink: 0, rtt: 0 };
    }

    const connection = (navigator as any).connection || 
                      (navigator as any).mozConnection || 
                      (navigator as any).webkitConnection;

    if (!connection) {
      return { connectionType: 'unknown', effectiveType: 'unknown', downlink: 0, rtt: 0 };
    }

    return {
      connectionType: connection.type || 'unknown',
      effectiveType: connection.effectiveType || 'unknown',
      downlink: connection.downlink || 0,
      rtt: connection.rtt || 0,
    };
  } catch (error) {
    console.warn('Failed to collect network metrics:', error);
    return { connectionType: 'unknown', effectiveType: 'unknown', downlink: 0, rtt: 0 };
  }
}

/**
 * Collects comprehensive performance metrics using Performance API
 * Requirement 7.1: Monitor FCP
 * Requirement 7.2: Monitor Core Web Vitals, custom metrics, resource metrics, and network metrics
 */
export function getPerformanceMetrics(): PerformanceMetrics {
  try {
    // SSR safe
    if (typeof window === 'undefined' || !('performance' in window)) {
      return {
        fcp: 0,
        lcp: 0,
        cls: 0,
        fid: 0,
        tti: 0,
        tbt: 0,
        jsSize: 0,
        cssSize: 0,
        imageSize: 0,
        totalSize: 0,
        connectionType: 'unknown',
        effectiveType: 'unknown',
        downlink: 0,
        rtt: 0,
      };
    }

    const metrics: PerformanceMetrics = {
      fcp: 0,
      lcp: 0,
      cls: 0,
      fid: 0,
      tti: 0,
      tbt: 0,
      jsSize: 0,
      cssSize: 0,
      imageSize: 0,
      totalSize: 0,
      connectionType: 'unknown',
      effectiveType: 'unknown',
      downlink: 0,
      rtt: 0,
    };

    // Get First Contentful Paint (FCP)
    const paintEntries = performance.getEntriesByType('paint');
    const fcpEntry = paintEntries.find((entry) => entry.name === 'first-contentful-paint');
    if (fcpEntry) {
      metrics.fcp = fcpEntry.startTime;
    }

    // Get Largest Contentful Paint (LCP)
    // Note: LCP requires PerformanceObserver for real-time monitoring
    // This is a simplified version that gets the last LCP entry
    const lcpEntries = performance.getEntriesByType('largest-contentful-paint');
    if (lcpEntries.length > 0) {
      const lastLCP = lcpEntries[lcpEntries.length - 1] as any;
      metrics.lcp = lastLCP.renderTime || lastLCP.loadTime || 0;
    }

    // Get Cumulative Layout Shift (CLS)
    // Note: CLS requires PerformanceObserver for accurate measurement
    // This is a simplified version
    const layoutShiftEntries = performance.getEntriesByType('layout-shift') as any[];
    metrics.cls = layoutShiftEntries.reduce((sum, entry) => {
      // Only count layout shifts without recent user input
      if (!entry.hadRecentInput) {
        return sum + entry.value;
      }
      return sum;
    }, 0);

    // Get First Input Delay (FID)
    // Note: FID requires PerformanceObserver and actual user interaction
    // This is a placeholder - real FID measurement requires event timing API
    const firstInputEntries = performance.getEntriesByType('first-input') as any[];
    if (firstInputEntries.length > 0) {
      const firstInput = firstInputEntries[0];
      metrics.fid = firstInput.processingStart - firstInput.startTime;
    }

    // Get custom metrics
    metrics.tti = calculateTTI();
    metrics.tbt = calculateTBT();

    // Get resource metrics
    const resourceMetrics = getResourceMetrics();
    metrics.jsSize = resourceMetrics.jsSize;
    metrics.cssSize = resourceMetrics.cssSize;
    metrics.imageSize = resourceMetrics.imageSize;
    metrics.totalSize = resourceMetrics.totalSize;

    // Get network metrics
    const networkMetrics = getNetworkMetrics();
    metrics.connectionType = networkMetrics.connectionType;
    metrics.effectiveType = networkMetrics.effectiveType;
    metrics.downlink = networkMetrics.downlink;
    metrics.rtt = networkMetrics.rtt;

    return metrics;
  } catch (error) {
    console.error('Failed to collect performance metrics:', error);
    return {
      fcp: 0,
      lcp: 0,
      cls: 0,
      fid: 0,
      tti: 0,
      tbt: 0,
      jsSize: 0,
      cssSize: 0,
      imageSize: 0,
      totalSize: 0,
      connectionType: 'unknown',
      effectiveType: 'unknown',
      downlink: 0,
      rtt: 0,
    };
  }
}

/**
 * Sets up real-time performance monitoring using PerformanceObserver
 * This provides more accurate metrics than one-time collection
 */
export function setupPerformanceMonitoring(
  callback: (metrics: PerformanceMetrics) => void
): () => void {
  try {
    // SSR safe
    if (typeof window === 'undefined' || !('PerformanceObserver' in window)) {
      console.warn('PerformanceObserver not available');
      return () => {};
    }

    const metrics: PerformanceMetrics = {
      fcp: 0,
      lcp: 0,
      cls: 0,
      fid: 0,
      tti: 0,
      tbt: 0,
      jsSize: 0,
      cssSize: 0,
      imageSize: 0,
      totalSize: 0,
      connectionType: 'unknown',
      effectiveType: 'unknown',
      downlink: 0,
      rtt: 0,
    };

    // Helper to update metrics and invoke callback
    const updateMetrics = () => {
      // Update custom metrics
      metrics.tti = calculateTTI();
      metrics.tbt = calculateTBT();
      
      // Update resource metrics
      const resourceMetrics = getResourceMetrics();
      metrics.jsSize = resourceMetrics.jsSize;
      metrics.cssSize = resourceMetrics.cssSize;
      metrics.imageSize = resourceMetrics.imageSize;
      metrics.totalSize = resourceMetrics.totalSize;
      
      // Update network metrics
      const networkMetrics = getNetworkMetrics();
      metrics.connectionType = networkMetrics.connectionType;
      metrics.effectiveType = networkMetrics.effectiveType;
      metrics.downlink = networkMetrics.downlink;
      metrics.rtt = networkMetrics.rtt;
      
      callback({ ...metrics });
    };

    // Observe paint events (FCP)
    const paintObserver = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.name === 'first-contentful-paint') {
          metrics.fcp = entry.startTime;
          updateMetrics();
        }
      }
    });
    paintObserver.observe({ entryTypes: ['paint'] });

    // Observe LCP
    const lcpObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const lastEntry = entries[entries.length - 1] as any;
      metrics.lcp = lastEntry.renderTime || lastEntry.loadTime || 0;
      updateMetrics();
    });
    lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });

    // Observe layout shifts (CLS)
    const clsObserver = new PerformanceObserver((list) => {
      for (const entry of list.getEntries() as any[]) {
        if (!entry.hadRecentInput) {
          metrics.cls += entry.value;
          updateMetrics();
        }
      }
    });
    clsObserver.observe({ entryTypes: ['layout-shift'] });

    // Observe first input (FID)
    const fidObserver = new PerformanceObserver((list) => {
      for (const entry of list.getEntries() as any[]) {
        metrics.fid = entry.processingStart - entry.startTime;
        updateMetrics();
      }
    });
    fidObserver.observe({ entryTypes: ['first-input'] });

    // Return cleanup function
    return () => {
      paintObserver.disconnect();
      lcpObserver.disconnect();
      clsObserver.disconnect();
      fidObserver.disconnect();
    };
  } catch (error) {
    console.error('Failed to setup performance monitoring:', error);
    return () => {};
  }
}

/**
 * Creates a MobileOptimizer instance with all methods
 */
export function createMobileOptimizer(): MobileOptimizer {
  return {
    getOptimizedImageSrc,
    preloadCriticalResources,
    setupLazyLoading,
    getPerformanceMetrics,
  };
}

/**
 * Helper function to get current optimization config
 * Automatically detects device capabilities and network conditions
 */
export function getCurrentOptimizationConfig(): ImageOptimizationConfig {
  return {
    devicePixelRatio: getDevicePixelRatio(),
    viewportWidth: getViewportWidth(),
    connectionSpeed: getConnectionSpeed(),
  };
}

// Export default instance
export const mobileOptimizer = createMobileOptimizer();

// Export utility functions
export {
  getConnectionSpeed,
  getDevicePixelRatio,
  getViewportWidth,
  getBestImageFormat,
  detectFormatSupport,
};
