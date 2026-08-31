/**
 * Safe LocalStorage Utility
 *
 * Centralized localStorage wrapper that safely handles:
 * - BigInt values (converts to string representation)
 * - Circular references (detects and breaks cycles)
 * - Undefined values (converts to null)
 * - Functions (strips them out)
 * - Special types (Date, RegExp, Map, Set)
 *
 * All writes are wrapped in try/catch with structured logging on failure.
 */

import { logger } from './logger';

// ============================================================================
// Type definitions
// ============================================================================

/** Shape of the search cache used in propertyCache */
export interface SearchCacheEntry {
  key: string;
  propertyIds: string[];
  total: number;
  page: number;
  totalPages: number;
  cachedAt: number;
}

/** Shape of sync queue items in cacheManager */
export interface SyncQueueItem {
  id: string;
  type: 'property-update' | 'property-delete' | 'search-update';
  payload: unknown;
  timestamp: number;
  retries: number;
}

// ============================================================================
// Serialization helpers
// ============================================================================

/**
 * JSON replacer that handles BigInt, Date, RegExp, Map, Set, and circular references.
 */
function safeReplacer(): (key: string, value: unknown) => unknown {
  const seen = new WeakSet<object>();

  return (_key: string, value: unknown): unknown => {
    // Handle BigInt
    if (typeof value === 'bigint') {
      return { __type: 'BigInt', __value: value.toString() };
    }

    // Handle Date
    if (value instanceof Date) {
      return { __type: 'Date', __value: value.toISOString() };
    }

    // Handle RegExp
    if (value instanceof RegExp) {
      return { __type: 'RegExp', __value: value.toString() };
    }

    // Handle Map
    if (value instanceof Map) {
      return {
        __type: 'Map',
        __value: Array.from(value.entries()),
      };
    }

    // Handle Set
    if (value instanceof Set) {
      return {
        __type: 'Set',
        __value: Array.from(value.values()),
      };
    }

    // Handle circular references
    if (typeof value === 'object' && value !== null) {
      if (seen.has(value as object)) {
        return { __type: 'CircularRef', __value: '[Circular]' };
      }
      seen.add(value as object);
    }

    // Handle undefined
    if (value === undefined) {
      return null;
    }

    // Handle functions (strip them out)
    if (typeof value === 'function') {
      return undefined;
    }

    return value;
  };
}

/**
 * JSON reviver that restores BigInt, Date, RegExp, Map, and Set.
 */
function safeReviver(_key: string, value: unknown): unknown {
  if (value && typeof value === 'object' && '__type' in value) {
    const typed = value as { __type: string; __value: unknown };

    switch (typed.__type) {
      case 'BigInt':
        return BigInt(typed.__value as string);
      case 'Date':
        return new Date(typed.__value as string);
      case 'RegExp': {
        const str = typed.__value as string;
        const match = str.match(/^\/(.+)\/([gimsuy]*)$/);
        if (match) {
          return new RegExp(match[1], match[2]);
        }
        return new RegExp(str);
      }
      case 'Map':
        return new Map(typed.__value as [unknown, unknown][]);
      case 'Set':
        return new Set(typed.__value as unknown[]);
      case 'CircularRef':
        return '[Circular Reference]';
      default:
        return typed.__value;
    }
  }
  return value;
}

// ============================================================================
// Safe serialization
// ============================================================================

/**
 * Safely stringify a value, handling BigInt, circular references, and other
 * non-JSON-safe types. Never throws - returns null on failure.
 *
 * @param value - The value to stringify
 * @param space - Optional indentation for pretty-printing
 * @returns JSON string or null on failure
 */
export function safeStringify(value: unknown, space?: number): string | null {
  try {
    return JSON.stringify(value, safeReplacer(), space);
  } catch (error) {
    logger.error('safeStringify failed', {
      metadata: {
        error: error instanceof Error ? error.message : String(error),
        valueType: typeof value,
      },
    });
    return null;
  }
}

/**
 * Safely parse a JSON string, restoring special types.
 * Never throws - returns null on failure.
 *
 * @param json - The JSON string to parse
 * @returns Parsed value or null on failure
 */
export function safeParse<T = unknown>(json: string): T | null {
  try {
    return JSON.parse(json, safeReviver) as T;
  } catch (error) {
    logger.error('safeParse failed', {
      metadata: {
        error: error instanceof Error ? error.message : String(error),
        jsonPreview: json.slice(0, 100),
      },
    });
    return null;
  }
}

// ============================================================================
// Safe localStorage API
// ============================================================================

/**
 * Safely set a value in localStorage with JSON serialization.
 * Handles BigInt, circular refs, and non-serializable values automatically.
 * Never throws.
 *
 * @param key - localStorage key
 * @param value - Value to store
 * @returns true if successful, false otherwise
 */
export function safeSetItem(key: string, value: unknown): boolean {
  if (typeof window === 'undefined') return false;

  try {
    const json = safeStringify(value);
    if (json === null) return false;
    localStorage.setItem(key, json);
    return true;
  } catch (error) {
    logger.error(`Failed to write to localStorage key "${key}"`, {
      metadata: {
        error: error instanceof Error ? error.message : String(error),
        key,
      },
    });
    return false;
  }
}

/**
 * Safely get and parse a value from localStorage.
 * Handles type restoration (BigInt, Date, etc.).
 * Never throws.
 *
 * @param key - localStorage key
 * @param defaultValue - Fallback value if key doesn't exist or parsing fails
 * @returns Parsed value or defaultValue
 */
export function safeGetItem<T = unknown>(key: string, defaultValue: T | null = null): T | null {
  if (typeof window === 'undefined') return defaultValue;

  try {
    const raw = localStorage.getItem(key);
    if (raw === null) return defaultValue;

    const parsed = safeParse<T>(raw);
    if (parsed === null) return defaultValue;

    return parsed;
  } catch (error) {
    logger.error(`Failed to read from localStorage key "${key}"`, {
      metadata: {
        error: error instanceof Error ? error.message : String(error),
        key,
      },
    });
    return defaultValue;
  }
}

/**
 * Remove a key from localStorage. Never throws.
 *
 * @param key - localStorage key to remove
 * @returns true if successful, false otherwise
 */
export function safeRemoveItem(key: string): boolean {
  if (typeof window === 'undefined') return false;

  try {
    localStorage.removeItem(key);
    return true;
  } catch (error) {
    logger.error(`Failed to remove localStorage key "${key}"`, {
      metadata: {
        error: error instanceof Error ? error.message : String(error),
        key,
      },
    });
    return false;
  }
}

/**
 * Check if a key exists in localStorage.
 *
 * @param key - localStorage key to check
 * @returns true if the key exists
 */
export function safeHasItem(key: string): boolean {
  if (typeof window === 'undefined') return false;

  try {
    return localStorage.getItem(key) !== null;
  } catch {
    return false;
  }
}

// ============================================================================
// Namespaced helpers for common app storage patterns
// ============================================================================

/**
 * Cache config storage helper.
 */
export const safeLocalStorage = {
  get: safeGetItem,
  set: safeSetItem,
  remove: safeRemoveItem,
  has: safeHasItem,

  /** Get with type assertion */
  getJSON<T>(key: string, defaultValue: T): T {
    const result = safeGetItem<T>(key);
    return result !== null ? result : defaultValue;
  },

  /** Set object, logging key on failure */
  setJSON(key: string, value: unknown): boolean {
    const result = safeSetItem(key, value);
    if (!result) {
      logger.warn(`safeLocalStorage.setJSON failed for key: ${key}`);
    }
    return result;
  },
};
