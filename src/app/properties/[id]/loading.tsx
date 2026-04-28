import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Back button + title */}
        <div className="space-y-2">
          <Skeleton className="h-8 w-24" />
          <Skeleton className="h-10 w-96" />
        </div>

        {/* Main content grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left column - images + details */}
          <div className="lg:col-span-2 space-y-6">
            <Skeleton className="h-96 rounded-xl" />
            <Skeleton className="h-64 rounded-xl" />
          </div>

          {/* Right column - purchase card */}
          <div className="space-y-6">
            <Skeleton className="h-80 rounded-xl" />
            <Skeleton className="h-48 rounded-xl" />
          </div>
        </div>
      </div>
    </div>
  );
}
