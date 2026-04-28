/**
 * Cache System Exports
 * Centralized exports for all caching functionality
 */

// Core cache types
export type {
  CacheEntry,
  CacheMetadata,
  CacheStats,
  CacheConfig,
  CacheResult,
  CacheStrategy,
  CacheEvent,
  CacheEventListener,
  PropertyCacheEntry,
  MobilePropertyCacheEntry,
  CacheEntryStatus,
} from '@/types/cache';

export {
  DEFAULT_CACHE_CONFIG,
  CACHE_STORE_NAMES,
  LOCAL_STORAGE_KEYS,
  CACHE_DB_NAME,
  CACHE_DB_VERSION,
  getCacheEntryStatus,
  calculateEntrySize,
} from '@/types/cache';

// IndexedDB operations
export {
  initIndexedDB,
  dbGet,
  dbSet,
  dbDelete,
  dbGetAll,
  dbGetAllKeys,
  dbClear,
  dbCount,
  closeIndexedDB,
  isIndexedDBSupported,
  deleteDatabase,
} from '../indexedDB';

// Property cache operations
export {
  // Core operations
  getCachedProperty,
  setCachedProperty,
  deleteCachedProperty,
  getCachedMobileProperty,
  setCachedMobileProperty,
  deleteCachedMobileProperty,
  
  // Search cache
  cacheSearchResult,
  getCachedSearchResult,
  
  // Bulk operations
  getAllCachedProperties,
  getAllCachedMobileProperties,
  getAllCachedPropertyIds,
  getAllCachedMobilePropertyIds,
  clearAllCachedProperties,
  
  // Stats and monitoring
  getCacheStats,
  updateCacheStats,
  cleanupExpiredEntries,
  
  // Configuration
  getCacheConfig,
  setCacheConfig,
  isCacheAvailable,
  initPropertyCache,
  
  // Events
  addCacheEventListener,
} from '../propertyCache';

// Cache manager
export {
  // Initialization
  initCacheManager,
  
  // Network state
  isNetworkOnline,
  addNetworkStateListener,
  
  // Synchronization
  performBackgroundSync,
  getLastSyncTime,
  addToSyncQueue,
  getSyncQueueLength,
  clearSyncQueue,
  
  // Cache management
  invalidateCache,
  invalidateAllCache,
  getCacheHealth,
  optimizeCache,
  
  // Import/Export
  exportCacheData,
  importCacheData,
  
  // Utilities
  createCachedFetch,
} from '../cacheManager';

// Default export with all functionality
export { default as cacheManager } from '../cacheManager';
