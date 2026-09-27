/**
 * Redis Cache Service
 * Handles Redis-based caching for property data with specified TTL values
 */

import { getRedisClient, REDIS_KEY_PREFIX } from './redis';
import { logger } from '@/utils/logger';
import type { Property, PropertySearchResult, SearchFilters, SortOption, AutocompleteResult } from '@/types/property';
import {
  propertySchema,
  propertySearchResultSchema,
  autocompleteResultsSchema,
  cacheStatsSchema,
} from '@/types/propertySchemas';
import type { z } from 'zod';

// Cache TTL values (in seconds)
export const CACHE_TTL = {
  PROPERTY_LISTINGS: 5 * 60, // 5 minutes
  PROPERTY_DETAILS: 1 * 60,  // 1 minute
  SEARCH_RESULTS: 5 * 60,    // 5 minutes
  AUTOCOMPLETE: 10 * 60,     // 10 minutes
} as const;

// TTL (seconds) for the per-property key index. It only needs to outlive the
// cache entries it references (the longest of which is SEARCH_RESULTS), so a
// small buffer keeps the index sets from leaking forever.
const PROPERTY_INDEX_TTL = CACHE_TTL.SEARCH_RESULTS * 2;

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
  // Reverse index: property id -> every cache key that embeds this property.
  // Lets a mutation invalidate only the entries it actually affects instead of
  // scanning and flushing whole key patterns.
  PROPERTY_INDEX: (id: string) => `index:property:${id}`,
} as const;

// Cache statistics
interface CacheStats {
  hits: number;
  misses: number;
  total: number;
  hitRate: number;
  lastUpdated: number;
  // Entries discarded because their payload failed JSON/schema validation.
  invalid: number;
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
      
      const property = cached
        ? this.parseCached(key, cached, propertySchema)
        : null;

      if (property) {
        await this.recordHit();
        logger.debug(`Cache hit for property: ${propertyId}`);
        return property;
      }

      if (cached) {
        await this.recordInvalid(key);
      } else {
        await this.recordMiss();
        logger.debug(`Cache miss for property: ${propertyId}`);
      }
      return null;
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
      await this.indexPropertyKeys([property.id], [key]);
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

      const result = cached
        ? this.parseCached(key, cached, propertySearchResultSchema)
        : null;

      if (result) {
        await this.recordHit();
        logger.debug(`Cache hit for property listings page ${page}`);
        return result;
      }

      if (cached) {
        await this.recordInvalid(key);
      } else {
        await this.recordMiss();
        logger.debug(`Cache miss for property listings page ${page}`);
      }
      return null;
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
      await this.indexPropertyKeys(
        result.properties.map((property) => property.id),
        [key]
      );
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

      const result = cached
        ? this.parseCached(key, cached, propertySearchResultSchema)
        : null;

      if (result) {
        await this.recordHit();
        logger.debug(`Cache hit for search results`);
        return result;
      }

      if (cached) {
        await this.recordInvalid(key);
      } else {
        await this.recordMiss();
        logger.debug(`Cache miss for search results`);
      }
      return null;
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
      await this.indexPropertyKeys(
        result.properties.map((property) => property.id),
        [key]
      );
      logger.debug(`Cached search results`);
    } catch (error) {
      logger.error('Error setting search results in Redis cache:', error);
    }
  }

  /**
   * Get autocomplete suggestions from Redis cache
   */
  async getAutocomplete(query: string): Promise<AutocompleteResult[] | null> {
    try {
      const client = await this.client();
      const key = CACHE_KEYS.AUTOCOMPLETE(query);
      const cached = await client.get(key);

      const suggestions = cached
        ? this.parseCached(key, cached, autocompleteResultsSchema)
        : null;

      if (suggestions) {
        await this.recordHit();
        logger.debug(`Cache hit for autocomplete: ${query}`);
        return suggestions;
      }

      if (cached) {
        await this.recordInvalid(key);
      } else {
        await this.recordMiss();
        logger.debug(`Cache miss for autocomplete: ${query}`);
      }
      return null;
    } catch (error) {
      logger.error('Error getting autocomplete from Redis cache:', error);
      await this.recordMiss();
      return null;
    }
  }

  /**
   * Set autocomplete suggestions in Redis cache
   */
  async setAutocomplete(query: string, suggestions: AutocompleteResult[]): Promise<void> {
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
   * Invalidate cache entries by pattern.
   *
   * ioredis applies its `keyPrefix` to DEL arguments but NOT to the KEYS
   * pattern, so we fully-qualify the pattern and strip the prefix back off the
   * returned keys before deleting (otherwise they'd be double-prefixed and the
   * delete would silently miss). Prefer the narrow `invalidateProperty` path;
   * this remains the fallback when no key index exists for a property.
   */
  async invalidatePattern(pattern: string): Promise<number> {
    try {
      const client = await this.client();
      const keys = await client.keys(`${REDIS_KEY_PREFIX}${pattern}`);

      if (keys.length > 0) {
        const logicalKeys = keys.map((key) =>
          key.startsWith(REDIS_KEY_PREFIX)
            ? key.slice(REDIS_KEY_PREFIX.length)
            : key
        );
        await client.del(...logicalKeys);
        logger.info(`Invalidated ${keys.length} cache entries matching pattern: ${pattern}`);
      }
      
      return keys.length;
    } catch (error) {
      logger.error('Error invalidating cache pattern:', error);
      return 0;
    }
  }

  /**
   * Invalidate all property-related cache.
   *
   * This is an explicit full flush (bulk imports, cache warm reset). Routine
   * property mutations should call `invalidateProperty` so unrelated searches
   * and detail pages survive.
   */
  async invalidateAllProperties(): Promise<void> {
    await this.invalidatePattern('property:*');
    await this.invalidatePattern('listing:*');
    await this.invalidatePattern('search:*');
    await this.invalidatePattern('autocomplete:*');
    await this.invalidatePattern('index:property:*');
    logger.info('Invalidated all property cache entries');
  }

  /**
   * Invalidate property-specific cache.
   *
   * Uses the per-property key index to delete only the entries that actually
   * reference this property. Only falls back to a pattern scan when the index
   * is missing (e.g. entries written before the index existed, or an expired
   * index set).
   */
  async invalidateProperty(propertyId: string): Promise<void> {
    const propertyKey = CACHE_KEYS.PROPERTY(propertyId);
    const indexKey = CACHE_KEYS.PROPERTY_INDEX(propertyId);

    let indexedKeys: string[] = [];
    try {
      const client = await this.client();
      indexedKeys = await client.smembers(indexKey);
    } catch (error) {
      logger.warn(`Failed to read cache index for property ${propertyId}:`, error);
    }

    if (indexedKeys.length > 0) {
      try {
        const client = await this.client();
        const keysToDelete = [...new Set([propertyKey, ...indexedKeys])];
        await client.del(...keysToDelete);
        await client.del(indexKey);
        logger.info(
          `Invalidated ${keysToDelete.length} cache entries for property: ${propertyId}`
        );
        return;
      } catch (error) {
        logger.error(`Error invalidating indexed cache for property ${propertyId}:`, error);
        return;
      }
    }

    // Index missing: fall back to the deterministic detail key plus a narrow
    // pattern scan for listing/search entries that embed the property id.
    await this.deleteProperty(propertyId);
    await this.invalidatePattern(`listing:*${propertyId}*`);
    await this.invalidatePattern(`search:*${propertyId}*`);
    logger.info(`Invalidated cache for property (pattern fallback): ${propertyId}`);
  }

  /**
   * Record a property-key association for one or more cache keys.
   *
   * The index set stores *logical* key names (without the client prefix) so the
   * members survive a round-trip through SMEMBERS and can be fed straight back
   * into DEL, where ioredis re-applies the prefix exactly once.
   */
  private async indexPropertyKeys(
    propertyIds: Iterable<string>,
    keys: string[]
  ): Promise<void> {
    const uniqueKeys = [...new Set(keys)];
    const uniqueIds = [...new Set(propertyIds)].filter(Boolean);
    if (uniqueKeys.length === 0 || uniqueIds.length === 0) return;

    try {
      const client = await this.client();
      await Promise.all(
        uniqueIds.map(async (id) => {
          const indexKey = CACHE_KEYS.PROPERTY_INDEX(id);
          await client.sadd(indexKey, ...uniqueKeys);
          await client.expire(indexKey, PROPERTY_INDEX_TTL);
        })
      );
    } catch (error) {
      // Indexing is best-effort; a miss only means a later invalidation falls
      // back to the narrower-by-pattern path.
      logger.warn('Failed to update property cache index:', error);
    }
  }

  /**
   * Validate a raw cached payload against a schema.
   *
   * Returns the parsed value on success, or null when the payload is not valid
   * JSON or does not match the expected shape. Callers treat null as a miss and
   * regenerate from the source.
   */
  private parseCached<T>(key: string, raw: string, schema: z.ZodType<T>): T | null {
    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch (error) {
      logger.warn(`Discarding cache entry with malformed JSON at key: ${key}`, error);
      return null;
    }

    const result = schema.safeParse(parsed);
    if (!result.success) {
      logger.warn(`Discarding cache entry that failed schema validation at key: ${key}`, {
        issues: result.error.issues.map((issue) => issue.path.join('.')),
      });
      return null;
    }

    return result.data;
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
   * Record a cache entry that was present but failed validation. Counted both
   * as an invalid payload and as a miss, since the caller must refetch.
   */
  private async recordInvalid(key: string): Promise<void> {
    logger.warn(`Cache entry invalid, treating as miss: ${key}`);
    try {
      const client = await this.client();
      await client.incr(`${CACHE_KEYS.HIT_RATE}:invalid`);
      await client.incr(`${CACHE_KEYS.HIT_RATE}:misses`);
      await this.updateStats();
    } catch (error) {
      logger.error('Error recording invalid cache entry:', error);
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
      const invalid = parseInt(await client.get(`${CACHE_KEYS.HIT_RATE}:invalid`) || '0');
      const total = hits + misses;
      const hitRate = total > 0 ? hits / total : 0;

      const stats: CacheStats = {
        hits,
        misses,
        total,
        hitRate,
        lastUpdated: Date.now(),
        invalid,
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
        const stats = this.parseCached(CACHE_KEYS.STATS, statsJson, cacheStatsSchema);
        if (stats) {
          return { ...stats, invalid: stats.invalid ?? 0 };
        }
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
      await client.del(`${CACHE_KEYS.HIT_RATE}:invalid`);
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
