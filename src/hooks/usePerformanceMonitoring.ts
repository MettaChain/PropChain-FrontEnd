'use client';
import { useEffect, useRef } from 'react';
import { setupPerformanceMonitoring, type PerformanceMetrics } from '@/lib/mobile-optimizer';

let globalCleanup: (() => void) | null = null;

export function usePerformanceMonitoring(callback: (metrics: PerformanceMetrics) => void) {
  const callbackRef = useRef(callback);
  callbackRef.current = callback;

  useEffect(() => {
    if (globalCleanup) {
      globalCleanup();
    }

    globalCleanup = setupPerformanceMonitoring((metrics) => {
      callbackRef.current(metrics);
    });

    return () => {
      if (globalCleanup) {
        globalCleanup();
        globalCleanup = null;
      }
    };
  }, []);
}

export function resetPerformanceMonitoring() {
  if (globalCleanup) {
    globalCleanup();
    globalCleanup = null;
  }
}
