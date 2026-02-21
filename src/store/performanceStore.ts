import { create } from "zustand";

export type CoreVitalName = "LCP" | "INP" | "CLS" | "FCP" | "TTFB";

export interface PerformanceMetric {
  name: CoreVitalName | "long-task" | "resource";
  value: number;
  rating?: "good" | "needs-improvement" | "poor";
  id: string;
  timestamp: number;
  detail?: string;
}

interface PerformanceState {
  metrics: PerformanceMetric[];
  addMetric: (metric: PerformanceMetric) => void;
  clearMetrics: () => void;
}

const MAX_METRICS = 200;

export const usePerformanceStore = create<PerformanceState>((set) => ({
  metrics: [],
  addMetric: (metric) =>
    set((state) => ({
      metrics: [metric, ...state.metrics].slice(0, MAX_METRICS),
    })),
  clearMetrics: () => set({ metrics: [] }),
}));
