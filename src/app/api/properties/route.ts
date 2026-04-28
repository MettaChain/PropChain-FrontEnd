/**
 * Properties API Route with Redis Caching
 * Handles property listings and search with Redis cache layer
 */

import { NextRequest, NextResponse } from 'next/server';
import { propertyService } from '@/lib/propertyService';
import { redisCacheService } from '@/lib/redisCache';
import { logger } from '@/utils/logger';
import type { SearchFilters, SortOption } from '@/types/property';

// GET handler for property listings
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Parse query parameters
    const page = parseInt(searchParams.get('page') || '1');
    const resultsPerPage = parseInt(searchParams.get('limit') || '12');
    const sortBy = (searchParams.get('sortBy') || 'newest') as SortOption;
    const useCache = searchParams.get('cache') !== 'false'; // Default to true
    
    // Parse filters
    const filters: SearchFilters = {
      query: searchParams.get('query') || '',
      priceRange: [
        parseInt(searchParams.get('minPrice') || '0'),
        parseInt(searchParams.get('maxPrice') || '10000000'),
      ],
      propertyTypes: searchParams.get('propertyTypes')?.split(',').filter(Boolean) || [],
      blockchains: searchParams.get('blockchains')?.split(',').filter(Boolean) || [],
      roiMin: parseFloat(searchParams.get('roiMin') || '0'),
      roiMax: parseFloat(searchParams.get('roiMax') || '100'),
      location: searchParams.get('location') || '',
      bedrooms: searchParams.get('bedrooms')?.split(',').map(Number).filter(n => !isNaN(n)) || [],
      bathrooms: searchParams.get('bathrooms')?.split(',').map(Number).filter(n => !isNaN(n)) || [],
      squareFeetRange: [
        parseInt(searchParams.get('minSqft') || '0'),
        parseInt(searchParams.get('maxSqft') || '50000'),
      ],
      status: searchParams.get('status')?.split(',').filter(Boolean) || [],
    };

    // Try Redis cache first if enabled
    if (useCache) {
      try {
        const cachedResult = await redisCacheService.getPropertyListings(filters, sortBy, page);
        if (cachedResult) {
          logger.info(`Serving property listings from Redis cache (page ${page})`);
          return NextResponse.json({
            ...cachedResult,
            source: 'cache',
            cached: true,
          });
        }
      } catch (cacheError) {
        logger.warn('Redis cache error, falling back to service:', cacheError);
      }
    }

    // Fetch from property service
    const result = await propertyService.searchProperties(
      filters,
      sortBy,
      page,
      resultsPerPage,
      { useCache: false, strategy: 'network-first' } // Disable local cache since we're using Redis
    );

    // Cache the result in Redis if enabled
    if (useCache && result) {
      try {
        await redisCacheService.setPropertyListings(filters, sortBy, page, result);
        logger.info(`Cached property listings in Redis (page ${page})`);
      } catch (cacheError) {
        logger.warn('Failed to cache property listings in Redis:', cacheError);
      }
    }

    return NextResponse.json({
      ...result,
      source: 'network',
      cached: false,
    });
  } catch (error) {
    logger.error('Error in properties API route:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST handler for creating/updating properties (invalidates cache)
export async function POST(request: NextRequest) {
  try {
    const propertyData = await request.json();
    
    // Here you would normally save the property to your database/blockchain
    // For now, we'll just invalidate the cache
    
    // Invalidate relevant cache entries
    await redisCacheService.invalidateAllProperties();
    
    logger.info('Property cache invalidated due to property creation/update');
    
    return NextResponse.json({ 
      message: 'Property created/updated successfully',
      cacheInvalidated: true 
    });
  } catch (error) {
    logger.error('Error in POST properties API route:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
