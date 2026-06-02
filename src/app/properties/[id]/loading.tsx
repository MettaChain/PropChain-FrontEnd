import { PropertyDetailSkeleton } from "@/components/ui/LoadingSkeletons";

export default function Loading() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        <PropertyDetailSkeleton />
      </div>
    </div>
  );
}
