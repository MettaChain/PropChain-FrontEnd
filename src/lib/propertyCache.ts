/**
 * Property Cache Service
 * High-level caching operations for property data with IndexedDB
 */

import { logger } from '@/utils/logger';
import {
  dbGet,
  dbSet,
  dbDelete,
  dbGetAll,
  dbGetAllKeys,
  dbClear,
  dbCount,
  isIndexedDBSupported,
} from './indexedDB';
import type {
  Property,
  PropertySearchResult,
  SearchFilters,
  SortOption,
} from '@/types/property';
import type { MobileProperty } from '@/types/mobileProperty';
import type {
  CacheEntry,
  CacheMetadata,
  CacheResult,
  CacheStats,
  CacheConfig,
  PropertyCacheEntry,
  MobilePropertyCacheEntry,
  CacheEventListener,
  CacheEvent,
} from '@/types/cache';
import {
  CACHE_STORE_NAMES,
  DEFAULT_CACHE_CONFIG,
  LOCAL_STORAGE_KEYS,
  getCacheEntryStatus,
  calculateEntrySize,
} from '@/types/cache';

// Event listeners
const eventListeners: Set<CacheEventListener> = new Set();

// Cache statistics
let cacheStats: CacheStats = {
  totalEntries: 0,
  totalSize: 0,
  storageQuota: 0,
  storageUsed: 0,
  hitRate: 0,
  missRate: 0,
  oldestEntry: null,
  newestEntry: null,
};

// Request counters for hit/miss rate
let cacheHits = 0;
let cacheMisses = 0;

/**
 * Emit a cache event
 */
const emitEvent = (event: CacheEvent): void => {
  eventListeners.forEach((listener) => {
    try {
      listener(event);
    } catch (error) {
      logger.error('Cache event listener error:', error);
    }
  });
};

/**
 * Add an event listener
 */
export const addCacheEventListener = (listener: CacheEventListener): (() => void) => {
  eventListeners.add(listener);
  return () => {
    eventListeners.delete(listener);
  };
};

/**
 * Create cache metadata for a new entry
 */
const createCacheMetadata = (
  key: string,
  size: number,
  config: CacheConfig = DEFAULT_CACHE_CONFIG
): CacheMetadata => {
  const now = Date.now();
  return {
    key,
    cachedAt: now,
    expiresAt: now + config.ttl,
    lastAccessed: now,
    accessCount: 0,
    size,
    version: config.version,
  };
};

/**
 * Update metadata on cache access
 */
const updateMetadataOnAccess = (metadata: CacheMetadata): CacheMetadata => ({
  ...metadata,
  lastAccessed: Date.now(),
  accessCount: metadata.accessCount + 1,
});

/**
 * Get cache configuration
 */
export const getCacheConfig = (): CacheConfig => {
  if (typeof window === 'undefined') return DEFAULT_CACHE_CONFIG;
  
  try {
    const stored = localStorage.getItem(LOCAL_STORAGE_KEYS.CACHE_CONFIG);
    if (stored) {
      const parsed = JSON.parse(stored);
      return { ...DEFAULT_CACHE_CONFIG, ...parsed };
    }
  } catch (error) {
    logger.error('Error reading cache config:', error);
  }
  return DEFAULT_CACHE_CONFIG;
};

/**
 * Set cache configuration
 */
export const setCacheConfig = (config: Partial<CacheConfig>): void => {
  if (typeof window === 'undefined') return;
  
  try {
    const current = getCacheConfig();
    const updated = { ...current, ...config };
    localStorage.setItem(LOCAL_STORAGE_KEYS.CACHE_CONFIG, JSON.stringify(updated));
  } catch (error) {
    logger.error('Error saving cache config:', error);
  }
};

/**
 * Check if cache is available
 */
export const isCacheAvailable = (): boolean => {
  return isIndexedDBSupported();
};

/**
 * Get a property from cache
 */
export const getCachedProperty = async (
  propertyId: string
): Promise<CacheResult<Property>> => {
  const key = `property:${propertyId}`;
  
  try {
    const entry = await dbGet<PropertyCacheEntry>(
      CACHE_STORE_NAMES.PROPERTIES,
      key
    );

    if (!entry) {
      cacheMisses++;
      emitEvent({ type: 'miss', key, timestamp: Date.now() });
      return { data: null, source: 'none', stale: false };
    }

    const status = getCacheEntryStatus(entry.metadata);
    
    if (status === 'expired') {
      cacheMisses++;
      await deleteCachedProperty(propertyId);
      emitEvent({ type: 'expire', key, timestamp: Date.now(), metadata: entry.metadata });
      return { data: null, source: 'none', stale: false };
    }

    // Update access metadata
    const updatedEntry: PropertyCacheEntry = {
      ...entry,
      metadata: updateMetadataOnAccess(entry.metadata),
    };
    await dbSet(CACHE_STORE_NAMES.PROPERTIES, key, updatedEntry);

    cacheHits++;
    emitEvent({ type: 'hit', key, timestamp: Date.now(), metadata: entry.metadata });
    
    return {
      data: entry.data,
      source: 'cache',
      stale: status === 'stale',
    };
  } catch (error) {
    logger.error('Error getting cached property:', error);
    emitEvent({ type: 'error', key, timestamp: Date.now(), error: error as Error });
    return { data: null, source: 'none', stale: false, error: error as Error };
  }
};

/**
 * Set a property in cache
 */
export const setCachedProperty = async (
  property: Property,
  config: CacheConfig = getCacheConfig()
): Promise<void> => {
  const key = `property:${property.id}`;
  
  try {
    // Calculate approximate size
    const tempEntry: CacheEntry<Property> = {
      data: property,
      metadata: createCacheMetadata(key, 0, config),
    };
    const size = calculateEntrySize(tempEntry);

    const entry: PropertyCacheEntry = {
      data: property,
      metadata: createCacheMetadata(key, size, config),
    };

    await dbSet(CACHE_STORE_NAMES.PROPERTIES, key, entry);
    emitEvent({ type: 'set', key, timestamp: Date.now(), metadata: entry.metadata });
    
    // Update stats
    await updateCacheStats();
  } catch (error) {
    logger.error('Error caching property:', error);
    emitEvent({ type: 'error', key, timestamp: Date.now(), error: error as Error });
    throw error;
  }
};

/**
 * Delete a property from cache
 */
export const deleteCachedProperty = async (propertyId: string): Promise<void> => {
  const key = `property:${propertyId}`;
  
  try {
    await dbDelete(CACHE_STORE_NAMES.PROPERTIES, key);
    emitEvent({ type: 'delete', key, timestamp: Date.now() });
    await updateCacheStats();
  } catch (error) {
    logger.error('Error deleting cached property:', error);
    throw error;
  }
};

/**
 * Get a mobile property from cache
 */
export const getCachedMobileProperty = async (
  propertyId: string
): Promise<CacheResult<MobileProperty>> => {
  const key = `mobile-property:${propertyId}`;
  
  try {
    const entry = await dbGet<MobilePropertyCacheEntry>(
      CACHE_STORE_NAMES.MOBILE_PROPERTIES,
      key
    );

    if (!entry) {
      cacheMisses++;
      emitEvent({ type: 'miss', key, timestamp: Date.now() });
      return { data: null, source: 'none', stale: false };
    }

    const status = getCacheEntryStatus(entry.metadata);
    
    if (status === 'expired') {
      cacheMisses++;
      await deleteCachedMobileProperty(propertyId);
      emitEvent({ type: 'expire', key, timestamp: Date.now(), metadata: entry.metadata });
      return { data: null, source: 'none', stale: false };
    }

    // Update access metadata
    const updatedEntry: MobilePropertyCacheEntry = {
      ...entry,
      metadata: updateMetadataOnAccess(entry.metadata),
    };
    await dbSet(CACHE_STORE_NAMES.MOBILE_PROPERTIES, key, updatedEntry);

    cacheHits++;
    emitEvent({ type: 'hit', key, timestamp: Date.now(), metadata: entry.metadata });
    
    return {
      data: entry.data,
      source: 'cache',
      stale: status === 'stale',
    };
  } catch (error) {
    logger.error('Error getting cached mobile property:', error);
    emitEvent({ type: 'error', key, timestamp: Date.now(), error: error as Error });
    return { data: null, source: 'none', stale: false, error: error as Error };
  }
};

/**
 * Set a mobile property in cache
 */
export const setCachedMobileProperty = async (
  property: MobileProperty,
  config: CacheConfig = getCacheConfig()
): Promise<void> => {
  const key = `mobile-property:${property.id}`;
  
  try {
    const tempEntry: CacheEntry<MobileProperty> = {
      data: property,
      metadata: createCacheMetadata(key, 0, config),
    };
    const size = calculateEntrySize(tempEntry);

    const entry: MobilePropertyCacheEntry = {
      data: property,
      metadata: createCacheMetadata(key, size, config),
    };

    await dbSet(CACHE_STORE_NAMES.MOBILE_PROPERTIES, key, entry);
    emitEvent({ type: 'set', key, timestamp: Date.now(), metadata: entry.metadata });
    await updateCacheStats();
  } catch (error) {
    logger.error('Error caching mobile property:', error);
    emitEvent({ type: 'error', key, timestamp: Date.now(), error: error as Error });
    throw error;
  }
};

/**
 * Delete a mobile property from cache
 */
export const deleteCachedMobileProperty = async (propertyId: string): Promise<void> => {
  const key = `mobile-property:${propertyId}`;
  
  try {
    await dbDelete(CACHE_STORE_NAMES.MOBILE_PROPERTIES, key);
    emitEvent({ type: 'delete', key, timestamp: Date.now() });
    await updateCacheStats();
  } catch (error) {
    logger.error('Error deleting cached mobile property:', error);
    throw error;
  }
};

/**
 * Cache a search result
 */
export const cacheSearchResult = async (
  filters: SearchFilters,
  sortBy: SortOption,
  result: PropertySearchResult
): Promise<void> => {
  const key = `search:${JSON.stringify({ filters, sortBy })}`;
  
  try {
    // Cache individual properties first
    await Promise.all(
      result.properties.map((property) => setCachedProperty(property))
    );

    // Store search result metadata in localStorage (small data)
    const searchCache = {
      key,
      propertyIds: result.properties.map((p) => p.id),
      total: result.total,
      page: result.page,
      totalPages: result.totalPages,
      cachedAt: Date.now(),
    };

    if (typeof window !== 'undefined') {
      const searches = JSON.parse(
        localStorage.getItem('propchain-search-cache') || '{}'
      );
      searches[key] = searchCache;
      localStorage.setItem('propchain-search-cache', JSON.stringify(searches));
    }

    emitEvent({ type: 'set', key, timestamp: Date.now() });
  } catch (error) {
    logger.error('Error caching search result:', error);
    throw error;
  }
};

/**
 * Get cached search result
 */
export const getCachedSearchResult = async (
  filters: SearchFilters,
  sortBy: SortOption
): Promise<PropertySearchResult | null> => {
  const key = `search:${JSON.stringify({ filters, sortBy })}`;
  
  try {
    if (typeof window === 'undefined') return null;

    const searches = JSON.parse(
      localStorage.getItem('propchain-search-cache') || '{}'
    );
    const cached = searches[key];

    if (!cached) {
      cacheMisses++;
      return null;
    }

    // Check if cache is expired
    const config = getCacheConfig();
    if (Date.now() - cached.cachedAt > config.ttl) {
      cacheMisses++;
      delete searches[key];
      localStorage.setItem('propchain-search-cache', JSON.stringify(searches));
      return null;
    }

    // Retrieve all cached properties
    const properties: Property[] = [];
    for (const propertyId of cached.propertyIds) {
      const result = await getCachedProperty(propertyId);
      if (result.data) {
        properties.push(result.data);
      }
    }

    if (properties.length === 0) {
      cacheMisses++;
      return null;
    }

    cacheHits++;
    emitEvent({ type: 'hit', key, timestamp: Date.now() });

    return {
      properties,
      total: cached.total,
      page: cached.page,
      totalPages: cached.totalPages,
    };
  } catch (error) {
    logger.error('Error getting cached search result:', error);
    return null;
  }
};

/**
 * Get all cached property IDs
 */
export const getAllCachedPropertyIds = async (): Promise<string[]> => {
  try {
    const keys = await dbGetAllKeys(CACHE_STORE_NAMES.PROPERTIES);
    return keys.map((key) => key.replace('property:', ''));
  } catch (error) {
    logger.error('Error getting cached property IDs:', error);
    return [];
  }
};

/**
 * Get all cached mobile property IDs
 */
export const getAllCachedMobilePropertyIds = async (): Promise<string[]> => {
  try {
    const keys = await dbGetAllKeys(CACHE_STORE_NAMES.MOBILE_PROPERTIES);
    return keys.map((key) => key.replace('mobile-property:', ''));
  } catch (error) {
    logger.error('Error getting cached mobile property IDs:', error);
    return [];
  }
};

/**
 * Get all cached properties
 */
export const getAllCachedProperties = async (): Promise<PropertyCacheEntry[]> => {
  try {
    return await dbGetAll(CACHE_STORE_NAMES.PROPERTIES);
  } catch (error) {
    logger.error('Error getting all cached properties:', error);
    return [];
  }
};

/**
 * Get all cached mobile properties
 */
export const getAllCachedMobileProperties = async (): Promise<MobilePropertyCacheEntry[]> => {
  try {
    return await dbGetAll(CACHE_STORE_NAMES.MOBILE_PROPERTIES);
  } catch (error) {
    logger.error('Error getting all cached mobile properties:', error);
    return [];
  }
};

/**
 * Clear all cached properties
 */
export const clearAllCachedProperties = async (): Promise<void> => {
  try {
    await dbClear(CACHE_STORE_NAMES.PROPERTIES);
    await dbClear(CACHE_STORE_NAMES.MOBILE_PROPERTIES);
    
    if (typeof window !== 'undefined') {
      localStorage.removeItem('propchain-search-cache');
    }

    cacheHits = 0;
    cacheMisses = 0;
    emitEvent({ type: 'clear', key: 'all', timestamp: Date.now() });
    await updateCacheStats();
  } catch (error) {
    logger.error('Error clearing all cached properties:', error);
    throw error;
  }
};

/**
 * Update cache statistics
 */
export const updateCacheStats = async (): Promise<CacheStats> => {
  try {
    const propertyCount = await dbCount(CACHE_STORE_NAMES.PROPERTIES);
    const mobilePropertyCount = await dbCount(CACHE_STORE_NAMES.MOBILE_PROPERTIES);
    
    const properties = await getAllCachedProperties();
    const mobileProperties = await getAllCachedMobileProperties();
    
    const totalSize = [...properties, ...mobileProperties].reduce(
      (sum, entry) => sum + entry.metadata.size,
      0
    );

    const allTimestamps = [
      ...properties.map((p) => p.metadata.cachedAt),
      ...mobileProperties.map((p) => p.metadata.cachedAt),
    ];

    const totalRequests = cacheHits + cacheMisses;
    const hitRate = totalRequests > 0 ? cacheHits / totalRequests : 0;
    const missRate = totalRequests > 0 ? cacheMisses / totalRequests : 0;

    // Get storage quota
    let storageQuota = 0;
    let storageUsed = 0;
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      const estimate = await navigator.storage.estimate();
      storageQuota = estimate.quota || 0;
      storageUsed = estimate.usage || 0;
    }

    cacheStats = {
      totalEntries: propertyCount + mobilePropertyCount,
      totalSize,
      storageQuota,
      storageUsed,
      hitRate,
      missRate,
      oldestEntry: allTimestamps.length > 0 ? Math.min(...allTimestamps) : null,
      newestEntry: allTimestamps.length > 0 ? Math.max(...allTimestamps) : null,
    };

    // Persist stats
    if (typeof window !== 'undefined') {
      localStorage.setItem(
        LOCAL_STORAGE_KEYS.CACHE_STATS,
        JSON.stringify(cacheStats)
      );
    }

    return cacheStats;
  } catch (error) {
    logger.error('Error updating cache stats:', error);
    return cacheStats;
  }
};

/**
 * Get cache statistics
 */
export const getCacheStats = (): CacheStats => {
  return cacheStats;
};

/**
 * Clean up expired entries
 */
export const cleanupExpiredEntries = async (): Promise<number> => {
  try {
    const properties = await getAllCachedProperties();
    const mobileProperties = await getAllCachedMobileProperties();
    
    let cleanedCount = 0;
    const now = Date.now();
    const config = getCacheConfig();

    // Clean expired properties
    for (const entry of properties) {
      if (now > entry.metadata.expiresAt) {
        await deleteCachedProperty(entry.data.id);
        cleanedCount++;
      }
    }

    // Clean expired mobile properties
    for (const entry of mobileProperties) {
      if (now > entry.metadata.expiresAt) {
        await deleteCachedMobileProperty(entry.data.id);
        cleanedCount++;
      }
    }

    // Clean expired search caches
    if (typeof window !== 'undefined') {
      const searches = JSON.parse(
        localStorage.getItem('propchain-search-cache') || '{}'
      );
      let modified = false;
      
      for (const [key, value] of Object.entries(searches)) {
        const searchCache = value as { cachedAt: number };
        if (now - searchCache.cachedAt > config.ttl) {
          delete searches[key];
          modified = true;
        }
      }
      
      if (modified) {
        localStorage.setItem('propchain-search-cache', JSON.stringify(searches));
      }
    }

    if (cleanedCount > 0) {
      emitEvent({
        type: 'cleanup',
        key: 'expired',
        timestamp: Date.now(),
      });
      await updateCacheStats();
    }

    return cleanedCount;
  } catch (error) {
    logger.error('Error cleaning up expired entries:', error);
    return 0;
  }
};

/**
 * Initialize the cache system
 */
export const initPropertyCache = async (): Promise<void> => {
  if (!isCacheAvailable()) {
    logger.warn('IndexedDB not supported, caching disabled');
    return;
  }

  try {
    // Load cached stats
    if (typeof window !== 'undefined') {
      const storedStats = localStorage.getItem(LOCAL_STORAGE_KEYS.CACHE_STATS);
      if (storedStats) {
        cacheStats = { ...cacheStats, ...JSON.parse(storedStats) };
      }
    }

    // Clean up expired entries on init
    await cleanupExpiredEntries();
    
    // Set up periodic cleanup
    const config = getCacheConfig();
    setInterval(cleanupExpiredEntries, config.cleanupInterval);

    logger.info('Property cache initialized');
  } catch (error) {
    logger.error('Error initializing property cache:', error);
  }
};

// Auto-initialize on module load if in browser
if (typeof window !== 'undefined') {
  initPropertyCache();
}
