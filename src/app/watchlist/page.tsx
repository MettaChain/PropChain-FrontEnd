'use client';

import React from 'react';
import Link from 'next/link';
import { PropertyCard } from '@/components/PropertyCard';
import { useFavoritesStore } from '@/store/favoritesStore';
import { WalletConnector } from '@/components/WalletConnector';
import { Heart, ArrowLeft } from 'lucide-react';
import { EmptyState } from '@/components/ui/EmptyState';

function WatchlistContent() {
  const { favorites, clearFavorites } = useFavoritesStore();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-4">
              <Link
                href="/properties"
                className="flex items-center gap-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
                <span className="hidden sm:inline">Back to Properties</span>
              </Link>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">PC</span>
                </div>
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                  PropChain
                </h1>
              </div>
            </div>
            <WalletConnector />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <Heart className="w-8 h-8 text-red-500" />
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              My Watchlist
            </h1>
            {favorites.length > 0 && (
              <span className="bg-red-100 text-red-800 text-sm font-medium px-2.5 py-0.5 rounded-full">
                {favorites.length} {favorites.length === 1 ? 'property' : 'properties'}
              </span>
            )}
          </div>
          <p className="text-gray-600 dark:text-gray-400">
            Keep track of your favorite properties and monitor their performance.
          </p>
        </div>

        {/* Content */}
        {favorites.length === 0 ? (
          <EmptyState
            title="Your watchlist is empty"
            description="Start exploring properties and add them to your watchlist to keep track of the ones you're interested in."
            icon={Heart}
            action={{
              label: "Browse Properties",
              href: "/properties"
            }}
          />
        ) : (
          /* Properties Grid */
          <>
            <div className="flex justify-between items-center mb-6">
              <p className="text-gray-600 dark:text-gray-400">
                Showing {favorites.length} favorited {favorites.length === 1 ? 'property' : 'properties'}
              </p>
              <button
                onClick={clearFavorites}
                className="text-red-600 hover:text-red-700 font-medium text-sm transition-colors"
              >
                Clear All
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {favorites.map((property) => (
                <PropertyCard
                  key={property.id}
                  property={property}
                  viewMode="grid"
                />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default function WatchlistPage() {
  return <WatchlistContent />;
}