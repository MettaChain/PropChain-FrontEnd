'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Clock, Trash2, X } from 'lucide-react';
import { useRecentlyViewedStore } from '@/store/recentlyViewedStore';
import { formatPrice } from '@/utils/searchUtils';

export const RecentlyViewed: React.FC = () => {
  const { properties, removeProperty, clearHistory } = useRecentlyViewedStore();

  if (properties.length === 0) return null;

  const formatTimeAgo = (timestamp: number) => {
    const now = Date.now();
    const diffMs = now - timestamp;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  return (
    <section className="mt-12">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Clock className="w-5 h-5 text-blue-600" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Recently Viewed
          </h2>
        </div>
        <button
          onClick={clearHistory}
          className="text-sm text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 flex items-center gap-2"
        >
          <Trash2 className="w-4 h-4" />
          Clear All
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {properties.map((property) => (
          <div
            key={property.id}
            className="group relative bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-lg transition-shadow border border-gray-200 dark:border-gray-700 overflow-hidden"
          >
            <Link href={`/properties/${property.id}`} className="block">
              <div className="relative h-40 w-full bg-gray-200 dark:bg-gray-700">
                <Image
                  src={property.image}
                  alt={property.name}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </div>
              <div className="p-3">
                <h3 className="font-semibold text-gray-900 dark:text-white text-sm truncate mb-1">
                  {property.name}
                </h3>
                <p className="text-xs text-gray-600 dark:text-gray-400 truncate mb-2">
                  {property.location}
                </p>
                <p className="text-sm font-bold text-blue-600 dark:text-blue-400">
                  {formatPrice(property.price)}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                  {formatTimeAgo(property.viewedAt)}
                </p>
              </div>
            </Link>
            <button
              onClick={(e) => {
                e.preventDefault();
                removeProperty(property.id);
              }}
              className="absolute top-2 right-2 p-1 bg-white dark:bg-gray-800 rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-50 dark:hover:bg-red-900"
              title="Remove from history"
            >
              <X className="w-4 h-4 text-gray-600 dark:text-gray-400 hover:text-red-600" />
            </button>
          </div>
        ))}
      </div>
    </section>
  );
};
