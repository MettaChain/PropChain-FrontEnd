'use client';

import React, { useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ShoppingCart, Plus, CheckSquare, Square, Heart, Star } from 'lucide-react';
import type { Property } from '@/types/property';
import { formatPrice, formatNumber, formatROI, getBlockchainColor } from '@/utils/searchUtils';
import { BLOCKCHAIN_LABELS, PROPERTY_TYPE_LABELS } from '@/types/property';
import { useCartStore } from '@/store/cartStore';
import { useComparisonStore } from '@/store/comparisonStore';
import { useCompareStore } from '@/store/compareStore';
import { useFavoritesStore } from '@/store/favoritesStore';
import { ShareButton } from './property/ShareButton';
import { CurrencyToggle } from './property/CurrencyToggle';

interface PropertyCardProps {
  property: Property;
  viewMode?: 'grid' | 'list';
}

const PropertyCardInner: React.FC<PropertyCardProps> = ({ 
  property, 
  viewMode = 'grid' 
}) => {
  const isListView = viewMode === 'list';
  const { addItem } = useCartStore();
  const { isPropertySelected, toggleProperty } = useComparisonStore();

  const isSelectedForComparison = isPropertySelected(property.id);
  const selectedIds = useCompareStore((state) => state.selectedIds);
  const togglePropertyId = useCompareStore((state) => state.toggleProperty);

  const isCompared = selectedIds.includes(property.id);
  const compareLimitReached = selectedIds.length >= 3 && !isCompared;
  const { addFavorite, removeFavorite, isFavorite } = useFavoritesStore();

  const handleAddToCart = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addItem(property, 1);
  }, [addItem, property]);

  const handleComparisonToggle = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleProperty(property);
  }, [toggleProperty, property]);

  const handleCompareToggle = useCallback((e: React.MouseEvent<HTMLInputElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (!compareLimitReached) {
      togglePropertyId(property.id);
    }
  }, [compareLimitReached, togglePropertyId, property.id]);

  const handleToggleFavorite = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isFavorite(property.id)) {
      removeFavorite(property.id);
    } else {
      addFavorite(property);
    }
  }, [isFavorite, removeFavorite, addFavorite, property]);

  return (
    <article
      className={`bg-white dark:bg-gray-800 rounded-xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden ${
        isListView ? 'flex flex-row' : 'flex flex-col'
      }`}
    >
{/* Image */}
        <div className={`relative overflow-hidden ${isListView ? 'w-64 flex-shrink-0' : 'w-full h-56'}`}>
          <Image
            src={property.images[0]}
            alt={`${property.name} - ${PROPERTY_TYPE_LABELS[property.propertyType]} property in ${property.location.city}, ${property.location.state}`}
            fill
            className="object-cover group-hover:scale-110 transition-transform duration-300"
          />
        
{/* Badge Container */}
        {/*
         * Badge palette tuned for WCAG AA contrast (>=4.5:1) on both light
         * and dark surfaces. Light mode: white text on saturated dark colour.
         * Dark mode: white text on slightly lighter hue, still well above 4.5:1
         * against the gray-800 card surface.
         *   Featured:  bg-yellow-700/800   (>=4.7:1 vs white)
         *   Verified:  bg-emerald-700/800 (>=4.7:1 vs white)
         *   ROI:       bg-blue-700/800     (>=6:1 vs white)
         */}
        <div className="absolute top-2 left-2 sm:top-3 sm:left-3 flex flex-col gap-1 sm:gap-2">
          {property.featured && (
            <span className="bg-yellow-700 dark:bg-yellow-800 text-white text-xs font-semibold px-2 py-0.5 sm:py-1 rounded flex items-center gap-1" role="status" aria-live="polite" aria-label="Featured property">
              <Star className="w-3 h-3" aria-hidden="true" />
              Featured
            </span>
          )}
          {property.verified && (
            <span className="bg-emerald-700 dark:bg-emerald-800 text-white text-xs font-semibold px-2 py-0.5 sm:py-1 rounded flex items-center gap-1" role="status" aria-live="polite" aria-label="Verified property">
              <svg aria-hidden="true" className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Verified
            </span>
          )}
        </div>

        {/* ROI Badge */}
        <div className="absolute top-2 right-20 sm:top-3 sm:right-24" role="status" aria-live="polite" aria-label={`Return on investment: ${formatROI(property.metrics.roi)}`}>
          <div className="bg-blue-700 dark:bg-blue-800 text-white text-xs sm:text-sm font-bold px-2 py-0.5 sm:px-3 sm:py-1.5 rounded-lg shadow-lg">
            {formatROI(property.metrics.roi)} ROI
          </div>
        </div>

        {/* Comparison Toggle */}
        <button
          onClick={handleComparisonToggle}
          className="absolute top-2 right-12 sm:top-3 sm:right-16 bg-white/90 hover:bg-white text-gray-700 hover:text-gray-900 p-2 rounded-lg shadow-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
          title={isSelectedForComparison ? "Remove from comparison" : "Add to comparison"}
          aria-label={isSelectedForComparison ? "Remove property from comparison" : "Add property to comparison"}
          aria-pressed={isSelectedForComparison}
        >
          {isSelectedForComparison ? (
            <CheckSquare className="w-4 h-4" aria-hidden="true" />
          ) : (
            <Square className="w-4 h-4" aria-hidden="true" />
          )}
        </button>

        {/* Favorite Button */}
        <button
          onClick={handleToggleFavorite}
          className="absolute top-2 right-2 sm:top-3 sm:right-3 p-2 bg-white/90 hover:bg-white rounded-full shadow-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2"
          aria-label={isFavorite(property.id) ? `Remove ${property.name} from favorites` : `Add ${property.name} to favorites`}
          aria-pressed={isFavorite(property.id)}
        >
          <Heart
            className={`w-4 h-4 ${
              isFavorite(property.id)
                ? 'fill-red-500 text-red-500'
                : 'text-gray-600 hover:text-red-500'
            }`}
            aria-hidden="true"
          />
        </button>

        {/* Blockchain Badge */}
        <div 
          className="absolute bottom-2 left-2 sm:bottom-3 sm:left-3"
          role="status"
          aria-live="polite"
          aria-label={`Blockchain: ${BLOCKCHAIN_LABELS[property.blockchain]}`}
        >
          <div
            className="text-white text-xs font-semibold px-2 py-0.5 sm:py-1 rounded flex items-center gap-1"
            style={{ backgroundColor: getBlockchainColor(property.blockchain) }}
          >
            <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-white" aria-hidden="true" />
            <span className="truncate max-w-[80px] sm:max-w-none">{BLOCKCHAIN_LABELS[property.blockchain]}</span>
          </div>
        </div>

        {/* Compare Toggle */}
        <div className="absolute top-12 sm:top-14 right-2 sm:right-3">
          <label
            className={`inline-flex items-center gap-2 rounded-full border px-3 py-2 text-xs font-semibold transition-colors ${
              isCompared
                ? 'border-blue-600 bg-blue-600/10 text-blue-700'
                : 'border-white bg-white/90 text-gray-700 hover:bg-gray-100 dark:border-gray-700 dark:bg-gray-900/90 dark:text-gray-200'
            } ${compareLimitReached ? 'cursor-not-allowed opacity-70' : ''}`}
            onClick={(e) => e.stopPropagation()}
          >
            <input
              type="checkbox"
              checked={isCompared}
              onChange={handleCompareToggle}
              onClick={(e) => e.stopPropagation()}
              disabled={compareLimitReached}
              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              aria-label={isCompared ? 'Remove from comparison list' : 'Add to comparison list'}
            />
            <span>{isCompared ? 'Selected' : 'Compare'}</span>
          </label>
        </div>
      </div>

      {/* Content */}
      <div className={`p-3 sm:p-5 flex flex-col ${isListView ? 'flex-1' : ''}`}>
        {/* Property Type */}
        <div className="flex items-center gap-2 mb-2 flex-wrap">
          <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
            {PROPERTY_TYPE_LABELS[property.propertyType]}
          </span>
        </div>

        {/* Title */}
        <h3
          id={`property-${property.id}-name`}
          className="text-base sm:text-lg font-bold text-gray-900 dark:text-white mb-1 sm:mb-2 hover:text-blue-600 dark:hover:text-blue-400 transition-colors line-clamp-2"
        >
          {property.name}
        </h3>

        {/* Location */}
        <div className="flex items-start gap-1 text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-2 sm:mb-3">
          <svg className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <span className="line-clamp-2" aria-label={`Location: ${property.location.city}, ${property.location.state}`}>
            {property.location.city}, {property.location.state}
          </span>
        </div>

        {/* Description */}
        {isListView && (
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">
            {property.description}
          </p>
        )}

        {/* Details */}
        {property.details.bedrooms && (
          <div className="flex items-center gap-4 text-sm text-gray-700 dark:text-gray-300 mb-4">
            {property.details.bedrooms && (
              <div className="flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
                <span>{property.details.bedrooms} bed</span>
              </div>
            )}
            {property.details.bathrooms && (
              <div className="flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z" />
                </svg>
                <span>{property.details.bathrooms} bath</span>
              </div>
            )}
            <div className="flex items-center gap-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
              </svg>
                <span>{formatNumber(property.details.squareFeet)} sqft</span>
            </div>
          </div>
        )}

        {/* Token Info */}
        <div className="flex items-center justify-between mb-3 sm:mb-4 p-2 sm:p-3 bg-gray-50 dark:bg-gray-700 rounded-lg gap-2">
          <div className="min-w-0">
            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">Available Tokens</p>
            <p className="text-xs sm:text-sm font-semibold text-gray-900 dark:text-white truncate">
              {formatNumber(property.tokenInfo.available)} / {formatNumber(property.tokenInfo.totalSupply)}
            </p>
          </div>
          <div className="text-right min-w-0">
            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">Per Token</p>
            <p className="text-xs sm:text-sm font-semibold text-gray-900 dark:text-white truncate">
              {formatPrice(property.price.perToken)}
            </p>
          </div>
        </div>

        {/* Price and CTA */}
        <div className="flex items-center justify-between mt-auto pt-3 sm:pt-4 border-t border-gray-200 dark:border-gray-700 gap-2">
          <div className="min-w-0">
            <p className="text-xs text-gray-500 dark:text-gray-400">Total Value</p>
            <div className="text-base sm:text-xl font-bold text-gray-900 dark:text-white truncate" aria-label={`Total value: ${formatPrice(property.price.total)} ETH`}>
              <CurrencyToggle ethAmount={property.price.total} />
            </div>
          </div>
          <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
            <ShareButton 
              property={property}
              variant="outline"
              size="sm"
              className="px-2 sm:px-3 py-1.5 sm:py-2"
            />
            <button
              onClick={handleAddToCart}
              className="px-2 sm:px-3 py-1.5 sm:py-2 bg-green-600 hover:bg-green-700 text-white text-xs sm:text-sm font-medium rounded-lg transition-colors flex items-center gap-1 flex-shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-2"
              disabled={property.tokenInfo.available === 0}
              title="Add to Cart"
              aria-label={property.tokenInfo.available === 0 ? 'No tokens available' : `Add ${property.name} to cart`}
            >
              <ShoppingCart className="w-3 h-3 sm:w-4 sm:h-4" aria-hidden="true" />
              <Plus className="w-2 h-2 sm:w-3 sm:h-3" aria-hidden="true" />
              <span className="hidden sm:inline">Add to Cart</span>
            </button>
            <Link
              href={`/properties/${property.id}`}
              className="px-2 sm:px-4 py-1.5 sm:py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-medium rounded-lg transition-colors flex-shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 inline-flex items-center justify-center"
              aria-label={`View details for ${property.name}`}
            >
              View
            </Link>
          </div>
        </div>
      </div>
    </article>
  );
};

export const PropertyCard = React.memo(PropertyCardInner);
