'use client';

import React, { useState } from 'react';
import type { SearchFilters, PropertyType, BlockchainNetwork } from '@/types/property';
import { PROPERTY_TYPE_LABELS, BLOCKCHAIN_LABELS } from '@/types/property';

interface FilterSidebarProps {
  filters: SearchFilters;
  onFilterChange: <K extends keyof SearchFilters>(key: K, value: SearchFilters[K]) => void;
  onClearFilters: () => void;
}

export const FilterSidebar: React.FC<FilterSidebarProps> = ({
  filters,
  onFilterChange,
  onClearFilters,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const togglePropertyType = (type: PropertyType) => {
    const current = filters.propertyTypes || [];
    const updated = current.includes(type)
      ? current.filter(t => t !== type)
      : [...current, type];
    onFilterChange('propertyTypes', updated);
  };

  const toggleBlockchain = (chain: BlockchainNetwork) => {
    const current = filters.blockchains || [];
    const updated = current.includes(chain)
      ? current.filter(c => c !== chain)
      : [...current, chain];
    onFilterChange('blockchains', updated);
  };

  const hasActiveFilters = () => {
    return (
      filters.priceRange[0] > 0 ||
      filters.priceRange[1] < 10000000 ||
      filters.propertyTypes.length > 0 ||
      filters.blockchains.length > 0 ||
      filters.roiMin > 0 ||
      filters.roiMax < 100 ||
      filters.location ||
      filters.bedrooms.length > 0 ||
      filters.bathrooms.length > 0 ||
      filters.squareFeetRange[0] > 0 ||
      filters.squareFeetRange[1] < 50000
    );
  };

  return (
    <>
      {/* Mobile Filter Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="lg:hidden fixed bottom-6 right-6 z-40 bg-blue-600 text-white px-6 py-3 rounded-full shadow-lg flex items-center gap-2"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
        </svg>
        Filters
        {hasActiveFilters() && (
          <span className="bg-white text-blue-600 text-xs font-bold px-2 py-0.5 rounded-full">
            Active
          </span>
        )}
      </button>

      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={`
          fixed lg:sticky top-0 left-0 h-screen lg:h-auto w-80 bg-white dark:bg-gray-800 
          border-r lg:border-r-0 border-gray-200 dark:border-gray-700 
          overflow-y-auto z-50 lg:z-0 transition-transform duration-300
          ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Filters</h2>
            <div className="flex items-center gap-2">
              {hasActiveFilters() && (
                <button
                  onClick={onClearFilters}
                  className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400"
                >
                  Clear all
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="lg:hidden text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Price Range */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Price Range
            </label>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-gray-500 dark:text-gray-400">Min Price</label>
                <input
                  type="number"
                  value={filters.priceRange[0]}
                  onChange={(e) => onFilterChange('priceRange', [Number(e.target.value), filters.priceRange[1]])}
                  className="w-full mt-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="$0"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 dark:text-gray-400">Max Price</label>
                <input
                  type="number"
                  value={filters.priceRange[1]}
                  onChange={(e) => onFilterChange('priceRange', [filters.priceRange[0], Number(e.target.value)])}
                  className="w-full mt-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="$10,000,000"
                />
              </div>
            </div>
          </div>

          {/* Property Type */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Property Type
            </label>
            <div className="space-y-2">
              {(Object.keys(PROPERTY_TYPE_LABELS) as PropertyType[]).map((type) => (
                <label key={type} className="flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={filters.propertyTypes.includes(type)}
                    onChange={() => togglePropertyType(type)}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                    {PROPERTY_TYPE_LABELS[type]}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Blockchain */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Blockchain Network
            </label>
            <div className="space-y-2">
              {(Object.keys(BLOCKCHAIN_LABELS) as BlockchainNetwork[]).map((chain) => (
                <label key={chain} className="flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={filters.blockchains.includes(chain)}
                    onChange={() => toggleBlockchain(chain)}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                    {BLOCKCHAIN_LABELS[chain]}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* ROI Range */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              ROI (Annual %)
            </label>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-gray-500 dark:text-gray-400">Min ROI</label>
                <input
                  type="number"
                  value={filters.roiMin}
                  onChange={(e) => onFilterChange('roiMin', Number(e.target.value))}
                  className="w-full mt-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="0%"
                  min="0"
                  max="100"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 dark:text-gray-400">Max ROI</label>
                <input
                  type="number"
                  value={filters.roiMax}
                  onChange={(e) => onFilterChange('roiMax', Number(e.target.value))}
                  className="w-full mt-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="100%"
                  min="0"
                  max="100"
                />
              </div>
            </div>
          </div>

          {/* Bedrooms */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Bedrooms
            </label>
            <div className="flex flex-wrap gap-2">
              {[1, 2, 3, 4, 5].map((num) => (
                <button
                  key={num}
                  onClick={() => {
                    const current = filters.bedrooms || [];
                    const updated = current.includes(num)
                      ? current.filter(n => n !== num)
                      : [...current, num];
                    onFilterChange('bedrooms', updated);
                  }}
                  className={`px-4 py-2 rounded-lg border transition-colors ${
                    filters.bedrooms.includes(num)
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:border-blue-600'
                  }`}
                >
                  {num}+
                </button>
              ))}
            </div>
          </div>

          {/* Bathrooms */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Bathrooms
            </label>
            <div className="flex flex-wrap gap-2">
              {[1, 2, 3, 4].map((num) => (
                <button
                  key={num}
                  onClick={() => {
                    const current = filters.bathrooms || [];
                    const updated = current.includes(num)
                      ? current.filter(n => n !== num)
                      : [...current, num];
                    onFilterChange('bathrooms', updated);
                  }}
                  className={`px-4 py-2 rounded-lg border transition-colors ${
                    filters.bathrooms.includes(num)
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:border-blue-600'
                  }`}
                >
                  {num}+
                </button>
              ))}
            </div>
          </div>

          {/* Square Feet */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Square Feet
            </label>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-gray-500 dark:text-gray-400">Min Sqft</label>
                <input
                  type="number"
                  value={filters.squareFeetRange[0]}
                  onChange={(e) => onFilterChange('squareFeetRange', [Number(e.target.value), filters.squareFeetRange[1]])}
                  className="w-full mt-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="0"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 dark:text-gray-400">Max Sqft</label>
                <input
                  type="number"
                  value={filters.squareFeetRange[1]}
                  onChange={(e) => onFilterChange('squareFeetRange', [filters.squareFeetRange[0], Number(e.target.value)])}
                  className="w-full mt-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="50,000"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
