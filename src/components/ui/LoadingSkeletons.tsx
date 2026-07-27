import React from "react"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"

interface CardSkeletonProps {
  viewMode?: "grid" | "list"
  count?: number
  className?: string
}

/**
 * Reusable CardSkeleton that matches the layout of PropertyCard.
 * Supports both grid and list view modes.
 */
export function CardSkeleton({ viewMode = "grid", count = 1, className }: CardSkeletonProps) {
  const isListView = viewMode === "list"

  return (
    <div
      className={cn(
        isListView
          ? "flex flex-col gap-6"
          : "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6",
        className
      )}
    >
      {Array.from({ length: count }).map((_, idx) => (
        <div
          key={idx}
          className={cn(
            "bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden border border-gray-100 dark:border-gray-700/50",
            isListView ? "flex flex-col md:flex-row w-full" : "flex flex-col w-full"
          )}
        >
          {/* Image Skeleton */}
          <div
            className={cn(
              "relative bg-gray-100 dark:bg-gray-700/30",
              isListView
                ? "w-full md:w-64 h-48 md:h-full flex-shrink-0 min-h-[192px]"
                : "w-full h-56"
            )}
          >
            <Skeleton className="absolute inset-0 rounded-none w-full h-full" />
            
            {/* Top Left Badges */}
            <div className="absolute top-3 left-3 flex flex-col gap-2">
              <Skeleton className="h-5 w-20 rounded" />
              <Skeleton className="h-5 w-16 rounded" />
            </div>

            {/* Top Right ROI Badge */}
            <div className="absolute top-3 right-3 flex gap-2">
              <Skeleton className="h-8 w-16 rounded-lg" />
              <Skeleton className="h-8 w-8 rounded-lg" />
            </div>

            {/* Bottom Left Blockchain Badge */}
            <div className="absolute bottom-3 left-3">
              <Skeleton className="h-6 w-24 rounded-full" />
            </div>
          </div>

          {/* Content Area Skeleton */}
          <div className="p-4 sm:p-5 flex flex-col flex-1 justify-between space-y-4">
            <div className="space-y-3">
              {/* Property Type Icon + Label */}
              <div className="flex items-center gap-2">
                <Skeleton className="h-5 w-5 rounded-full" />
                <Skeleton className="h-4 w-24 rounded" />
              </div>

              {/* Title */}
              <div className="space-y-2">
                <Skeleton className="h-6 w-11/12 rounded" />
                <Skeleton className="h-6 w-2/3 rounded" />
              </div>

              {/* Location */}
              <div className="flex items-center gap-1.5">
                <Skeleton className="h-4 w-4 rounded-full" />
                <Skeleton className="h-4 w-48 rounded" />
              </div>

              {/* Details (Bedrooms, Bathrooms, Sqft) */}
              <div className="flex items-center gap-4 pt-1">
                <Skeleton className="h-4 w-12 rounded" />
                <Skeleton className="h-4 w-12 rounded" />
                <Skeleton className="h-4 w-16 rounded" />
              </div>
            </div>

            {/* Token Info Row */}
            <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/40 rounded-lg">
              <div className="space-y-1.5">
                <Skeleton className="h-3 w-20 rounded" />
                <Skeleton className="h-4 w-28 rounded" />
              </div>
              <div className="space-y-1.5 flex flex-col items-end">
                <Skeleton className="h-3 w-16 rounded" />
                <Skeleton className="h-4 w-16 rounded" />
              </div>
            </div>

            {/* Price and CTA Row */}
            <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-gray-700/50 gap-4">
              <div className="space-y-1.5">
                <Skeleton className="h-3 w-16 rounded" />
                <Skeleton className="h-6 w-24 rounded" />
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <Skeleton className="h-9 w-9 rounded-lg" />
                <Skeleton className="h-9 w-24 rounded-lg" />
                <Skeleton className="h-9 w-14 rounded-lg" />
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

interface TableSkeletonProps {
  rows?: number
  columns?: number
  showHeader?: boolean
  className?: string
}

/**
 * Reusable TableSkeleton that matches next.js/shadcn tables.
 * Ideal for transaction tables, logs, list layouts.
 */
export function TableSkeleton({
  rows = 5,
  columns = 5,
  showHeader = true,
  className,
}: TableSkeletonProps) {
  return (
    <div className={cn("w-full overflow-hidden rounded-lg border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900/50", className)}>
      <div className="w-full overflow-x-auto">
        <table className="w-full border-collapse text-left text-sm text-gray-500">
          {showHeader && (
            <thead className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-100 dark:border-gray-800">
              <tr>
                {Array.from({ length: columns }).map((_, i) => (
                  <th key={i} className="px-6 py-4 font-semibold text-gray-900 dark:text-gray-200">
                    <Skeleton className="h-4 w-20" />
                  </th>
                ))}
              </tr>
            </thead>
          )}
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            {Array.from({ length: rows }).map((_, rIdx) => (
              <tr key={rIdx} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/20">
                {Array.from({ length: columns }).map((_, cIdx) => (
                  <td key={cIdx} className="px-6 py-4">
                    <Skeleton
                      className={cn(
                        "h-4 rounded",
                        cIdx === 0
                          ? "w-28 font-mono"
                          : cIdx === columns - 1
                          ? "w-16 ml-auto"
                          : "w-24"
                      )}
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

interface ProfileSkeletonProps {
  className?: string
}

/**
 * Reusable ProfileSkeleton that matches ProfileSettingsForm and KYC layouts.
 */
export function ProfileSkeleton({ className }: ProfileSkeletonProps) {
  return (
    <div className={cn("max-w-3xl mx-auto space-y-6 rounded-3xl border border-gray-200/80 bg-white p-6 shadow-sm dark:border-gray-700/50 dark:bg-gray-900", className)}>
      {/* Header section */}
      <div className="border-b border-gray-100 dark:border-gray-800 pb-5">
        <Skeleton className="h-7 w-48 rounded" />
        <Skeleton className="h-4 w-96 rounded mt-2 max-w-full" />
      </div>

      {/* Profile avatar upload mock */}
      <div className="flex items-center gap-4 py-2">
        <Skeleton className="h-16 w-16 rounded-full" />
        <div className="space-y-2">
          <Skeleton className="h-5 w-32 rounded" />
          <Skeleton className="h-3.5 w-48 rounded" />
        </div>
      </div>

      {/* Form fields */}
      <div className="space-y-5">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-4 w-28 rounded" />
            <Skeleton className="h-10 w-full rounded-md" />
            {i === 2 && <Skeleton className="h-3.5 w-64 rounded" />}
          </div>
        ))}

        {/* Switch field (Product updates toggle) */}
        <div className="flex items-start justify-between p-4 rounded-lg bg-gray-50 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-800/30">
          <div className="space-y-1.5">
            <Skeleton className="h-4 w-40 rounded" />
            <Skeleton className="h-3 w-72 rounded max-w-full" />
          </div>
          <Skeleton className="h-6 w-11 rounded-full flex-shrink-0" />
        </div>
      </div>

      {/* Form Action Buttons */}
      <div className="flex items-center gap-3 pt-4 border-t border-gray-100 dark:border-gray-800">
        <Skeleton className="h-10 w-32 rounded-lg" />
        <Skeleton className="h-10 w-24 rounded-lg" />
      </div>
    </div>
  )
}

interface DashboardSkeletonProps {
  className?: string
}

/**
 * Reusable DashboardSkeleton representing portfolio details, stats, charts, and activity.
 */
export function DashboardSkeleton({ className }: DashboardSkeletonProps) {
  return (
    <div className={cn("space-y-6", className)}>
      {/* Header title & primary buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-2">
          <Skeleton className="h-8 w-56 rounded" />
          <Skeleton className="h-4 w-72 rounded" />
        </div>
        <div className="flex items-center gap-3">
          <Skeleton className="h-10 w-28 rounded-lg" />
          <Skeleton className="h-10 w-32 rounded-lg" />
        </div>
      </div>

      {/* Stats Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-100 dark:border-gray-700/50 space-y-3 shadow-sm"
          >
            <div className="flex items-center justify-between">
              <Skeleton className="h-4 w-28 rounded" />
              <Skeleton className="h-5 w-5 rounded-full" />
            </div>
            <Skeleton className="h-8 w-36 rounded" />
            <div className="flex items-center gap-1.5 pt-1">
              <Skeleton className="h-3.5 w-10 rounded" />
              <Skeleton className="h-3 w-24 rounded" />
            </div>
          </div>
        ))}
      </div>

      {/* Chart Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-100 dark:border-gray-700/50 space-y-4 shadow-sm">
          <div className="flex justify-between items-center">
            <Skeleton className="h-5 w-40 rounded" />
            <Skeleton className="h-8 w-24 rounded-lg" />
          </div>
          <Skeleton className="h-72 w-full rounded-lg" />
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-100 dark:border-gray-700/50 space-y-4 shadow-sm">
          <Skeleton className="h-5 w-36 rounded" />
          <div className="flex justify-center py-6">
            <Skeleton className="h-44 w-44 rounded-full" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-full rounded" />
            <Skeleton className="h-4 w-5/6 rounded" />
          </div>
        </div>
      </div>

      {/* Transaction / Activity Table */}
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <Skeleton className="h-6 w-48 rounded" />
          <Skeleton className="h-8 w-20 rounded-lg" />
        </div>
        <TableSkeleton rows={5} columns={6} />
      </div>
    </div>
  )
}

interface PropertyDetailSkeletonProps {
  className?: string
}

/**
 * Reusable PropertyDetailSkeleton for single property details view.
 */
export function PropertyDetailSkeleton({ className }: PropertyDetailSkeletonProps) {
  return (
    <div className={cn("space-y-6", className)}>
      {/* Back button + title */}
      <div className="space-y-2.5">
        <Skeleton className="h-8 w-24 rounded-lg" />
        <Skeleton className="h-10 w-96 max-w-full rounded" />
      </div>

      {/* Main content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column - images + details */}
        <div className="lg:col-span-2 space-y-6">
          <Skeleton className="h-96 w-full rounded-xl" />
          
          <div className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-100 dark:border-gray-700/50 space-y-4 shadow-sm">
            <Skeleton className="h-6 w-40 rounded" />
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="p-3 bg-gray-50 dark:bg-gray-800/40 rounded-lg space-y-2">
                  <Skeleton className="h-3 w-16 rounded" />
                  <Skeleton className="h-5 w-24 rounded" />
                </div>
              ))}
            </div>
            <div className="space-y-2 pt-2">
              <Skeleton className="h-4 w-full rounded" />
              <Skeleton className="h-4 w-full rounded" />
              <Skeleton className="h-4 w-3/4 rounded" />
            </div>
          </div>
        </div>

        {/* Right column - purchase card */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-100 dark:border-gray-700/50 space-y-5 shadow-sm">
            <Skeleton className="h-6 w-32 rounded" />
            <div className="space-y-2">
              <Skeleton className="h-8 w-44 rounded" />
              <Skeleton className="h-4 w-28 rounded" />
            </div>
            <Skeleton className="h-2 w-full rounded-full" />
            <div className="space-y-3 pt-2">
              <Skeleton className="h-11 w-full rounded-lg" />
              <Skeleton className="h-10 w-full rounded-lg" />
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-100 dark:border-gray-700/50 space-y-4 shadow-sm">
            <Skeleton className="h-5 w-36 rounded" />
            <div className="space-y-3">
              <div className="flex justify-between">
                <Skeleton className="h-4 w-24 rounded" />
                <Skeleton className="h-4 w-16 rounded" />
              </div>
              <div className="flex justify-between">
                <Skeleton className="h-4 w-32 rounded" />
                <Skeleton className="h-4 w-12 rounded" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

