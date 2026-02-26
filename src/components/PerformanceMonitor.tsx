"use client";

import { useEffect } from "react";
import { useReportWebVitals } from "next/web-vitals";
import { usePerformanceStore } from "@/store/performanceStore";

const METRIC_THRESHOLDS = {
  LCP: { good: 2500, poor: 4000 },
  INP: { good: 200, poor: 500 },
  CLS: { good: 0.1, poor: 0.25 },
} as const;

function getRating(name: string, value: number): "good" | "needs-improvement" | "poor" | undefined {
  if (name !== "LCP" && name !== "INP" && name !== "CLS") return undefined;
  const threshold = METRIC_THRESHOLDS[name];
  if (value <= threshold.good) return "good";
  if (value > threshold.poor) return "poor";
  return "needs-improvement";
}

export function PerformanceMonitor(): React.ReactElement | null {
  const addMetric = usePerformanceStore((state) => state.addMetric);

  useReportWebVitals((metric) => {
    addMetric({
      name: metric.name as "LCP" | "INP" | "CLS" | "FCP" | "TTFB",
      value: metric.value,
      id: metric.id,
      timestamp: Date.now(),
      rating: getRating(metric.name, metric.value),
    });
  });

  useEffect(() => {
    if (typeof window === "undefined") return;

    if ("serviceWorker" in navigator) {
      window.addEventListener("load", () => {
        navigator.serviceWorker.register("/sw.js").catch(() => {});
      });
    }

    if ("PerformanceObserver" in window) {
      const longTaskObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          addMetric({
            name: "long-task",
            value: entry.duration,
            id: `longtask-${entry.startTime}`,
            timestamp: Date.now(),
            detail: entry.name || "main-thread-blocking",
          });
        }
      });

      const resourceObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries().slice(-10)) {
          const resourceEntry = entry as PerformanceResourceTiming;
          addMetric({
            name: "resource",
            value: resourceEntry.duration,
            id: `resource-${resourceEntry.startTime}-${resourceEntry.name}`,
            timestamp: Date.now(),
            detail: resourceEntry.name,
          });
        }
      });

      try {
        longTaskObserver.observe({ type: "longtask", buffered: true });
      } catch {}
      try {
        resourceObserver.observe({ type: "resource", buffered: true });
      } catch {}

      return () => {
        longTaskObserver.disconnect();
        resourceObserver.disconnect();
      };
    }

    return;
  }, [addMetric]);

  return null;
}
