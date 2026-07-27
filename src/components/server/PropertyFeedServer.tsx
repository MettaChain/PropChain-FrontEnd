/**
 * Property Feed Server Component
 *
 * This component fetches and renders property data on the server,
 * improving initial load time and SEO.
 */

import { logger } from '@/utils/logger';
import Image from 'next/image';

interface Property {
  id: string;
  name: string;
  description: string;
  price: string;
  location: string;
  imageUrl: string;
  owner: string;
  chainId: number;
}

async function fetchProperties(): Promise<Property[]> {
  try {
    // In production, this would fetch from an API or blockchain
    // For now, return empty array as placeholder
    return [];
  } catch (error) {
    logger.error('Failed to fetch properties', error as Error);
    return [];
  }
}

function formatPrice(price: string): string {
  const num = parseFloat(price);
  if (isNaN(num)) return price;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(num);
}

function getChainName(chainId: number): string {
  switch (chainId) {
    case 1:
      return 'Ethereum';
    case 137:
      return 'Polygon';
    case 56:
      return 'BSC';
    default:
      return `Chain ${chainId}`;
  }
}

export async function PropertyFeedServer() {
  const properties = await fetchProperties();

  if (properties.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500 dark:text-gray-400">No properties found</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
        Available Properties
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {properties.map((property) => (
          <div
            key={property.id}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden"
          >
            {property.imageUrl && (
              <div className="relative h-48">
                <Image
                  src={property.imageUrl}
                  alt={property.name}
                  fill
                  className="object-cover"
                />
              </div>
            )}
            <div className="p-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {property.name}
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                {property.location}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-300 mt-2 line-clamp-2">
                {property.description}
              </p>
              <div className="mt-4 flex items-center justify-between">
                <span className="text-lg font-bold text-blue-600 dark:text-blue-400">
                  {formatPrice(property.price)}
                </span>
                <span className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded-full text-gray-600 dark:text-gray-300">
                  {getChainName(property.chainId)}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
