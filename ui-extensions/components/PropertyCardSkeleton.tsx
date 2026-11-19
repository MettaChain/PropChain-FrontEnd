import * as React from 'react';

interface PropertyCardSkeletonProps {
  /** Number of skeleton cards, clamped to 1-12 */
  count?: number;
  className?: string;
}

const bar = 'ui-skeleton-shimmer rounded bg-gray-200 dark:bg-gray-700';

export function PropertyCardSkeleton({ count = 6, className = '' }: PropertyCardSkeletonProps) {
  const n = Math.min(12, Math.max(1, Math.floor(count)));
  return (
    <div
      className={`grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 ${className}`}
      aria-busy="true"
      aria-label="Loading properties"
    >
      <style>{`
        @keyframes ui-skeleton-shimmer {
          0% { opacity: 1; }
          50% { opacity: 0.5; }
          100% { opacity: 1; }
        }
        .ui-skeleton-shimmer { animation: ui-skeleton-shimmer 1.5s ease-in-out infinite; }
        @media (prefers-reduced-motion: reduce) {
          .ui-skeleton-shimmer { animation: none; }
        }
      `}</style>
      {Array.from({ length: n }, (_, i) => (
        <div
          key={i}
          className="overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700"
        >
          <div className={`${bar} aspect-[4/3] w-full rounded-none`} />
          <div className="space-y-3 p-4">
            <div className={`${bar} h-5 w-3/4`} />
            <div className={`${bar} h-4 w-1/2`} />
            <div className="flex justify-between">
              <div className={`${bar} h-6 w-1/3`} />
              <div className={`${bar} h-6 w-1/4`} />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default PropertyCardSkeleton;
