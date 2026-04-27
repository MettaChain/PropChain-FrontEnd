'use client';

import React from 'react';
import Link from 'next/link';
import { X, BarChart3 } from 'lucide-react';
import { useComparisonStore } from '@/store/comparisonStore';
import { formatPrice } from '@/utils/searchUtils';

export const FloatingComparisonBar: React.FC = () => {
  const { selectedProperties, removeProperty, clearProperties } = useComparisonStore();

  if (selectedProperties.length === 0) return null;

  return (
    <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-4 min-w-[400px]">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-blue-600" />
            <span className="font-semibold text-gray-900 dark:text-white">
              Compare Properties ({selectedProperties.length}/3)
            </span>
          </div>
          <button
            onClick={clearProperties}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            title="Clear all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-center gap-2 mb-3">
          {selectedProperties.map((property) => (
            <div
              key={property.id}
              className="flex items-center gap-2 bg-gray-100 dark:bg-gray-700 rounded-lg px-3 py-2 flex-1"
            >
              <span className="text-sm font-medium text-gray-900 dark:text-white truncate">
                {property.name}
              </span>
              <span className="text-xs text-gray-600 dark:text-gray-400">
                {formatPrice(property.price.total)}
              </span>
              <button
                onClick={() => removeProperty(property)}
                className="text-gray-500 hover:text-red-500 ml-1"
                title="Remove from comparison"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>

        <div className="flex justify-end">
          <Link
            href={`/compare?ids=${selectedProperties.map(p => p.id).join(',')}`}
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-2 rounded-lg transition-colors"
          >
            Compare Now
          </Link>
        </div>
      </div>
    </div>
  );
};</content>
<parameter name="filePath">/home/semicolon/Documents/Drip/PropChain-FrontEnd/src/components/FloatingComparisonBar.tsx