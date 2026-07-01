import React from 'react';

interface AnalyticsTableShimmerProps {
  rows?: number;
}

export function AnalyticsTableShimmer({
  rows = 6,
}: AnalyticsTableShimmerProps) {
  return (
    <div
      role="status"
      aria-label="Loading analytics data"
      className="animate-pulse"
    >
      <div className="space-y-3">
        {Array.from({ length: rows }).map((_, index) => (
          <div
            key={index}
            className="grid grid-cols-5 gap-4 rounded-lg border border-gray-200 dark:border-gray-700 p-4"
          >
            <div className="h-4 rounded bg-gray-200 dark:bg-gray-700" />
            <div className="h-4 rounded bg-gray-200 dark:bg-gray-700" />
            <div className="h-4 rounded bg-gray-200 dark:bg-gray-700" />
            <div className="h-4 rounded bg-gray-200 dark:bg-gray-700" />
            <div className="h-4 rounded bg-gray-200 dark:bg-gray-700" />
          </div>
        ))}
      </div>
    </div>
  );
}