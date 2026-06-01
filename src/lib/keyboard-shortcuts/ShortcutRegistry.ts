/**
 * Shortcut Registry
 * 
 * Centralized registry for managing keyboard shortcut registrations.
 * Provides O(1) lookup performance using Map-based storage.
 */

import type { ShortcutConfig, ShortcutEntry, ShortcutCategory } from '@/types/keyboard-shortcuts';
import { normalizeKey } from './keyNormalizer';
import { logger } from '@/utils/logger';

/**
 * Registry for managing keyboard shortcut registrations
 */
export class ShortcutRegistry {
  /**
   * Map of normalized key strings to shortcut entries
   * Multiple entries per key are allowed for sequence shortcuts
   */
  private shortcuts: Map<string, ShortcutEntry[]> = new Map();

  /**
   * Registers a new keyboard shortcut
   * 
   * @param id - Unique identifier for this registration
   * @param config - Shortcut configuration
   * 
   * @example
   * registry.register('search-focus', {
   *   key: '/',
   *   description: 'Focus search bar',
   *   category: 'search',
   *   callback: () => searchInput.focus()
   * });
   */
  register(id: string, config: ShortcutConfig): void {
    // Validate configuration
    this.validateConfig(config);
    
    // Normalize the key
    const normalizedKey = normalizeKey(config.key);
    
    // Check for duplicate registrations
    const existing = this.shortcuts.get(normalizedKey);
    if (existing && existing.length > 0) {
      // Check if this ID is already registered
      const duplicate = existing.find(entry => entry.id === id);
      if (duplicate) {
        logger.warn(
          `Shortcut with ID "${id}" is already registered for key "${normalizedKey}". ` +
          `Updating configuration.`
        );
        // Remove the old entry
        this.unregister(id);
      } else {
        logger.warn(
          `Multiple shortcuts registered for key "${normalizedKey}". ` +
          `Previous: ${existing[0].config.description}, ` +
          `New: ${config.description}`
        );
      }
    }
    
    // Create entry
    const entry: ShortcutEntry = {
      id,
      config: {
        ...config,
        enabled: config.enabled ?? true,
        preventDefault: config.preventDefault ?? true,
        stopPropagation: config.stopPropagation ?? false,
      },
      registeredAt: Date.now(),
    };
    
    // Add to registry
    const entries = existing || [];
    entries.push(entry);
    this.shortcuts.set(normalizedKey, entries);
    
    logger.debug(`Registered shortcut: ${normalizedKey} (${config.description})`);
  }

  /**
   * Unregisters a keyboard shortcut by ID
   * 
   * @param id - Unique identifier of the shortcut to unregister
   * 
   * @example
   * registry.unregister('search-focus');
   */
  unregister(id: string): void {
    // Find and remove the entry with this ID
    for (const [key, entries] of this.shortcuts.entries()) {
      const index = entries.findIndex(entry => entry.id === id);
      if (index !== -1) {
        const removed = entries.splice(index, 1)[0];
        
        // Remove the key entirely if no entries remain
        if (entries.length === 0) {
          this.shortcuts.delete(key);
        }
        
        logger.debug(`Unregistered shortcut: ${key} (${removed.config.description})`);
        return;
      }
    }
    
    logger.warn(`Attempted to unregister non-existent shortcut with ID: ${id}`);
  }

  /**
   * Finds a shortcut entry by key
   * Returns the first enabled entry if multiple exist
   * 
   * @param key - The key to search for (will be normalized)
   * @returns The shortcut entry, or null if not found
   * 
   * @example
   * const entry = registry.find('/');
   */
  find(key: string): ShortcutEntry | null {
    const normalizedKey = normalizeKey(key);
    const entries = this.shortcuts.get(normalizedKey);
    
    if (!entries || entries.length === 0) {
      return null;
    }
    
    // Return the first enabled entry
    const enabled = entries.find(entry => entry.config.enabled !== false);
    return enabled || null;
  }

  /**
   * Finds a shortcut entry by key sequence
   * 
   * @param keys - Array of keys in the sequence
   * @returns The shortcut entry, or null if not found
   * 
   * @example
   * const entry = registry.findSequence(['g', 'p']);
   */
  findSequence(keys: string[]): ShortcutEntry | null {
    const normalizedKey = normalizeKey(keys);
    return this.find(normalizedKey);
  }

  /**
   * Gets all shortcuts in a specific category
   * 
   * @param category - The category to filter by
   * @returns Array of shortcut entries in the category
   * 
   * @example
   * const navShortcuts = registry.getByCategory('navigation');
   */
  getByCategory(category: ShortcutCategory): ShortcutEntry[] {
    const result: ShortcutEntry[] = [];
    
    for (const entries of this.shortcuts.values()) {
      for (const entry of entries) {
        if (entry.config.category === category) {
          result.push(entry);
        }
      }
    }
    
    return result;
  }

  /**
   * Gets all registered shortcuts grouped by category
   * 
   * @returns Map of categories to shortcut entries
   */
  getAllByCategory(): Map<ShortcutCategory, ShortcutEntry[]> {
    const result = new Map<ShortcutCategory, ShortcutEntry[]>();
    const categories: ShortcutCategory[] = ['navigation', 'ui', 'search', 'general'];
    
    for (const category of categories) {
      const entries = this.getByCategory(category);
      if (entries.length > 0) {
        result.set(category, entries);
      }
    }
    
    return result;
  }

  /**
   * Gets all registered shortcuts
   * 
   * @returns Array of all shortcut entries
   */
  getAll(): ShortcutEntry[] {
    const result: ShortcutEntry[] = [];
    
    for (const entries of this.shortcuts.values()) {
      result.push(...entries);
    }
    
    return result;
  }

  /**
   * Clears all registered shortcuts
   */
  clear(): void {
    this.shortcuts.clear();
    logger.debug('Cleared all shortcuts from registry');
  }

  /**
   * Gets the number of registered shortcuts
   */
  get size(): number {
    let count = 0;
    for (const entries of this.shortcuts.values()) {
      count += entries.length;
    }
    return count;
  }

  /**
   * Validates a shortcut configuration
   * 
   * @param config - The configuration to validate
   * @throws Error if configuration is invalid
   */
  private validateConfig(config: ShortcutConfig): void {
    // Validate key
    if (Array.isArray(config.key)) {
      if (config.key.length === 0) {
        throw new Error('Shortcut sequence cannot be empty');
      }
      if (config.key.some(k => typeof k !== 'string' || k.length === 0)) {
        throw new Error('All keys in sequence must be non-empty strings');
      }
    } else if (typeof config.key !== 'string' || config.key.length === 0) {
      throw new Error('Shortcut key must be a non-empty string');
    }
    
    // Validate description
    if (!config.description || config.description.trim().length === 0) {
      throw new Error('Shortcut description is required');
    }
    
    // Validate callback
    if (typeof config.callback !== 'function') {
      throw new Error('Shortcut callback must be a function');
    }
    
    // Validate category
    const validCategories: ShortcutCategory[] = ['navigation', 'ui', 'search', 'general'];
    if (!validCategories.includes(config.category)) {
      throw new Error(
        `Invalid shortcut category: ${config.category}. ` +
        `Must be one of: ${validCategories.join(', ')}`
      );
    }
  }
}
