/**
 * IndexedDB Manager
 * Low-level IndexedDB operations for the caching system
 */

import { logger } from '@/utils/logger';
import {
  CACHE_DB_NAME,
  CACHE_DB_VERSION,
  CACHE_STORE_NAMES,
  type CacheDatabaseSchema,
} from '@/types/cache';

// Database instance
let dbInstance: IDBDatabase | null = null;

/**
 * Initialize the IndexedDB database
 */
export const initIndexedDB = async (): Promise<IDBDatabase> => {
  if (dbInstance) return dbInstance;

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(CACHE_DB_NAME, CACHE_DB_VERSION);

    request.onerror = () => {
      logger.error('Failed to open IndexedDB:', request.error);
      reject(request.error);
    };

    request.onsuccess = () => {
      dbInstance = request.result;
      resolve(dbInstance);
    };

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      // Create object stores if they don't exist
      if (!db.objectStoreNames.contains(CACHE_STORE_NAMES.PROPERTIES)) {
        db.createObjectStore(CACHE_STORE_NAMES.PROPERTIES, { keyPath: 'metadata.key' });
      }

      if (!db.objectStoreNames.contains(CACHE_STORE_NAMES.MOBILE_PROPERTIES)) {
        db.createObjectStore(CACHE_STORE_NAMES.MOBILE_PROPERTIES, { keyPath: 'metadata.key' });
      }

      if (!db.objectStoreNames.contains(CACHE_STORE_NAMES.METADATA)) {
        db.createObjectStore(CACHE_STORE_NAMES.METADATA, { keyPath: 'key' });
      }

      if (!db.objectStoreNames.contains(CACHE_STORE_NAMES.IMAGES)) {
        db.createObjectStore(CACHE_STORE_NAMES.IMAGES, { keyPath: 'key' });
      }
    };
  });
};

/**
 * Get a value from the database
 */
export const dbGet = async <T>(
  storeName: keyof CacheDatabaseSchema,
  key: string
): Promise<T | null> => {
  try {
    const db = await initIndexedDB();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.get(key);

      request.onsuccess = () => {
        resolve(request.result || null);
      };

      request.onerror = () => {
        reject(request.error);
      };
    });
  } catch (error) {
    logger.error(`Error getting from ${storeName}:`, error);
    return null;
  }
};

/**
 * Set a value in the database
 */
export const dbSet = async <T>(
  storeName: keyof CacheDatabaseSchema,
  key: string,
  value: T
): Promise<void> => {
  try {
    const db = await initIndexedDB();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.put(value);

      request.onsuccess = () => {
        resolve();
      };

      request.onerror = () => {
        reject(request.error);
      };
    });
  } catch (error) {
    logger.error(`Error setting in ${storeName}:`, error);
    throw error;
  }
};

/**
 * Delete a value from the database
 */
export const dbDelete = async (
  storeName: keyof CacheDatabaseSchema,
  key: string
): Promise<void> => {
  try {
    const db = await initIndexedDB();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.delete(key);

      request.onsuccess = () => {
        resolve();
      };

      request.onerror = () => {
        reject(request.error);
      };
    });
  } catch (error) {
    logger.error(`Error deleting from ${storeName}:`, error);
    throw error;
  }
};

/**
 * Get all keys from a store
 */
export const dbGetAllKeys = async (
  storeName: keyof CacheDatabaseSchema
): Promise<string[]> => {
  try {
    const db = await initIndexedDB();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.getAllKeys();

      request.onsuccess = () => {
        resolve(request.result as string[]);
      };

      request.onerror = () => {
        reject(request.error);
      };
    });
  } catch (error) {
    logger.error(`Error getting keys from ${storeName}:`, error);
    return [];
  }
};

/**
 * Get all values from a store
 */
export const dbGetAll = async <T>(
  storeName: keyof CacheDatabaseSchema
): Promise<T[]> => {
  try {
    const db = await initIndexedDB();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.getAll();

      request.onsuccess = () => {
        resolve(request.result);
      };

      request.onerror = () => {
        reject(request.error);
      };
    });
  } catch (error) {
    logger.error(`Error getting all from ${storeName}:`, error);
    return [];
  }
};

/**
 * Clear all data from a store
 */
export const dbClear = async (
  storeName: keyof CacheDatabaseSchema
): Promise<void> => {
  try {
    const db = await initIndexedDB();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.clear();

      request.onsuccess = () => {
        resolve();
      };

      request.onerror = () => {
        reject(request.error);
      };
    });
  } catch (error) {
    logger.error(`Error clearing ${storeName}:`, error);
    throw error;
  }
};

/**
 * Count entries in a store
 */
export const dbCount = async (
  storeName: keyof CacheDatabaseSchema
): Promise<number> => {
  try {
    const db = await initIndexedDB();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.count();

      request.onsuccess = () => {
        resolve(request.result);
      };

      request.onerror = () => {
        reject(request.error);
      };
    });
  } catch (error) {
    logger.error(`Error counting ${storeName}:`, error);
    return 0;
  }
};

/**
 * Close the database connection
 */
export const closeIndexedDB = (): void => {
  if (dbInstance) {
    dbInstance.close();
    dbInstance = null;
  }
};

/**
 * Check if IndexedDB is supported
 */
export const isIndexedDBSupported = (): boolean => {
  return typeof window !== 'undefined' && 'indexedDB' in window;
};

/**
 * Delete the entire database
 */
export const deleteDatabase = async (): Promise<void> => {
  return new Promise((resolve, reject) => {
    closeIndexedDB();
    const request = indexedDB.deleteDatabase(CACHE_DB_NAME);

    request.onsuccess = () => {
      logger.info('IndexedDB database deleted successfully');
      resolve();
    };

    request.onerror = () => {
      logger.error('Failed to delete IndexedDB database:', request.error);
      reject(request.error);
    };

    request.onblocked = () => {
      logger.warn('IndexedDB deletion blocked');
    };
  });
};
