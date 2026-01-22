'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import type { Property } from '@/types/property';
import { formatPrice, formatROI, getBlockchainColor, getPropertyTypeIcon } from '@/utils/searchUtils';
import { BLOCKCHAIN_LABELS, PROPERTY_TYPE_LABELS } from '@/types/property';

interface PropertyCardProps {
  property: Property;
  viewMode?: 'grid' | 'list';
}

export const PropertyCard: React.FC<PropertyCardProps> = ({ 
  property, 
  viewMode = 'grid' 
}) => {
  const isListView = viewMode === 'list';

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
        <div className="absolute top-3 left-3 flex flex-col gap-2">
          {property.featured && (
            <span className="bg-yellow-500 text-white text-xs font-semibold px-2 py-1 rounded">
              ⭐ Featured
            </span>
          )}
          {property.verified && (
            <span className="bg-green-500 text-white text-xs font-semibold px-2 py-1 rounded flex items-center gap-1">
              ✓ Verified
            </span>
          )}
        </div>

        {/* ROI Badge */}
        <div className="absolute top-3 right-3">
          <div className="bg-blue-600 text-white text-sm font-bold px-3 py-1.5 rounded-lg shadow-lg">
            {formatROI(property.metrics.roi)} ROI
          </div>
        </div>

        {/* Blockchain Badge */}
        <div className="absolute bottom-3 left-3">
          <div
            className="text-white text-xs font-semibold px-2 py-1 rounded flex items-center gap-1"
            style={{ backgroundColor: getBlockchainColor(property.blockchain) }}
          >
            <div className="w-2 h-2 rounded-full bg-white" />
            {BLOCKCHAIN_LABELS[property.blockchain]}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className={`p-5 flex flex-col ${isListView ? 'flex-1' : ''}`}>
        {/* Property Type */}
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xl">{getPropertyTypeIcon(property.propertyType)}</span>
          <span className="text-sm text-gray-600 dark:text-gray-400">
            {PROPERTY_TYPE_LABELS[property.propertyType]}
          </span>
        </div>

        {/* Title */}
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-1">
          {property.name}
        </h3>

        {/* Location */}
        <div className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400 mb-3">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <span className="line-clamp-1">
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
        <div className="flex items-center justify-between mb-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400">Available Tokens</p>
            <p className="text-sm font-semibold text-gray-900 dark:text-white">
              {property.tokenInfo.available.toLocaleString()} / {property.tokenInfo.totalSupply.toLocaleString()}
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-500 dark:text-gray-400">Per Token</p>
            <p className="text-sm font-semibold text-gray-900 dark:text-white">
              {formatPrice(property.price.perToken)}
            </p>
          </div>
        </div>

        {/* Price and CTA */}
        <div className="flex items-center justify-between mt-auto pt-4 border-t border-gray-200 dark:border-gray-700">
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400">Total Value</p>
            <p className="text-xl font-bold text-gray-900 dark:text-white">
              {formatPrice(property.price.total)}
            </p>
          </div>
          <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors">
            View Details
          </button>
        </div>
      </div>
    </Link>
  );
};
