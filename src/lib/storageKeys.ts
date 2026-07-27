/**
 * Centralised Storage Keys
 *
 * Every localStorage key used across the application is defined here so that:
 * - Key strings are never inlined, preventing typos and collisions.
 * - Each key carries an explicit TTL so cleanup logic can be automated.
 * - Migration from old ad‑hoc keys is documented inline.
 *
 * Issue #480 — refactor: centralise localStorage key constants
 */

// Re-export cache-specific keys from the existing cache types module.
// These remain valid and are already consumed by cacheManager / propertyCache.
export { LOCAL_STORAGE_KEYS as CACHE_STORAGE_KEYS } from '@/types/cache';

/**
 * Time-to-live in milliseconds.
 * Use `Session` for data that should be cleared when the tab closes
 * (we simulate that by clearing on `beforeunload` inside the app shell).
 */
export const TTL = {
  /** Persisted forever — cleared only via explicit user action. */
  PERMANENT: Number.POSITIVE_INFINITY,
  /** 24 hours */
  DAY: 24 * 60 * 60 * 1000,
  /** 1 hour */
  HOUR: 60 * 60 * 1000,
  /** 15 minutes */
  QUARTER_HOUR: 15 * 60 * 1000,
  /** 5 minutes */
  FIVE_MINUTES: 5 * 60 * 1000,
  /** Session-scoped (cleared on beforeunload). */
  SESSION: -1,
} as const;

export interface StorageKeyDefinition {
  /** The exact localStorage key string. */
  key: string;
  /** When the value should be considered stale. `PERMANENT` = never expire. */
  ttl: number;
  /** Human-readable description for documentation / debugging. */
  description: string;
  /** Previous ad‑hoc key(s) that are now migrated to this canonical key. */
  migratedFrom?: string[];
}

// ─── Keys ────────────────────────────────────────────────────────────────────

/** Portfolio drag-and-drop order. */
const PORTFOLIO_ORDER: StorageKeyDefinition = {
  key: 'propchain:portfolioOrder',
  ttl: TTL.PERMANENT,
  description: 'User-ordered portfolio property IDs (JSON array).',
  migratedFrom: ['portfolioOrder'],
};

/** Selected display currency preference. */
const CURRENCY_PREFERENCE: StorageKeyDefinition = {
  key: 'propchain:currencyPreference',
  ttl: TTL.PERMANENT,
  description: 'User-selected fiat / crypto display currency.',
  migratedFrom: ['currencyPreference'],
};

/** Wagmi / RainbowKit connection flag — see wallet store. */
const WAGMI_CONNECTED: StorageKeyDefinition = {
  key: 'wagmi.connected',
  ttl: TTL.SESSION,
  description: 'Wagmi connection persisted state (managed by wagmi core).',
};

/** Legacy wallet-connected flag (used in error recovery). */
const WALLET_CONNECTED: StorageKeyDefinition = {
  key: 'walletconnected',
  ttl: TTL.SESSION,
  description: 'Legacy wallet-connected flag for error recovery.',
};

/** Property search cache — consumed by propertyCache service. */
const SEARCH_CACHE: StorageKeyDefinition = {
  key: 'propchain:searchCache',
  ttl: TTL.HOUR,
  description: 'Cached property search results (JSON).',
  migratedFrom: ['propchain-search-cache'],
};

/** Saved searches per user.  Append userId for the full key. */
const SAVED_SEARCHES: StorageKeyDefinition = {
  key: 'propchain:savedSearches',
  ttl: TTL.PERMANENT,
  description: 'Per-user saved searches. Append `:userId`.',
  migratedFrom: ['propchain-saved-searches'],
};

/** ETH-USD exchange rate cache. */
const ETH_TO_USD_RATE: StorageKeyDefinition = {
  key: 'propchain:ethToUsdRate',
  ttl: TTL.QUARTER_HOUR,
  description: 'Cached ETH-USD price from CoinGecko.',
  migratedFrom: ['ethToUsdRate'],
};

/** Timestamp of the last ETH-USD rate fetch. */
const ETH_TO_USD_LAST_UPDATED: StorageKeyDefinition = {
  key: 'propchain:ethToUsdLastUpdated',
  ttl: TTL.QUARTER_HOUR,
  description: 'ISO timestamp of last ETH-USD rate fetch.',
  migratedFrom: ['ethToUsdLastUpdated'],
};

/** Theme preference — managed by next-themes (key must match storageKey prop). */
const THEME: StorageKeyDefinition = {
  key: 'theme',
  ttl: TTL.PERMANENT,
  description: 'next-themes theme preference (light / dark / system).',
};

/** Per-transaction notification suppression.  Append tx-hash for the full key. */
const NOTIFIED_TX: StorageKeyDefinition = {
  key: 'propchain:notifiedTx',
  ttl: TTL.PERMANENT,
  description: 'Per-tx notification suppression flag. Append `:txHash`.',
  migratedFrom: ['notified_tx-already'],
};

/** i18next language preference. */
const I18N_LANGUAGE: StorageKeyDefinition = {
  key: 'i18nextLng',
  ttl: TTL.PERMANENT,
  description: 'i18next detected / selected language.',
};

/** Search history (recent queries). */
const SEARCH_HISTORY: StorageKeyDefinition = {
  key: 'propchain:searchHistory',
  ttl: TTL.DAY,
  description: 'Recent search query history (JSON array).',
};

/** View toggle preference (grid / list / map). */
const VIEW_MODE: StorageKeyDefinition = {
  key: 'propchain:viewMode',
  ttl: TTL.PERMANENT,
  description: 'User view mode preference (grid | list | map).',
};

/** Transaction audit log entries. */
const TRANSACTION_AUDIT: StorageKeyDefinition = {
  key: 'propchain:transactionAudit',
  ttl: TTL.PERMANENT,
  description: 'Local transaction audit entries (JSON array).',
};

// ─── Lookup helpers ──────────────────────────────────────────────────────────

export const STORAGE_KEYS = {
  PORTFOLIO_ORDER,
  CURRENCY_PREFERENCE,
  WAGMI_CONNECTED,
  WALLET_CONNECTED,
  SEARCH_CACHE,
  SAVED_SEARCHES,
  ETH_TO_USD_RATE,
  ETH_TO_USD_LAST_UPDATED,
  THEME,
  NOTIFIED_TX,
  I18N_LANGUAGE,
  SEARCH_HISTORY,
  VIEW_MODE,
  TRANSACTION_AUDIT,
} as const;

/** Build a user-scoped saved-searches key. */
export const savedSearchesKey = (userId: string): string =>
  `${STORAGE_KEYS.SAVED_SEARCHES.key}:${userId}`;

/** Build a per-transaction-notification key. */
export const notifiedTxKey = (txHash: string): string =>
  `${STORAGE_KEYS.NOTIFIED_TX.key}:${txHash}`;

// ─── Migration helpers ───────────────────────────────────────────────────────

/**
 * Map of old ad‑hoc keys → canonical StorageKeyDefinition.
 * Consumers can call `migrateStorageKeys()` once at app startup to move any
 * lingering data written under the old keys to the new canonical locations.
 */
export const MIGRATION_MAP: Record<string, StorageKeyDefinition> = Object.values(
  STORAGE_KEYS
).reduce<Record<string, StorageKeyDefinition>>(
  (acc, def) => {
    if (def.migratedFrom) {
      for (const oldKey of def.migratedFrom) {
        acc[oldKey] = def;
      }
    }
    return acc;
  },
  {}
);

/**
 * One-shot migration: reads every old key listed in MIGRATION_MAP,
 * moves its value to the canonical key (if the canonical slot is empty),
 * then removes the old key.
 *
 * Safe to call on every page load — it is idempotent.
 */
export const migrateStorageKeys = (): void => {
  if (typeof window === 'undefined') return;
  for (const [oldKey, def] of Object.entries(MIGRATION_MAP)) {
    try {
      const raw = window.localStorage.getItem(oldKey);
      if (raw === null) continue; // nothing to migrate
      if (window.localStorage.getItem(def.key) !== null) {
        // Canonical key already populated — just clean up the old one.
        window.localStorage.removeItem(oldKey);
        continue;
      }
      window.localStorage.setItem(def.key, raw);
      window.localStorage.removeItem(oldKey);
    } catch {
      // Silently ignore — migration failures are non-fatal.
    }
  }
};
