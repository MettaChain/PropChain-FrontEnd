'use client';

import React, { Suspense } from 'react';
import { PropertySearch } from '@/components/PropertySearch';
import { FilterSidebar } from '@/components/FilterSidebar';
import { SearchResults } from '@/components/SearchResults';
import { WalletConnector } from '@/components/WalletConnector';
import { usePropertySearch } from '@/hooks/usePropertySearch';
import { useSearchStore } from '@/store/searchStore';
import Link from 'next/link';

function PropertiesContent() {
  const { viewMode: storeViewMode, setViewMode: setStoreViewMode } = useSearchStore();
  
  // Ensure viewMode is only 'grid' or 'list' for now (map view not implemented yet)
  const viewMode = (storeViewMode === 'map' ? 'grid' : storeViewMode) as 'grid' | 'list';
  const setViewMode = (mode: 'grid' | 'list') => setStoreViewMode(mode);
  
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
            <WalletConnector />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search Bar */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">
            Discover Tokenized Real Estate
          </h1>
          <PropertySearch
            value={filters.query}
            onChange={(value) => setFilter('query', value)}
          />
        </div>

        {/* Layout: Sidebar + Results */}
        <div className="flex gap-8">
          {/* Filter Sidebar */}
          <FilterSidebar
            filters={filters}
            onFilterChange={setFilter}
            onClearFilters={clearFilters}
          />

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
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Loading properties...</p>
        </div>
      </div>
    }>
      <PropertiesContent />
    </Suspense>
  );
}
