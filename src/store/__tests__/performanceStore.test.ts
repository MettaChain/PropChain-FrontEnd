import { act, renderHook } from '@testing-library/react';
import { usePerformanceStore, type PerformanceMetric } from '../performanceStore';

describe('performanceStore', () => {
  const mockMetric: PerformanceMetric = {
    name: 'LCP',
    value: 1500,
    rating: 'good',
    id: 'metric-1',
    timestamp: Date.now(),
    detail: 'Largest Contentful Paint',
  };

  beforeEach(() => {
    // Reset the store before each test
    usePerformanceStore.getState().clearMetrics();
  });

  describe('initial state', () => {
    it('should have correct initial state', () => {
      const { result } = renderHook(() => usePerformanceStore());
      
      expect(result.current.metrics).toEqual([]);
    });
  });

  describe('addMetric', () => {
    it('should add a new metric', () => {
      const { result } = renderHook(() => usePerformanceStore());
      
      act(() => {
        result.current.addMetric(mockMetric);
      });
      
      expect(result.current.metrics).toHaveLength(1);
      expect(result.current.metrics[0]).toEqual(mockMetric);
    });

    it('should add multiple metrics in order', () => {
      const { result } = renderHook(() => usePerformanceStore());
      
      const metric2 = { ...mockMetric, id: 'metric-2', value: 2000 };
      const metric3 = { ...mockMetric, id: 'metric-3', value: 1200 };
      
      act(() => {
        result.current.addMetric(mockMetric);
        result.current.addMetric(metric2);
        result.current.addMetric(metric3);
      });
      
      expect(result.current.metrics).toHaveLength(3);
      expect(result.current.metrics[0]).toEqual(metric3); // Most recent first
      expect(result.current.metrics[1]).toEqual(metric2);
      expect(result.current.metrics[2]).toEqual(mockMetric);
    });

    it('should limit metrics to maximum size (200)', () => {
      const { result } = renderHook(() => usePerformanceStore());
      
      // Add 201 metrics
      act(() => {
        for (let i = 0; i < 201; i++) {
          result.current.addMetric({
            ...mockMetric,
            id: `metric-${i}`,
            value: i,
          });
        }
      });
      
      expect(result.current.metrics).toHaveLength(200);
      expect(result.current.metrics[0].id).toBe('metric-200'); // Most recent
      expect(result.current.metrics[199].id).toBe('metric-1'); // Oldest kept
    });

    it('should handle different metric types', () => {
      const { result } = renderHook(() => usePerformanceStore());
      
      const lcpMetric: PerformanceMetric = { ...mockMetric, name: 'LCP' };
      const inpMetric: PerformanceMetric = { ...mockMetric, name: 'INP', id: 'metric-2' };
      const longTaskMetric: PerformanceMetric = { ...mockMetric, name: 'long-task', id: 'metric-3' };
      const resourceMetric: PerformanceMetric = { ...mockMetric, name: 'resource', id: 'metric-4' };
      
      act(() => {
        result.current.addMetric(lcpMetric);
        result.current.addMetric(inpMetric);
        result.current.addMetric(longTaskMetric);
        result.current.addMetric(resourceMetric);
      });
      
      expect(result.current.metrics).toHaveLength(4);
      expect(result.current.metrics[0].name).toBe('resource');
      expect(result.current.metrics[1].name).toBe('long-task');
      expect(result.current.metrics[2].name).toBe('INP');
      expect(result.current.metrics[3].name).toBe('LCP');
    });

    it('should handle metrics with different ratings', () => {
      const { result } = renderHook(() => usePerformanceStore());
      
      const goodMetric: PerformanceMetric = { ...mockMetric, rating: 'good', id: 'metric-1' };
      const needsImprovementMetric: PerformanceMetric = { ...mockMetric, rating: 'needs-improvement', id: 'metric-2' };
      const poorMetric: PerformanceMetric = { ...mockMetric, rating: 'poor', id: 'metric-3' };
      
      act(() => {
        result.current.addMetric(goodMetric);
        result.current.addMetric(needsImprovementMetric);
        result.current.addMetric(poorMetric);
      });
      
      expect(result.current.metrics).toHaveLength(3);
      expect(result.current.metrics[0].rating).toBe('poor');
      expect(result.current.metrics[1].rating).toBe('needs-improvement');
      expect(result.current.metrics[2].rating).toBe('good');
    });

    it('should handle metrics without optional fields', () => {
      const { result } = renderHook(() => usePerformanceStore());
      
      const minimalMetric: PerformanceMetric = {
        name: 'FCP',
        value: 800,
        id: 'metric-1',
        timestamp: Date.now(),
      };
      
      act(() => {
        result.current.addMetric(minimalMetric);
      });
      
      expect(result.current.metrics).toHaveLength(1);
      expect(result.current.metrics[0].rating).toBeUndefined();
      expect(result.current.metrics[0].detail).toBeUndefined();
    });

    it('should handle metrics with all optional fields', () => {
      const { result } = renderHook(() => usePerformanceStore());
      
      const fullMetric: PerformanceMetric = {
        name: 'CLS',
        value: 0.1,
        rating: 'needs-improvement',
        id: 'metric-1',
        timestamp: Date.now(),
        detail: 'Cumulative Layout Shift - layout stability metric',
      };
      
      act(() => {
        result.current.addMetric(fullMetric);
      });
      
      expect(result.current.metrics).toHaveLength(1);
      expect(result.current.metrics[0]).toEqual(fullMetric);
    });
  });

  describe('clearMetrics', () => {
    it('should clear all metrics', () => {
      const { result } = renderHook(() => usePerformanceStore());
      
      // Add some metrics
      act(() => {
        result.current.addMetric(mockMetric);
        result.current.addMetric({ ...mockMetric, id: 'metric-2' });
        result.current.addMetric({ ...mockMetric, id: 'metric-3' });
      });
      
      expect(result.current.metrics).toHaveLength(3);
      
      act(() => {
        result.current.clearMetrics();
      });
      
      expect(result.current.metrics).toEqual([]);
    });

    it('should handle clearing empty metrics', () => {
      const { result } = renderHook(() => usePerformanceStore());
      
      expect(result.current.metrics).toHaveLength(0);
      
      act(() => {
        result.current.clearMetrics();
      });
      
      expect(result.current.metrics).toEqual([]);
    });
  });

  describe('Core Web Vitals', () => {
    it('should handle all Core Web Vitals types', () => {
      const { result } = renderHook(() => usePerformanceStore());
      
      const coreVitals: PerformanceMetric[] = [
        { ...mockMetric, name: 'LCP', id: 'lcp-1', value: 2500 },
        { ...mockMetric, name: 'INP', id: 'inp-1', value: 200 },
        { ...mockMetric, name: 'CLS', id: 'cls-1', value: 0.25 },
        { ...mockMetric, name: 'FCP', id: 'fcp-1', value: 1800 },
        { ...mockMetric, name: 'TTFB', id: 'ttfb-1', value: 600 },
      ];
      
      act(() => {
        coreVitals.forEach(metric => result.current.addMetric(metric));
      });
      
      expect(result.current.metrics).toHaveLength(5);
      
      const lcpMetrics = result.current.metrics.filter(m => m.name === 'LCP');
      const inpMetrics = result.current.metrics.filter(m => m.name === 'INP');
      const clsMetrics = result.current.metrics.filter(m => m.name === 'CLS');
      const fcpMetrics = result.current.metrics.filter(m => m.name === 'FCP');
      const ttfbMetrics = result.current.metrics.filter(m => m.name === 'TTFB');
      
      expect(lcpMetrics).toHaveLength(1);
      expect(inpMetrics).toHaveLength(1);
      expect(clsMetrics).toHaveLength(1);
      expect(fcpMetrics).toHaveLength(1);
      expect(ttfbMetrics).toHaveLength(1);
    });
  });

  describe('metric ordering', () => {
    it('should maintain reverse chronological order', () => {
      const { result } = renderHook(() => usePerformanceStore());
      
      const baseTime = Date.now();
      
      act(() => {
        result.current.addMetric({ ...mockMetric, id: 'metric-1', timestamp: baseTime });
        result.current.addMetric({ ...mockMetric, id: 'metric-2', timestamp: baseTime + 1000 });
        result.current.addMetric({ ...mockMetric, id: 'metric-3', timestamp: baseTime + 500 });
      });
      
      expect(result.current.metrics[0].timestamp).toBe(baseTime + 1000);
      expect(result.current.metrics[1].timestamp).toBe(baseTime + 500);
      expect(result.current.metrics[2].timestamp).toBe(baseTime);
    });
  });

  describe('edge cases', () => {
    it('should handle adding the same metric multiple times', () => {
      const { result } = renderHook(() => usePerformanceStore());
      
      act(() => {
        result.current.addMetric(mockMetric);
        result.current.addMetric(mockMetric); // Same metric again
      });
      
      expect(result.current.metrics).toHaveLength(2);
      expect(result.current.metrics[0]).toEqual(mockMetric);
      expect(result.current.metrics[1]).toEqual(mockMetric);
    });

    it('should handle metrics with very large values', () => {
      const { result } = renderHook(() => usePerformanceStore());
      
      const largeValueMetric: PerformanceMetric = {
        ...mockMetric,
        id: 'metric-large',
        value: Number.MAX_SAFE_INTEGER,
      };
      
      act(() => {
        result.current.addMetric(largeValueMetric);
      });
      
      expect(result.current.metrics).toHaveLength(1);
      expect(result.current.metrics[0].value).toBe(Number.MAX_SAFE_INTEGER);
    });

    it('should handle metrics with very small values', () => {
      const { result } = renderHook(() => usePerformanceStore());
      
      const smallValueMetric: PerformanceMetric = {
        ...mockMetric,
        id: 'metric-small',
        value: Number.MIN_VALUE,
      };
      
      act(() => {
        result.current.addMetric(smallValueMetric);
      });
      
      expect(result.current.metrics).toHaveLength(1);
      expect(result.current.metrics[0].value).toBe(Number.MIN_VALUE);
    });

    it('should handle zero values', () => {
      const { result } = renderHook(() => usePerformanceStore());
      
      const zeroValueMetric: PerformanceMetric = {
        ...mockMetric,
        id: 'metric-zero',
        value: 0,
      };
      
      act(() => {
        result.current.addMetric(zeroValueMetric);
      });
      
      expect(result.current.metrics).toHaveLength(1);
      expect(result.current.metrics[0].value).toBe(0);
    });
  });
});
