import React from 'react';
import Image from 'next/image';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatPrice, formatROI, getBlockchainColor, getPropertyTypeIcon } from '@/utils/searchUtils';
import { BLOCKCHAIN_LABELS, PROPERTY_TYPE_LABELS } from '@/types/property';
import type { Property } from '@/types/property';
import { ImageGallery } from './ImageGallery';
import { CurrencyToggle } from './CurrencyToggle';
import { MortgageCalculator } from './MortgageCalculator';

interface PropertyDetailServerProps {
  property: Property;
}

export const PropertyDetailServer: React.FC<PropertyDetailServerProps> = ({ property }) => {
  return (
    <div className="space-y-8">
      {/* Property Header */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Image and Gallery */}
        <div className="lg:col-span-2">
          <div className="relative">
            {/* Badges */}
            <div className="absolute top-4 left-4 z-10 flex flex-col gap-2">
              {property.featured && (
                <Badge className="bg-yellow-500 text-white">
                  ⭐ Featured
                </Badge>
              )}
              {property.verified && (
                <Badge className="bg-green-500 text-white">
                  ✓ Verified
                </Badge>
              )}
            </div>

            {/* ROI Badge */}
            <div className="absolute top-4 right-4 z-10">
              <div className="bg-blue-600 text-white text-lg font-bold px-4 py-2 rounded-lg shadow-lg">
                {formatROI(property.metrics.roi)} ROI
              </div>
            </div>

            <ImageGallery 
              images={property.images} 
              propertyName={property.name} 
            />
          </div>
        </div>

        {/* Property Info Sidebar */}
        <div className="space-y-6">
          {/* Title and Location */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xl">{getPropertyTypeIcon(property.propertyType)}</span>
              <Badge variant="secondary">
                {PROPERTY_TYPE_LABELS[property.propertyType]}
              </Badge>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              {property.name}
            </h1>
            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span className="font-medium">
                {property.location.address}, {property.location.city}, {property.location.state}
              </span>
            </div>
          </div>

          {/* Price Information */}
          <Card>
            <CardHeader>
              <CardTitle>Investment Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-600 dark:text-gray-400">Total Value</span>
                <CurrencyToggle ethAmount={property.price.total} showBoth={true} />
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600 dark:text-gray-400">Per Token</span>
                <CurrencyToggle ethAmount={property.price.perToken} />
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600 dark:text-gray-400">Available Tokens</span>
                <span className="font-semibold text-gray-900 dark:text-white">
                  {property.tokenInfo.available.toLocaleString()} / {property.tokenInfo.totalSupply.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600 dark:text-gray-400">Expected ROI</span>
                <span className="font-semibold text-green-600">
                  {formatROI(property.metrics.roi)}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Blockchain Information */}
          <Card>
            <CardHeader>
              <CardTitle>Blockchain</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3">
                <div
                  className="w-4 h-4 rounded-full"
                  style={{ backgroundColor: getBlockchainColor(property.blockchain) }}
                />
                <span className="font-medium text-gray-900 dark:text-white">
                  {BLOCKCHAIN_LABELS[property.blockchain]}
                </span>
              </div>
              <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                Contract: {property.tokenInfo.contractAddress}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Property Details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Description */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>About this Property</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                {property.description}
              </p>
            </CardContent>
          </Card>

          {/* Property Features */}
          <Card>
            <CardHeader>
              <CardTitle>Property Features</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {property.details.bedrooms && (
                  <div className="text-center">
                    <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center mx-auto mb-2">
                      <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                      </svg>
                    </div>
                    <div className="text-2xl font-bold text-gray-900 dark:text-white">{property.details.bedrooms}</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Bedrooms</div>
                  </div>
                )}
                
                {property.details.bathrooms && (
                  <div className="text-center">
                    <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center mx-auto mb-2">
                      <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z" />
                      </svg>
                    </div>
                    <div className="text-2xl font-bold text-gray-900 dark:text-white">{property.details.bathrooms}</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Bathrooms</div>
                  </div>
                )}
                
                <div className="text-center">
                  <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center mx-auto mb-2">
                    <svg className="w-6 h-6 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                    </svg>
                  </div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">{property.details.squareFeet.toLocaleString()}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Square Feet</div>
                </div>

                <div className="text-center">
                  <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900 rounded-lg flex items-center justify-center mx-auto mb-2">
                    <svg className="w-6 h-6 text-orange-600 dark:text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                    </svg>
                  </div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">{formatROI(property.metrics.roi)}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">ROI</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Investment Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Investment Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-600 dark:text-gray-400">Annual Yield</span>
                <span className="font-semibold text-gray-900 dark:text-white">
                  {formatROI(property.metrics.roi)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600 dark:text-gray-400">Transaction Volume</span>
                <span className="font-semibold text-gray-900 dark:text-white">
                  {property.metrics.transactionVolume.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600 dark:text-gray-400">Listed Date</span>
                <span className="font-semibold text-gray-900 dark:text-white">
                  {new Date(property.listedDate).toLocaleDateString()}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* External Links */}
          <Card>
            <CardHeader>
              <CardTitle>External Links</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <button className="w-full justify-start inline-flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
                View on Blockchain
              </button>
              <button className="w-full justify-start inline-flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
                Property Documents
              </button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Investment Calculator */}
      <div id="calculator" className="mt-12">
        <MortgageCalculator 
          propertyPrice={property.price.perToken} 
          defaultYield={property.metrics.roi} 
        />
      </div>
    </div>
  );
};
