/**
 * Redis Cache Service
 * Handles Redis-based caching for property data with specified TTL values
 */

import { getRedisClient } from './redis';
import { logger } from '@/utils/logger';
import type { Property, PropertySearchResult, SearchFilters, SortOption } from '@/types/property';

// Cache TTL values (in seconds)
export const CACHE_TTL = {
  PROPERTY_LISTINGS: 5 * 60, // 5 minutes
  PROPERTY_DETAILS: 1 * 60,  // 1 minute
  SEARCH_RESULTS: 5 * 60,    // 5 minutes
  AUTOCOMPLETE: 10 * 60,     // 10 minutes
} as const;

// Cache key patterns
export const CACHE_KEYS = {
  PROPERTY: (id: string) => `property:${id}`,
  PROPERTY_LISTING: (filters: SearchFilters, sortBy: SortOption, page: number) => 
    `listing:${JSON.stringify({ filters, sortBy, page })}`,
  SEARCH_RESULT: (filters: SearchFilters, sortBy: SortOption) => 
    `search:${JSON.stringify({ filters, sortBy })}`,
  AUTOCOMPLETE: (query: string) => `autocomplete:${query}`,
  STATS: 'cache:stats',
  HIT_RATE: 'cache:hit_rate',
} as const;

// Cache statistics
interface CacheStats {
  hits: number;
  misses: number;
  total: number;
  hitRate: number;
  lastUpdated: number;
}

/**
 * Redis Cache Service class
 */
class RedisCacheService {
  private client = getRedisClient;

  /**
   * Get a property from Redis cache
   */
  async getProperty(propertyId: string): Promise<Property | null> {
    try {
      const client = await this.client();
      const key = CACHE_KEYS.PROPERTY(propertyId);
      const cached = await client.get(key);
      
      if (cached) {
        await this.recordHit();
        logger.debug(`Cache hit for property: ${propertyId}`);
        return JSON.parse(cached);
      } else {
        await this.recordMiss();
        logger.debug(`Cache miss for property: ${propertyId}`);
        return null;
      }
    } catch (error) {
      logger.error('Error getting property from Redis cache:', error);
      await this.recordMiss();
      return null;
    }
  }

  /**
   * Set a property in Redis cache
   */
  async setProperty(property: Property): Promise<void> {
    try {
      const client = await this.client();
      const key = CACHE_KEYS.PROPERTY(property.id);
      const value = JSON.stringify(property);
      
      await client.setex(key, CACHE_TTL.PROPERTY_DETAILS, value);
      logger.debug(`Cached property: ${property.id}`);
    } catch (error) {
      logger.error('Error setting property in Redis cache:', error);
    }
  }

  /**
   * Delete a property from Redis cache
   */
  async deleteProperty(propertyId: string): Promise<void> {
    try {
      const client = await this.client();
      const key = CACHE_KEYS.PROPERTY(propertyId);
      await client.del(key);
      logger.debug(`Deleted cached property: ${propertyId}`);
    } catch (error) {
      logger.error('Error deleting property from Redis cache:', error);
    }
  }

  /**
   * Get property listings from Redis cache
   */
  async getPropertyListings(
    filters: SearchFilters,
    sortBy: SortOption,
    page: number = 1
  ): Promise<PropertySearchResult | null> {
    try {
      const client = await this.client();
      const key = CACHE_KEYS.PROPERTY_LISTING(filters, sortBy, page);
      const cached = await client.get(key);
      
      if (cached) {
        await this.recordHit();
        logger.debug(`Cache hit for property listings page ${page}`);
        return JSON.parse(cached);
      } else {
        await this.recordMiss();
        logger.debug(`Cache miss for property listings page ${page}`);
        return null;
      }
    } catch (error) {
      logger.error('Error getting property listings from Redis cache:', error);
      await this.recordMiss();
      return null;
    }
  }

  /**
   * Set property listings in Redis cache
   */
  async setPropertyListings(
    filters: SearchFilters,
    sortBy: SortOption,
    page: number,
    result: PropertySearchResult
  ): Promise<void> {
    try {
      const client = await this.client();
      const key = CACHE_KEYS.PROPERTY_LISTING(filters, sortBy, page);
      const value = JSON.stringify(result);
      
      await client.setex(key, CACHE_TTL.PROPERTY_LISTINGS, value);
      logger.debug(`Cached property listings page ${page}`);
    } catch (error) {
      logger.error('Error setting property listings in Redis cache:', error);
    }
  }

  /**
   * Get search results from Redis cache
   */
  async getSearchResults(
    filters: SearchFilters,
    sortBy: SortOption
  ): Promise<PropertySearchResult | null> {
    try {
      const client = await this.client();
      const key = CACHE_KEYS.SEARCH_RESULT(filters, sortBy);
      const cached = await client.get(key);
      
      if (cached) {
        await this.recordHit();
        logger.debug(`Cache hit for search results`);
        return JSON.parse(cached);
      } else {
        await this.recordMiss();
        logger.debug(`Cache miss for search results`);
        return null;
      }
    } catch (error) {
      logger.error('Error getting search results from Redis cache:', error);
      await this.recordMiss();
      return null;
    }
  }

  /**
   * Set search results in Redis cache
   */
  async setSearchResults(
    filters: SearchFilters,
    sortBy: SortOption,
    result: PropertySearchResult
  ): Promise<void> {
    try {
      const client = await this.client();
      const key = CACHE_KEYS.SEARCH_RESULT(filters, sortBy);
      const value = JSON.stringify(result);
      
      await client.setex(key, CACHE_TTL.SEARCH_RESULTS, value);
      logger.debug(`Cached search results`);
    } catch (error) {
      logger.error('Error setting search results in Redis cache:', error);
    }
  }

  /**
   * Get autocomplete suggestions from Redis cache
   */
  async getAutocomplete(query: string): Promise<any[] | null> {
    try {
      const client = await this.client();
      const key = CACHE_KEYS.AUTOCOMPLETE(query);
      const cached = await client.get(key);
      
      if (cached) {
        await this.recordHit();
        logger.debug(`Cache hit for autocomplete: ${query}`);
        return JSON.parse(cached);
      } else {
        await this.recordMiss();
        logger.debug(`Cache miss for autocomplete: ${query}`);
        return null;
      }
    } catch (error) {
      logger.error('Error getting autocomplete from Redis cache:', error);
      await this.recordMiss();
      return null;
    }
  }

  /**
   * Set autocomplete suggestions in Redis cache
   */
  async setAutocomplete(query: string, suggestions: any[]): Promise<void> {
    try {
      const client = await this.client();
      const key = CACHE_KEYS.AUTOCOMPLETE(query);
      const value = JSON.stringify(suggestions);
      
      await client.setex(key, CACHE_TTL.AUTOCOMPLETE, value);
      logger.debug(`Cached autocomplete for: ${query}`);
    } catch (error) {
      logger.error('Error setting autocomplete in Redis cache:', error);
    }
  }

  /**
   * Invalidate cache entries by pattern
   */
  async invalidatePattern(pattern: string): Promise<number> {
    try {
      const client = await this.client();
      const keys = await client.keys(`propchain:${pattern}`);
      
      if (keys.length > 0) {
        await client.del(...keys);
        logger.info(`Invalidated ${keys.length} cache entries matching pattern: ${pattern}`);
      }
      
      return keys.length;
    } catch (error) {
      logger.error('Error invalidating cache pattern:', error);
      return 0;
    }
  }

  /**
   * Invalidate all property-related cache
   */
  async invalidateAllProperties(): Promise<void> {
    await this.invalidatePattern('property:*');
    await this.invalidatePattern('listing:*');
    await this.invalidatePattern('search:*');
    logger.info('Invalidated all property cache entries');
  }

  /**
   * Invalidate property-specific cache
   */
  async invalidateProperty(propertyId: string): Promise<void> {
    await this.deleteProperty(propertyId);
    await this.invalidatePattern(`listing:*${propertyId}*`);
    await this.invalidatePattern(`search:*${propertyId}*`);
    logger.info(`Invalidated cache for property: ${propertyId}`);
  }

  /**
   * Record cache hit
   */
  private async recordHit(): Promise<void> {
    try {
      const client = await this.client();
      await client.incr(CACHE_KEYS.HIT_RATE);
      await this.updateStats();
    } catch (error) {
      logger.error('Error recording cache hit:', error);
    }
  }

  /**
   * Record cache miss
   */
  private async recordMiss(): Promise<void> {
    try {
      const client = await this.client();
      await client.incr(`${CACHE_KEYS.HIT_RATE}:misses`);
      await this.updateStats();
    } catch (error) {
      logger.error('Error recording cache miss:', error);
    }
  }

  /**
   * Update cache statistics
   */
  private async updateStats(): Promise<void> {
    try {
      const client = await this.client();
      const hits = parseInt(await client.get(CACHE_KEYS.HIT_RATE) || '0');
      const misses = parseInt(await client.get(`${CACHE_KEYS.HIT_RATE}:misses`) || '0');
      const total = hits + misses;
      const hitRate = total > 0 ? hits / total : 0;

      const stats: CacheStats = {
        hits,
        misses,
        total,
        hitRate,
        lastUpdated: Date.now(),
      };

      await client.setex(CACHE_KEYS.STATS, 3600, JSON.stringify(stats));
    } catch (error) {
      logger.error('Error updating cache stats:', error);
    }
  }

  /**
   * Get cache statistics
   */
  async getStats(): Promise<CacheStats | null> {
    try {
      const client = await this.client();
      const statsJson = await client.get(CACHE_KEYS.STATS);
      
      if (statsJson) {
        return JSON.parse(statsJson);
      }
      
      // If no stats exist, create initial stats
      await this.updateStats();
      return await this.getStats();
    } catch (error) {
      logger.error('Error getting cache stats:', error);
      return null;
    }
  }

  /**
   * Clear all cache statistics
   */
  async clearStats(): Promise<void> {
    try {
      const client = await this.client();
      await client.del(CACHE_KEYS.STATS);
      await client.del(CACHE_KEYS.HIT_RATE);
      await client.del(`${CACHE_KEYS.HIT_RATE}:misses`);
      logger.info('Cleared cache statistics');
    } catch (error) {
      logger.error('Error clearing cache stats:', error);
    }
  }

  /**
   * Health check for Redis cache
   */
  async healthCheck(): Promise<{ healthy: boolean; latency: number; error?: string }> {
    const start = Date.now();
    
    try {
      const client = await this.client();
      await client.ping();
      const latency = Date.now() - start;
      
      return { healthy: true, latency };
    } catch (error) {
      const latency = Date.now() - start;
      return { 
        healthy: false, 
        latency, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }
}

// Export singleton instance
export const redisCacheService = new RedisCacheService();

export default redisCacheService;
