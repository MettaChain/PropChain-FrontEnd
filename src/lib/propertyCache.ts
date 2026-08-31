/**
 * Property Cache Service
 * High-level caching operations for property data with IndexedDB
 */

import { logger } from '@/utils/logger';
import { STORAGE_KEYS } from './storageKeys';
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
import { safeLocalStorage } from '@/utils/safeLocalStorage';

// Event listeners
const eventListeners: Set<CacheEventListener> = new Set();

// Interval handle for cleanup timer (stored at module level to allow cleanup on re-init)
let cleanupIntervalHandle: ReturnType<typeof setInterval> | null = null;

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
  evictionCount: 0,
  invalidationCount: 0,
  entitiesByType: {},
  sizeByType: {},
};

// Request counters for hit/miss rate
let cacheHits = 0;
let cacheMisses = 0;
let evictionCount = 0;
let invalidationCount = 0;

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
  dataType: string = 'default',
  config: CacheConfig = DEFAULT_CACHE_CONFIG
): CacheMetadata => {
  const now = Date.now();
  // Get TTL for this data type, fallback to default TTL
  const ttl = config.dataTypeTtls?.[dataType] ?? config.ttl;
  
  return {
    key,
    cachedAt: now,
    expiresAt: now + ttl,
    lastAccessed: now,
    accessCount: 0,
    size,
    version: config.version,
    dataType,
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
  
  const stored = safeLocalStorage.getJSON<CacheConfig>(LOCAL_STORAGE_KEYS.CACHE_CONFIG, DEFAULT_CACHE_CONFIG);
  return { ...DEFAULT_CACHE_CONFIG, ...stored };
};

/**
 * Set cache configuration
 */
export const setCacheConfig = (config: Partial<CacheConfig>): void => {
  if (typeof window === 'undefined') return;
  
  const current = getCacheConfig();
  const updated = { ...current, ...config };
  safeLocalStorage.setJSON(LOCAL_STORAGE_KEYS.CACHE_CONFIG, updated);
};

/**
 * Check if cache is available
 */
export const isCacheAvailable = (): boolean => {
  return isIndexedDBSupported();
};

/**
 * Perform LRU eviction when cache limits are exceeded
 */
const performLRUEviction = async (config: CacheConfig): Promise<void> => {
  if (!config.enableLRU) return;

  try {
    const properties = await getAllCachedProperties();
    const mobileProperties = await getAllCachedMobileProperties();
    const allEntries = [
      ...properties.map(p => ({ ...p, type: 'property' as const })),
      ...mobileProperties.map(p => ({ ...p, type: 'mobile-property' as const }))
    ];

    // Check if we exceed max entries
    if (allEntries.length > config.maxEntries) {
      // Sort by last accessed (ascending) - least recently used first
      const sorted = [...allEntries].sort(
        (a, b) => a.metadata.lastAccessed - b.metadata.lastAccessed
      );

      // Remove least recently used entries until we're under the limit
      const toRemove = sorted.length - config.maxEntries;
      for (let i = 0; i < toRemove; i++) {
        const entry = sorted[i];
        if (entry.type === 'property') {
          await deleteCachedProperty(entry.data.id);
        } else {
          await deleteCachedMobileProperty(entry.data.id);
        }
        evictionCount++;
        emitEvent({
          type: 'evict',
          key: entry.metadata.key,
          timestamp: Date.now(),
          reason: 'LRU eviction - max entries exceeded',
        });
      }
    }

    // Check if we exceed max size
    const totalSize = allEntries.reduce((sum, e) => sum + e.metadata.size, 0);
    if (totalSize > config.maxSize) {
      const sorted = [...allEntries].sort(
        (a, b) => a.metadata.lastAccessed - b.metadata.lastAccessed
      );

      // Remove least recently used entries until we're under the size limit
      let currentSize = totalSize;
      for (const entry of sorted) {
        if (currentSize <= config.maxSize * 0.9) break; // Stop at 90% of max

        if (entry.type === 'property') {
          await deleteCachedProperty(entry.data.id);
        } else {
          await deleteCachedMobileProperty(entry.data.id);
        }
        currentSize -= entry.metadata.size;
        evictionCount++;
        emitEvent({
          type: 'evict',
          key: entry.metadata.key,
          timestamp: Date.now(),
          reason: 'LRU eviction - size limit exceeded',
        });
      }
    }
  } catch (error) {
    logger.error('Error performing LRU eviction:', error);
  }
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
      emitEvent({ type: 'miss', key, timestamp: Date.now(), dataType: 'property' });
      return { data: null, source: 'none', stale: false };
    }

    const status = getCacheEntryStatus(entry.metadata);
    
    if (status === 'expired') {
      cacheMisses++;
      await deleteCachedProperty(propertyId);
      emitEvent({ 
        type: 'expire', 
        key, 
        timestamp: Date.now(), 
        metadata: entry.metadata,
        dataType: 'property' 
      });
      return { data: null, source: 'none', stale: false };
    }

    // Update access metadata
    const updatedEntry: PropertyCacheEntry = {
      ...entry,
      metadata: updateMetadataOnAccess(entry.metadata),
    };
    await dbSet(CACHE_STORE_NAMES.PROPERTIES, key, updatedEntry);

    cacheHits++;
    emitEvent({ 
      type: 'hit', 
      key, 
      timestamp: Date.now(), 
      metadata: entry.metadata,
      dataType: 'property' 
    });
    
    return {
      data: entry.data,
      source: 'cache',
      stale: status === 'stale',
    };
  } catch (error) {
    logger.error('Error getting cached property:', error);
    emitEvent({ 
      type: 'error', 
      key, 
      timestamp: Date.now(), 
      error: error as Error,
      dataType: 'property' 
    });
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
      metadata: createCacheMetadata(key, 0, 'property', config),
    };
    const size = calculateEntrySize(tempEntry);

    const entry: PropertyCacheEntry = {
      data: property,
      metadata: createCacheMetadata(key, size, 'property', config),
    };

    await dbSet(CACHE_STORE_NAMES.PROPERTIES, key, entry);
    emitEvent({ 
      type: 'set', 
      key, 
      timestamp: Date.now(), 
      metadata: entry.metadata,
      dataType: 'property'
    });
    
    // Perform LRU eviction if needed
    await performLRUEviction(config);
    
    // Update stats
    await updateCacheStats();
  } catch (error) {
    logger.error('Error caching property:', error);
    emitEvent({ 
      type: 'error', 
      key, 
      timestamp: Date.now(), 
      error: error as Error,
      dataType: 'property'
    });
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
      metadata: createCacheMetadata(key, 0, 'mobile-property', config),
    };
    const size = calculateEntrySize(tempEntry);

    const entry: MobilePropertyCacheEntry = {
      data: property,
      metadata: createCacheMetadata(key, size, 'mobile-property', config),
    };

    await dbSet(CACHE_STORE_NAMES.MOBILE_PROPERTIES, key, entry);
    emitEvent({ 
      type: 'set', 
      key, 
      timestamp: Date.now(), 
      metadata: entry.metadata,
      dataType: 'mobile-property'
    });
    
    // Perform LRU eviction if needed
    await performLRUEviction(config);
    
    await updateCacheStats();
  } catch (error) {
    logger.error('Error caching mobile property:', error);
    emitEvent({ 
      type: 'error', 
      key, 
      timestamp: Date.now(), 
      error: error as Error,
      dataType: 'mobile-property'
    });
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
      const searches = safeLocalStorage.getJSON<Record<string, any>>(STORAGE_KEYS.SEARCH_CACHE.key, {});
      searches[key] = searchCache;
      safeLocalStorage.setJSON(STORAGE_KEYS.SEARCH_CACHE.key, searches);
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

    const searches = safeLocalStorage.getJSON<Record<string, any>>(STORAGE_KEYS.SEARCH_CACHE.key, {});
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
      safeLocalStorage.setJSON(STORAGE_KEYS.SEARCH_CACHE.key, searches);
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
      safeLocalStorage.remove(STORAGE_KEYS.SEARCH_CACHE.key);
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

    // Calculate metrics by data type
    const entitiesByType: Record<string, number> = {};
    const sizeByType: Record<string, number> = {};

    properties.forEach(p => {
      const dt = p.metadata.dataType;
      entitiesByType[dt] = (entitiesByType[dt] || 0) + 1;
      sizeByType[dt] = (sizeByType[dt] || 0) + p.metadata.size;
    });

    mobileProperties.forEach(p => {
      const dt = p.metadata.dataType;
      entitiesByType[dt] = (entitiesByType[dt] || 0) + 1;
      sizeByType[dt] = (sizeByType[dt] || 0) + p.metadata.size;
    });

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
      evictionCount,
      invalidationCount,
      entitiesByType,
      sizeByType,
    };

    // Persist stats
    if (typeof window !== 'undefined') {
      safeLocalStorage.setJSON(LOCAL_STORAGE_KEYS.CACHE_STATS, cacheStats);
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
        emitEvent({
          type: 'cleanup',
          key: entry.metadata.key,
          timestamp: Date.now(),
          dataType: entry.metadata.dataType,
          reason: 'TTL expired',
        });
      }
    }

    // Clean expired mobile properties
    for (const entry of mobileProperties) {
      if (now > entry.metadata.expiresAt) {
        await deleteCachedMobileProperty(entry.data.id);
        cleanedCount++;
        emitEvent({
          type: 'cleanup',
          key: entry.metadata.key,
          timestamp: Date.now(),
          dataType: entry.metadata.dataType,
          reason: 'TTL expired',
        });
      }
    }

    // Clean expired search caches
    if (typeof window !== 'undefined') {
      const searches = safeLocalStorage.getJSON<Record<string, any>>(STORAGE_KEYS.SEARCH_CACHE.key, {});
      let modified = false;
      
      for (const [key, value] of Object.entries(searches)) {
        const searchCache = value as { cachedAt: number };
        const searchTTL = config.dataTypeTtls?.['search'] ?? config.ttl;
        if (now - searchCache.cachedAt > searchTTL) {
          delete searches[key];
          modified = true;
          cleanedCount++;
          emitEvent({
            type: 'cleanup',
            key,
            timestamp: Date.now(),
            dataType: 'search',
            reason: 'TTL expired',
          });
        }
      }
      
      if (modified) {
        safeLocalStorage.setJSON(STORAGE_KEYS.SEARCH_CACHE.key, searches);
      }
    }

    if (cleanedCount > 0) {
      emitEvent({
        type: 'cleanup',
        key: 'batch',
        timestamp: Date.now(),
        reason: `${cleanedCount} entries cleaned`,
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
      const storedStats = safeLocalStorage.getJSON<Partial<CacheStats>>(LOCAL_STORAGE_KEYS.CACHE_STATS, {});
      cacheStats = { ...cacheStats, ...storedStats };
    }

    // Clean up expired entries on init
    await cleanupExpiredEntries();
    
    // Clear any existing cleanup interval (prevents accumulation on HMR / re-imports)
    if (cleanupIntervalHandle !== null) {
      clearInterval(cleanupIntervalHandle);
    }

    // Set up periodic cleanup
    const config = getCacheConfig();
    cleanupIntervalHandle = setInterval(cleanupExpiredEntries, config.cleanupInterval);

    logger.info('Property cache initialized');
  } catch (error) {
    logger.error('Error initializing property cache:', error);
  }
};

// Auto-initialize on module load if in browser
if (typeof window !== 'undefined') {
  initPropertyCache();
}
