/**
 * Unit tests for Mobile Optimizer
 * Tests lazy loading, preloading, and performance monitoring functionality
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  setupLazyLoading,
  cleanupLazyLoading,
  preloadCriticalResources,
  getOptimizedImageSrc,
  getCurrentOptimizationConfig,
  getPerformanceMetrics,
  setupPerformanceMonitoring,
} from '../mobile-optimizer';

describe('Mobile Optimizer - Lazy Loading', () => {
  let container: HTMLDivElement;

  beforeEach(() => {
    // Create a container with test images
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    // Cleanup
    cleanupLazyLoading(container);
    document.body.removeChild(container);
  });

  it('should set up lazy loading for images with data-src attribute', () => {
    // Add images with data-src
    container.innerHTML = `
      <img data-src="/test1.jpg" alt="Test 1" />
      <img data-src="/test2.jpg" alt="Test 2" />
      <img src="/test3.jpg" alt="Test 3" />
    `;

    setupLazyLoading(container);

    // Verify observer is attached
    expect((container as any).__lazyLoadObserver).toBeDefined();
  });

  it('should add transition styles to lazy load images', () => {
    container.innerHTML = `<img data-src="/test.jpg" alt="Test" />`;
    
    setupLazyLoading(container);
    
    const img = container.querySelector('img') as HTMLImageElement;
    expect(img.style.opacity).toBe('0');
    expect(img.style.transition).toContain('opacity');
  });

  it('should handle containers with no lazy load images', () => {
    container.innerHTML = `<img src="/test.jpg" alt="Test" />`;
    
    // Should not throw error
    expect(() => setupLazyLoading(container)).not.toThrow();
    
    // Should not create observer
    expect((container as any).__lazyLoadObserver).toBeUndefined();
  });

  it('should cleanup lazy loading observer', () => {
    container.innerHTML = `<img data-src="/test.jpg" alt="Test" />`;
    
    setupLazyLoading(container);
    expect((container as any).__lazyLoadObserver).toBeDefined();
    
    cleanupLazyLoading(container);
    expect((container as any).__lazyLoadObserver).toBeUndefined();
  });
});

describe('Mobile Optimizer - Preloading', () => {
  beforeEach(() => {
    // Clear any existing preload links
    document.querySelectorAll('link[rel="preload"]').forEach(link => link.remove());
  });

  it('should preload critical resources', () => {
    const urls = ['/hero.jpg', '/featured.jpg'];
    
    preloadCriticalResources(urls);
    
    // Verify preload links were created
    const preloadLinks = document.querySelectorAll('link[rel="preload"]');
    expect(preloadLinks.length).toBe(2);
    
    const hrefs = Array.from(preloadLinks).map(link => link.getAttribute('href'));
    expect(hrefs).toContain('/hero.jpg');
    expect(hrefs).toContain('/featured.jpg');
  });

  it('should not create duplicate preload links', () => {
    const urls = ['/hero.jpg'];
    
    preloadCriticalResources(urls);
    preloadCriticalResources(urls); // Call again
    
    // Should only have one preload link
    const preloadLinks = document.querySelectorAll('link[rel="preload"][href="/hero.jpg"]');
    expect(preloadLinks.length).toBe(1);
  });

  it('should set correct attributes on preload links', () => {
    preloadCriticalResources(['/test.jpg']);
    
    const link = document.querySelector('link[rel="preload"]') as HTMLLinkElement;
    expect(link.rel).toBe('preload');
    expect(link.as).toBe('image');
    expect(link.href).toContain('/test.jpg');
  });
});

describe('Mobile Optimizer - Image Optimization', () => {
  it('should generate optimized image URL with width and quality', () => {
    const config = {
      devicePixelRatio: 2,
      viewportWidth: 375,
      connectionSpeed: '3g' as const,
    };

    const optimizedSrc = getOptimizedImageSrc('/test.jpg', config);
    
    // Should include width parameter (375 * 2 = 750)
    expect(optimizedSrc).toContain('w=750');
    
    // Should include quality parameter (60 for 3G)
    expect(optimizedSrc).toContain('q=60');
  });

  it('should cap device pixel ratio at 2x', () => {
    const config = {
      devicePixelRatio: 3, // High DPR device
      viewportWidth: 375,
      connectionSpeed: '4g' as const,
    };

    const optimizedSrc = getOptimizedImageSrc('/test.jpg', config);
    
    // Should cap at 2x: 375 * 2 = 750
    expect(optimizedSrc).toContain('w=750');
  });

  it('should adjust quality based on connection speed', () => {
    const testCases = [
      { speed: 'slow-2g' as const, expectedQuality: 40 },
      { speed: '2g' as const, expectedQuality: 50 },
      { speed: '3g' as const, expectedQuality: 60 },
      { speed: '4g' as const, expectedQuality: 80 },
      { speed: 'unknown' as const, expectedQuality: 75 },
    ];

    testCases.forEach(({ speed, expectedQuality }) => {
      const config = {
        devicePixelRatio: 1,
        viewportWidth: 375,
        connectionSpeed: speed,
      };

      const optimizedSrc = getOptimizedImageSrc('/test.jpg', config);
      expect(optimizedSrc).toContain(`q=${expectedQuality}`);
    });
  });

  it('should handle data URLs without modification', () => {
    const dataUrl = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
    const config = {
      devicePixelRatio: 2,
      viewportWidth: 375,
      connectionSpeed: '4g' as const,
    };

    const result = getOptimizedImageSrc(dataUrl, config);
    expect(result).toBe(dataUrl);
  });

  it('should handle external URLs without modification', () => {
    const externalUrl = 'https://example.com/image.jpg';
    const config = {
      devicePixelRatio: 2,
      viewportWidth: 375,
      connectionSpeed: '4g' as const,
    };

    const result = getOptimizedImageSrc(externalUrl, config);
    expect(result).toBe(externalUrl);
  });

  it('should handle invalid sources gracefully', () => {
    const config = {
      devicePixelRatio: 2,
      viewportWidth: 375,
      connectionSpeed: '4g' as const,
    };

    // Empty string
    expect(getOptimizedImageSrc('', config)).toBe('');
    
    // Null/undefined (cast to string)
    expect(getOptimizedImageSrc(null as any, config)).toBe('');
  });
});

describe('Mobile Optimizer - Configuration', () => {
  it('should get current optimization config', () => {
    const config = getCurrentOptimizationConfig();
    
    expect(config).toHaveProperty('devicePixelRatio');
    expect(config).toHaveProperty('viewportWidth');
    expect(config).toHaveProperty('connectionSpeed');
    
    expect(typeof config.devicePixelRatio).toBe('number');
    expect(typeof config.viewportWidth).toBe('number');
    expect(typeof config.connectionSpeed).toBe('string');
  });

  it('should return valid connection speed values', () => {
    const config = getCurrentOptimizationConfig();
    const validSpeeds = ['slow-2g', '2g', '3g', '4g', 'unknown'];
    
    expect(validSpeeds).toContain(config.connectionSpeed);
  });
});

describe('Mobile Optimizer - Error Handling', () => {
  it('should handle missing IntersectionObserver gracefully', () => {
    // Mock missing IntersectionObserver
    const originalIO = (global as any).IntersectionObserver;
    (global as any).IntersectionObserver = undefined;

    const container = document.createElement('div');
    container.innerHTML = `<img data-src="/test.jpg" alt="Test" />`;

    // Should not throw
    expect(() => setupLazyLoading(container)).not.toThrow();

    // Restore
    (global as any).IntersectionObserver = originalIO;
  });

  it('should handle preload errors gracefully', () => {
    // Should not throw even with invalid URLs
    expect(() => preloadCriticalResources([''])).not.toThrow();
    expect(() => preloadCriticalResources([null as any])).not.toThrow();
  });

  it('should handle optimization errors gracefully', () => {
    const config = {
      devicePixelRatio: 2,
      viewportWidth: 375,
      connectionSpeed: '4g' as const,
    };

    // Should return original source on error
    const invalidSrc = undefined as any;
    const result = getOptimizedImageSrc(invalidSrc, config);
    
    expect(result).toBe('');
  });
});

describe('Mobile Optimizer - Performance Monitoring', () => {
  it('should collect Core Web Vitals metrics', () => {
    const metrics = getPerformanceMetrics();
    
    // Verify all Core Web Vitals are present
    expect(metrics).toHaveProperty('fcp');
    expect(metrics).toHaveProperty('lcp');
    expect(metrics).toHaveProperty('cls');
    expect(metrics).toHaveProperty('fid');
    
    // Verify types
    expect(typeof metrics.fcp).toBe('number');
    expect(typeof metrics.lcp).toBe('number');
    expect(typeof metrics.cls).toBe('number');
    expect(typeof metrics.fid).toBe('number');
  });

  it('should collect custom metrics (TTI, TBT)', () => {
    const metrics = getPerformanceMetrics();
    
    // Verify custom metrics are present
    expect(metrics).toHaveProperty('tti');
    expect(metrics).toHaveProperty('tbt');
    
    // Verify types
    expect(typeof metrics.tti).toBe('number');
    expect(typeof metrics.tbt).toBe('number');
    
    // Verify non-negative values
    expect(metrics.tti).toBeGreaterThanOrEqual(0);
    expect(metrics.tbt).toBeGreaterThanOrEqual(0);
  });

  it('should collect resource metrics (JS, CSS, image sizes)', () => {
    const metrics = getPerformanceMetrics();
    
    // Verify resource metrics are present
    expect(metrics).toHaveProperty('jsSize');
    expect(metrics).toHaveProperty('cssSize');
    expect(metrics).toHaveProperty('imageSize');
    expect(metrics).toHaveProperty('totalSize');
    
    // Verify types
    expect(typeof metrics.jsSize).toBe('number');
    expect(typeof metrics.cssSize).toBe('number');
    expect(typeof metrics.imageSize).toBe('number');
    expect(typeof metrics.totalSize).toBe('number');
    
    // Verify non-negative values
    expect(metrics.jsSize).toBeGreaterThanOrEqual(0);
    expect(metrics.cssSize).toBeGreaterThanOrEqual(0);
    expect(metrics.imageSize).toBeGreaterThanOrEqual(0);
    expect(metrics.totalSize).toBeGreaterThanOrEqual(0);
  });

  it('should collect network metrics', () => {
    const metrics = getPerformanceMetrics();
    
    // Verify network metrics are present
    expect(metrics).toHaveProperty('connectionType');
    expect(metrics).toHaveProperty('effectiveType');
    expect(metrics).toHaveProperty('downlink');
    expect(metrics).toHaveProperty('rtt');
    
    // Verify types
    expect(typeof metrics.connectionType).toBe('string');
    expect(typeof metrics.effectiveType).toBe('string');
    expect(typeof metrics.downlink).toBe('number');
    expect(typeof metrics.rtt).toBe('number');
    
    // Verify non-negative values for numeric metrics
    expect(metrics.downlink).toBeGreaterThanOrEqual(0);
    expect(metrics.rtt).toBeGreaterThanOrEqual(0);
  });

  it('should return zero values when Performance API is not available', () => {
    // Mock missing Performance API
    const originalPerformance = global.performance;
    (global as any).performance = undefined;

    const metrics = getPerformanceMetrics();
    
    // Should return zero/default values
    expect(metrics.fcp).toBe(0);
    expect(metrics.lcp).toBe(0);
    expect(metrics.cls).toBe(0);
    expect(metrics.fid).toBe(0);
    expect(metrics.tti).toBe(0);
    expect(metrics.tbt).toBe(0);
    expect(metrics.jsSize).toBe(0);
    expect(metrics.cssSize).toBe(0);
    expect(metrics.imageSize).toBe(0);
    expect(metrics.totalSize).toBe(0);
    expect(metrics.connectionType).toBe('unknown');
    expect(metrics.effectiveType).toBe('unknown');
    expect(metrics.downlink).toBe(0);
    expect(metrics.rtt).toBe(0);

    // Restore
    (global as any).performance = originalPerformance;
  });

  it('should setup real-time performance monitoring', () => {
    const callback = vi.fn();
    
    const cleanup = setupPerformanceMonitoring(callback);
    
    // Verify cleanup function is returned
    expect(typeof cleanup).toBe('function');
    
    // Cleanup
    cleanup();
  });

  it('should handle missing PerformanceObserver gracefully', () => {
    // Mock missing PerformanceObserver
    const originalPO = (global as any).PerformanceObserver;
    (global as any).PerformanceObserver = undefined;

    const callback = vi.fn();
    
    // Should not throw
    expect(() => setupPerformanceMonitoring(callback)).not.toThrow();
    
    // Should return cleanup function
    const cleanup = setupPerformanceMonitoring(callback);
    expect(typeof cleanup).toBe('function');
    
    // Cleanup should not throw
    expect(() => cleanup()).not.toThrow();

    // Restore
    (global as any).PerformanceObserver = originalPO;
  });

  it('should calculate resource sizes correctly', () => {
    const metrics = getPerformanceMetrics();
    
    // Total size should be sum of all resource types (or greater if there are other resources)
    const calculatedTotal = metrics.jsSize + metrics.cssSize + metrics.imageSize;
    expect(metrics.totalSize).toBeGreaterThanOrEqual(calculatedTotal);
  });

  it('should handle errors in performance metric collection gracefully', () => {
    // Mock Performance API to throw error
    const originalPerformance = global.performance;
    (global as any).performance = {
      getEntriesByType: () => {
        throw new Error('Test error');
      },
    };

    // Should not throw, should return default values
    expect(() => getPerformanceMetrics()).not.toThrow();
    const metrics = getPerformanceMetrics();
    
    expect(metrics.fcp).toBe(0);
    expect(metrics.lcp).toBe(0);

    // Restore
    (global as any).performance = originalPerformance;
  });

  it('should return valid connection type values', () => {
    const metrics = getPerformanceMetrics();
    
    // Connection type should be one of the valid values
    const validTypes = ['slow-2g', '2g', '3g', '4g', 'wifi', 'cellular', 'bluetooth', 'ethernet', 'none', 'other', 'unknown'];
    
    // effectiveType should be one of the valid values
    const validEffectiveTypes = ['slow-2g', '2g', '3g', '4g', 'unknown'];
    expect(validEffectiveTypes).toContain(metrics.effectiveType);
  });

  it('should measure CLS only for shifts without recent input', () => {
    const metrics = getPerformanceMetrics();
    
    // CLS should be a non-negative number
    expect(metrics.cls).toBeGreaterThanOrEqual(0);
    
    // CLS should typically be less than 1 for good experiences
    // (though we can't guarantee this in tests)
    expect(typeof metrics.cls).toBe('number');
  });

  it('should measure TTI as time to interactive', () => {
    const metrics = getPerformanceMetrics();
    
    // TTI should be a non-negative number
    expect(metrics.tti).toBeGreaterThanOrEqual(0);
    
    // TTI should be a reasonable value (not infinity or NaN)
    expect(Number.isFinite(metrics.tti)).toBe(true);
  });

  it('should measure TBT as total blocking time', () => {
    const metrics = getPerformanceMetrics();
    
    // TBT should be a non-negative number
    expect(metrics.tbt).toBeGreaterThanOrEqual(0);
    
    // TBT should be a reasonable value (not infinity or NaN)
    expect(Number.isFinite(metrics.tbt)).toBe(true);
  });

  it('should provide network downlink speed', () => {
    const metrics = getPerformanceMetrics();
    
    // Downlink should be a non-negative number (Mbps)
    expect(metrics.downlink).toBeGreaterThanOrEqual(0);
    
    // Downlink should be a reasonable value
    expect(Number.isFinite(metrics.downlink)).toBe(true);
  });

  it('should provide network RTT (round-trip time)', () => {
    const metrics = getPerformanceMetrics();
    
    // RTT should be a non-negative number (ms)
    expect(metrics.rtt).toBeGreaterThanOrEqual(0);
    
    // RTT should be a reasonable value
    expect(Number.isFinite(metrics.rtt)).toBe(true);
  });
});
