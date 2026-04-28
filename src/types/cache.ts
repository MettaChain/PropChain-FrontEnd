/**
 * Cache Types and Interfaces
 * Centralized type definitions for the caching system
 */

import type { Property } from './property';
import type { MobileProperty } from './mobileProperty';

// Cache entry states
export type CacheEntryStatus = 'fresh' | 'stale' | 'expired' | 'error';

// Cache entry metadata
export interface CacheMetadata {
  key: string;
  cachedAt: number;
  expiresAt: number;
  lastAccessed: number;
  accessCount: number;
  size: number;
  version: number;
  etag?: string;
  checksum?: string;
}

// Generic cache entry
export interface CacheEntry<T> {
  data: T;
  metadata: CacheMetadata;
}

// Property-specific cache entry
export interface PropertyCacheEntry extends CacheEntry<Property> {
  data: Property;
}

// Mobile property cache entry
export interface MobilePropertyCacheEntry extends CacheEntry<MobileProperty> {
  data: MobileProperty;
}

// Cache statistics
export interface CacheStats {
  totalEntries: number;
  totalSize: number;
  storageQuota: number;
  storageUsed: number;
  hitRate: number;
  missRate: number;
  oldestEntry: number | null;
  newestEntry: number | null;
}

// Cache configuration options
export interface CacheConfig {
  // Time-to-live in milliseconds
  ttl: number;
  // Maximum cache size in bytes
  maxSize: number;
  // Maximum number of entries
  maxEntries: number;
  // Cleanup interval in milliseconds
  cleanupInterval: number;
  // Enable compression
  compression: boolean;
  // Cache version for migrations
  version: number;
}

// Default cache configuration
export const DEFAULT_CACHE_CONFIG: CacheConfig = {
  ttl: 24 * 60 * 60 * 1000, // 24 hours
  maxSize: 50 * 1024 * 1024, // 50 MB
  maxEntries: 1000,
  cleanupInterval: 5 * 60 * 1000, // 5 minutes
  compression: false,
  version: 1,
};

// Cache strategies
export type CacheStrategy = 'cache-first' | 'network-first' | 'stale-while-revalidate' | 'cache-only' | 'network-only';

// Cache operation result
export interface CacheResult<T> {
  data: T | null;
  source: 'cache' | 'network' | 'none';
  stale: boolean;
  error?: Error;
}

// Cache event types
export type CacheEventType = 
  | 'hit'
  | 'miss'
  | 'set'
  | 'delete'
  | 'expire'
  | 'clear'
  | 'error'
  | 'cleanup';

// Cache event
export interface CacheEvent {
  type: CacheEventType;
  key: string;
  timestamp: number;
  metadata?: Partial<CacheMetadata>;
  error?: Error;
}

// Cache event listener
export type CacheEventListener = (event: CacheEvent) => void;

// IndexedDB schema
export interface CacheDatabaseSchema {
  properties: {
    key: string;
    value: PropertyCacheEntry;
  };
  mobileProperties: {
    key: string;
    value: MobilePropertyCacheEntry;
  };
  metadata: {
    key: string;
    value: CacheMetadata;
  };
  images: {
    key: string;
    value: Blob;
  };
}

// Database configuration
export const CACHE_DB_NAME = 'PropChainCache';
export const CACHE_DB_VERSION = 1;
export const CACHE_STORE_NAMES = {
  PROPERTIES: 'properties',
  MOBILE_PROPERTIES: 'mobileProperties',
  METADATA: 'metadata',
  IMAGES: 'images',
} as const;

// Storage keys for localStorage (for small data)
export const LOCAL_STORAGE_KEYS = {
  CACHE_CONFIG: 'propchain-cache-config',
  CACHE_STATS: 'propchain-cache-stats',
  CACHE_VERSION: 'propchain-cache-version',
  SYNC_QUEUE: 'propchain-sync-queue',
  LAST_SYNC: 'propchain-last-sync',
} as const;

// Type guards
export const isCacheMetadata = (value: unknown): value is CacheMetadata => {
  if (typeof value !== 'object' || value === null) return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.key === 'string' &&
    typeof v.cachedAt === 'number' &&
    typeof v.expiresAt === 'number' &&
    typeof v.lastAccessed === 'number' &&
    typeof v.accessCount === 'number' &&
    typeof v.size === 'number' &&
    typeof v.version === 'number'
  );
};

export const isCacheEntry = <T>(value: unknown): value is CacheEntry<T> => {
  if (typeof value !== 'object' || value === null) return false;
  const v = value as Record<string, unknown>;
  return (
    v.data !== undefined &&
    isCacheMetadata(v.metadata)
  );
};

// Cache entry status check
export const getCacheEntryStatus = (metadata: CacheMetadata): CacheEntryStatus => {
  const now = Date.now();
  if (now > metadata.expiresAt) return 'expired';
  if (now > metadata.expiresAt - (DEFAULT_CACHE_CONFIG.ttl * 0.2)) return 'stale';
  return 'fresh';
};

// Calculate entry size (approximate)
export const calculateEntrySize = <T>(entry: CacheEntry<T>): number => {
  try {
    const jsonString = JSON.stringify(entry);
    // Approximate size in bytes (2 bytes per character for UTF-16)
    return jsonString.length * 2;
  } catch {
    return 0;
  }
};
