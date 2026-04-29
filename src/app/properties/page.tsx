"use client";

import React, { Suspense } from "react";
import { SearchFilterForm } from "@/components/forms/SearchFilterForm";
import { SearchResults } from "@/components/SearchResults";
import { WalletConnector } from "@/components/WalletConnector";
import { NotificationCenter } from "@/components/NotificationCenter";
import { Button } from "@/components/ui/button";
import { usePropertySearch } from "@/hooks/usePropertySearchQuery";
import { useSearchStore } from "@/store/searchStore";
import { useNotificationStore } from "@/store/notificationStore";
import { useWalletStore } from "@/store/walletStore";
import { useNotificationChecker } from "@/hooks/useNotificationChecker";
import { useFavoritesStore } from "@/store/favoritesStore";
import Link from "next/link";
import { Heart } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import PropertyPageSkeleton from "@/components/PropertyPageSkeleton";

function PropertiesContent() {
  const { viewMode: storeViewMode, setViewMode: setStoreViewMode } =
    useSearchStore();
  const { address } = useWalletStore();
  const { alerts, markAsRead, markAllAsRead, clearAlert } =
    useNotificationStore();

  // Set up notification checker
  useNotificationChecker();

  // Ensure viewMode is only 'grid' or 'list' for now (map view not implemented yet)
  const viewMode: "grid" | "list" =
    storeViewMode === "map" ? "grid" : storeViewMode;
  const setViewMode = (mode: "grid" | "list") => setStoreViewMode(mode);

  const { favorites } = useFavoritesStore();

  const {
    filters,
    sortBy,
    page,
    properties,
    totalResults,
    totalPages,
    isLoading,
    error,
    setFilter,
    clearFilters,
    setSortBy,
    setPage,
  } = usePropertySearch();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex items-center gap-3">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">PC</span>
              </div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                PropChain
              </h1>
            </Link>
            <div className="flex items-center gap-3">
              <Link href="/secondary-market">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-blue-600 font-semibold"
                >
                  Secondary Market
                </Button>
              </Link>
              <Link href="/dashboard/saved-searches">
                <Button variant="ghost" size="sm">
                  Saved Searches
                </Button>
              </Link>
              <NotificationCenter
                alerts={alerts}
                onMarkAsRead={markAsRead}
                onMarkAllAsRead={markAllAsRead}
                onClearAlert={clearAlert}
              />
              <Link
                href="/watchlist"
                className="flex items-center gap-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors relative"
              >
                <Heart className="w-5 h-5" />
                <span className="hidden sm:inline">Watchlist</span>
                {favorites.length > 0 && (
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                    {favorites.length}
                  </span>
                )}
              </Link>
              <WalletConnector />
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">
            Discover Tokenized Real Estate
          </h1>
          <SearchFilterForm
            filters={filters}
            onApplyFilters={setFilter}
            onClearFilters={clearFilters}
          />
        </div>

        <div className="mt-10">
          {/* Search Results */}
          <SearchResults
            properties={properties}
            totalResults={totalResults}
            isLoading={isLoading}
            error={error}
            viewMode={viewMode}
            sortBy={sortBy}
            page={page}
            totalPages={totalPages}
            filters={filters}
            onViewModeChange={setViewMode}
            onSortChange={setSortBy}
            onPageChange={setPage}
          />
        </div>
      </div>
    </div>
  );
}

export default function PropertiesPage() {
  return (
    <Suspense fallback={<PropertyPageSkeleton />}>
      <PropertiesContent />
    </Suspense>
  );
}
