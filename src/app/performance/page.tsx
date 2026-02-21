"use client";

import { useMemo } from "react";
import { usePerformanceStore } from "@/store/performanceStore";

const target = {
  LCP: 2500,
  INP: 200,
  CLS: 0.1,
};

export default function PerformancePage() {
  const metrics = usePerformanceStore((state) => state.metrics);

  const latest = useMemo(() => {
    const map = new Map<string, number>();
    for (const metric of metrics) {
      if (!map.has(metric.name)) {
        map.set(metric.name, metric.value);
      }
    }
    return {
      LCP: map.get("LCP"),
      INP: map.get("INP"),
      CLS: map.get("CLS"),
      FCP: map.get("FCP"),
      TTFB: map.get("TTFB"),
    };
  }, [metrics]);

  const rows = metrics.slice(0, 30);

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Performance Dashboard</h1>

        <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <MetricCard label="LCP" value={latest.LCP} budget={target.LCP} unit="ms" />
          <MetricCard label="INP" value={latest.INP} budget={target.INP} unit="ms" />
          <MetricCard label="CLS" value={latest.CLS} budget={target.CLS} unit="" />
        </section>

        <section className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
            <h2 className="font-semibold text-gray-900 dark:text-white">Recent Metrics</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-100 dark:bg-gray-700/50 text-left">
                <tr>
                  <th className="px-4 py-2">Metric</th>
                  <th className="px-4 py-2">Value</th>
                  <th className="px-4 py-2">Rating</th>
                  <th className="px-4 py-2">Detail</th>
                  <th className="px-4 py-2">Time</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id} className="border-t border-gray-200 dark:border-gray-700">
                    <td className="px-4 py-2">{row.name}</td>
                    <td className="px-4 py-2">{row.value.toFixed(row.name === "CLS" ? 3 : 1)}</td>
                    <td className="px-4 py-2">{row.rating ?? "-"}</td>
                    <td className="px-4 py-2 truncate max-w-[400px]">{row.detail ?? "-"}</td>
                    <td className="px-4 py-2">{new Date(row.timestamp).toLocaleTimeString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </main>
  );
}

function MetricCard({
  label,
  value,
  budget,
  unit,
}: {
  label: string;
  value: number | undefined;
  budget: number;
  unit: string;
}) {
  const isGood = value !== undefined && value <= budget;
  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
      <p className="text-sm text-gray-500 dark:text-gray-400">{label}</p>
      <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
        {value !== undefined ? `${value.toFixed(label === "CLS" ? 3 : 1)}${unit}` : "--"}
      </p>
      <p className={`text-xs mt-2 ${isGood ? "text-green-600" : "text-amber-600"}`}>
        Budget {label}: {budget}
        {unit}
      </p>
    </div>
  );
}
