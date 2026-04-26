'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ShoppingCart, Plus, Heart } from 'lucide-react';
import type { Property } from '@/types/property';
import { formatPrice, formatROI, getBlockchainColor, getPropertyTypeIcon } from '@/utils/searchUtils';
import { BLOCKCHAIN_LABELS, PROPERTY_TYPE_LABELS } from '@/types/property';
import { useCartStore } from '@/store/cartStore';
import { useFavoritesStore } from '@/store/favoritesStore';

interface PropertyCardProps {
  property: Property;
  viewMode?: 'grid' | 'list';
}

export const PropertyCard: React.FC<PropertyCardProps> = ({ 
  property, 
  viewMode = 'grid' 
}) => {
  const isListView = viewMode === 'list';
  const { addItem } = useCartStore();
  const { addFavorite, removeFavorite, isFavorite } = useFavoritesStore();

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addItem(property, 1);
  };

  const handleToggleFavorite = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isFavorite(property.id)) {
      removeFavorite(property.id);
    } else {
      addFavorite(property);
    }
  };

  return (
    <Link
      href={`/properties/${property.id}`}
      className={`group bg-white dark:bg-gray-800 rounded-xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden ${
        isListView ? 'flex flex-row' : 'flex flex-col'
      }`}
    >
      {/* Image */}
      <div className={`relative overflow-hidden ${isListView ? 'w-64 flex-shrink-0' : 'w-full h-56'}`}>
        <Image
          src={property.images[0]}
          alt={property.name}
          fill
          className="object-cover group-hover:scale-110 transition-transform duration-300"
        />
        
        {/* Badges */}
        <div className="absolute top-2 left-2 sm:top-3 sm:left-3 flex flex-col gap-1 sm:gap-2">
          {property.featured && (
            <span className="bg-yellow-500 text-white text-xs font-semibold px-2 py-0.5 sm:py-1 rounded text-xs">
              ⭐ Featured
            </span>
          )}
          {property.verified && (
            <span className="bg-green-500 text-white text-xs font-semibold px-2 py-0.5 sm:py-1 rounded flex items-center gap-1">
              ✓ Verified
            </span>
          )}
        </div>

        {/* ROI Badge */}
        <div className="absolute top-2 right-2 sm:top-3 sm:right-3">
          <div className="bg-blue-600 text-white text-xs sm:text-sm font-bold px-2 py-0.5 sm:px-3 sm:py-1.5 rounded-lg shadow-lg">
            {formatROI(property.metrics.roi)} ROI
          </div>
        </div>

        {/* Favorite Button */}
        <button
          onClick={handleToggleFavorite}
          className="absolute top-3 right-16 p-2 bg-white/90 hover:bg-white rounded-full shadow-lg transition-colors"
        >
          <Heart
            className={`w-4 h-4 ${
              isFavorite(property.id)
                ? 'fill-red-500 text-red-500'
                : 'text-gray-600 hover:text-red-500'
            }`}
          />
        </button>

        {/* Blockchain Badge */}
        <div className="absolute bottom-2 left-2 sm:bottom-3 sm:left-3">
          <div
            className="text-white text-xs font-semibold px-2 py-0.5 sm:py-1 rounded flex items-center gap-1"
            style={{ backgroundColor: getBlockchainColor(property.blockchain) }}
          >
            <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-white" />
            <span className="truncate max-w-[80px] sm:max-w-none">{BLOCKCHAIN_LABELS[property.blockchain]}</span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className={`p-3 sm:p-5 flex flex-col ${isListView ? 'flex-1' : ''}`}>
        {/* Property Type */}
        <div className="flex items-center gap-2 mb-2 flex-wrap">
          <span className="text-lg sm:text-xl">{getPropertyTypeIcon(property.propertyType)}</span>
          <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
            {PROPERTY_TYPE_LABELS[property.propertyType]}
          </span>
          {developer && (
            <DeveloperBadge
              status={developer.verificationStatus}
              developerName={developer.name}
              compact
            />
          )}
          {!developer && (
            <DeveloperBadge status="unverified" compact />
          )}
        </div>

        {/* Title */}
        <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white mb-1 sm:mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-2">
          {property.name}
        </h3>

        {/* Location */}
        <div className="flex items-start gap-1 text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-2 sm:mb-3">
          <svg className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <span className="line-clamp-2">
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
              <span>{property.details.squareFeet.toLocaleString()} sqft</span>
            </div>
          </div>
        )}

        {/* Token Info */}
        <div className="flex items-center justify-between mb-3 sm:mb-4 p-2 sm:p-3 bg-gray-50 dark:bg-gray-700 rounded-lg gap-2">
          <div className="min-w-0">
            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">Available Tokens</p>
            <p className="text-xs sm:text-sm font-semibold text-gray-900 dark:text-white truncate">
              {property.tokenInfo.available.toLocaleString()} / {property.tokenInfo.totalSupply.toLocaleString()}
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
            <p className="text-base sm:text-xl font-bold text-gray-900 dark:text-white truncate">
              {formatPrice(property.price.total)}
            </p>
          </div>
          <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
            <button
              onClick={handleAddToCart}
              className="px-2 sm:px-3 py-1.5 sm:py-2 bg-green-600 hover:bg-green-700 text-white text-xs sm:text-sm font-medium rounded-lg transition-colors flex items-center gap-1 flex-shrink-0"
              disabled={property.tokenInfo.available === 0}
              title="Add to Cart"
            >
              <ShoppingCart className="w-3 h-3 sm:w-4 sm:h-4" />
              <Plus className="w-2 h-2 sm:w-3 sm:h-3" />
              <span className="hidden sm:inline">Add to Cart</span>
            </button>
            <button className="px-2 sm:px-4 py-1.5 sm:py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-medium rounded-lg transition-colors flex-shrink-0">
              View
            </button>
          </div>
        </div>
      </div>
    </Link>
  );
};
