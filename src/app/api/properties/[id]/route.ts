/**
 * Individual Property API Route with Redis Caching
 * Handles property details with Redis cache layer (1 minute TTL)
 */

import { NextRequest, NextResponse } from 'next/server';
import { propertyService } from '@/lib/propertyService';
import { redisCacheService } from '@/lib/redisCache';
import { logger } from '@/utils/logger';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET handler for individual property details
export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = await params;
    const searchParams = request.nextUrl.searchParams;
    const useCache = searchParams.get('cache') !== 'false'; // Default to true

    if (!id) {
      return NextResponse.json(
        { error: 'Property ID is required' },
        { status: 400 }
      );
    }

    // Try Redis cache first if enabled
    if (useCache) {
      try {
        const cachedProperty = await redisCacheService.getProperty(id);
        if (cachedProperty) {
          logger.info(`Serving property ${id} from Redis cache`);
          return NextResponse.json({
            ...cachedProperty,
            source: 'cache',
            cached: true,
          });
        }
      } catch (cacheError) {
        logger.warn('Redis cache error, falling back to service:', cacheError);
      }
    }

    // Fetch from property service
    const property = await propertyService.getPropertyById(id, {
      useCache: false, // Disable local cache since we're using Redis
      strategy: 'network-first',
    });

    if (!property) {
      return NextResponse.json(
        { error: 'Property not found' },
        { status: 404 }
      );
    }

    // Cache the result in Redis if enabled
    if (useCache) {
      try {
        await redisCacheService.setProperty(property);
        logger.info(`Cached property ${id} in Redis`);
      } catch (cacheError) {
        logger.warn('Failed to cache property in Redis:', cacheError);
      }
    }

    return NextResponse.json({
      ...property,
      source: 'network',
      cached: false,
    });
  } catch (error) {
    logger.error('Error in property API route:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT handler for updating property (invalidates cache)
export async function PUT(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = await params;
    const propertyData = await request.json();

    if (!id) {
      return NextResponse.json(
        { error: 'Property ID is required' },
        { status: 400 }
      );
    }

    // Here you would normally update the property in your database/blockchain
    // For now, we'll just invalidate the cache and return the updated data
    
    // Invalidate specific property cache
    await redisCacheService.invalidateProperty(id);
    
    logger.info(`Property ${id} cache invalidated due to update`);
    
    return NextResponse.json({ 
      message: 'Property updated successfully',
      propertyId: id,
      cacheInvalidated: true 
    });
  } catch (error) {
    logger.error('Error in PUT property API route:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE handler for deleting property (invalidates cache)
export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { error: 'Property ID is required' },
        { status: 400 }
      );
    }

    // Here you would normally delete the property from your database/blockchain
    // For now, we'll just invalidate the cache
    
    // Invalidate specific property cache
    await redisCacheService.invalidateProperty(id);
    
    logger.info(`Property ${id} cache invalidated due to deletion`);
    
    return NextResponse.json({ 
      message: 'Property deleted successfully',
      propertyId: id,
      cacheInvalidated: true 
    });
  } catch (error) {
    logger.error('Error in DELETE property API route:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
