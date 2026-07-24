/**
 * HMR-Resilient Singleton Utilities
 *
 * These utilities ensure that module-level singleton services survive
 * Hot Module Replacement (HMR) in development mode.
 *
 * The problem: When a module is hot-reloaded, any new singleton instance
 * is created, but the old instance is lost. This can cause issues with
 * services that maintain state (e.g., loggers, caches, connections).
 *
 * The solution: Pin singleton instances to globalThis during development,
 * so they persist across HMR cycles.
 */

/**
 * Get or create a singleton instance that persists across HMR.
 *
 * @param key - Unique key to identify this singleton in globalThis
 * @param factory - Factory function to create the singleton if it doesn't exist
 * @returns The singleton instance
 *
 * @example
 * ```typescript
 * const logger = getHMRResilientSingleton('logger', () => new Logger());
 * ```
 */
export function getHMRResilientSingleton<T>(
  key: string,
  factory: () => T
): T {
  const isDev = process.env.NODE_ENV === 'development';

  // In development, pin to globalThis to survive HMR
  if (isDev) {
    const globalKey = `__propchain_singleton_${key}__`;

    if (!(globalKey in globalThis)) {
      (globalThis as Record<string, unknown>)[globalKey] = factory();
    }

    return (globalThis as Record<string, unknown>)[globalKey] as T;
  }

  // In production, use module-level variable
  return factory();
}

/**
 * Create a lazy singleton that only initializes on first access.
 *
 * @param factory - Factory function to create the singleton
 * @returns A getter function that returns the singleton
 *
 * @example
 * ```typescript
 * const getLogger = createLazySingleton(() => new Logger());
 * // Later...
 * const logger = getLogger();
 * ```
 */
export function createLazySingleton<T>(factory: () => T): () => T {
  let instance: T | undefined;

  return () => {
    if (instance === undefined) {
      instance = factory();
    }
    return instance;
  };
}

/**
 * Reset a singleton (useful for testing or HMR cleanup).
 *
 * @param key - The key used when creating the singleton
 */
export function resetSingleton(key: string): void {
  const globalKey = `__propchain_singleton_${key}__`;
  if (globalKey in globalThis) {
    delete (globalThis as Record<string, unknown>)[globalKey];
  }
}
