import { Skeleton } from "@/components/ui/skeleton";
import { CardSkeleton } from "@/components/ui/LoadingSkeletons";

/**
 * Skeleton fallback for the properties listing page.
 * Matches the layout of PropertiesContent so there is no layout shift.
 */
export default function PropertyPageSkeleton() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header skeleton */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Skeleton className="h-8 w-32" />
            <div className="flex items-center gap-3">
              <Skeleton className="h-8 w-24" />
              <Skeleton className="h-8 w-24" />
              <Skeleton className="h-8 w-8 rounded-full" />
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Title + filter skeleton */}
        <div className="mb-8 space-y-4">
          <Skeleton className="h-9 w-72" />
          <div className="flex flex-wrap gap-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-28 rounded-lg" />
            ))}
          </div>
        </div>

        {/* Property card grid skeleton */}
        <CardSkeleton count={9} viewMode="grid" />
      </div>
    </div>
  );
}
