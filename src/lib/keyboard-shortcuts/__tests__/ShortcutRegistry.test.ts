/**
 * Unit tests for ShortcutRegistry
 * 
 * Tests single-key and sequence shortcut registration, lookup, unregistration,
 * duplicate handling, and category filtering.
 */

import { ShortcutRegistry } from '../ShortcutRegistry';
import type { ShortcutConfig } from '@/types/keyboard-shortcuts';

describe('ShortcutRegistry', () => {
  let registry: ShortcutRegistry;

  beforeEach(() => {
    registry = new ShortcutRegistry();
  });

  describe('register', () => {
    it('should register a single-key shortcut', () => {
      const config: ShortcutConfig = {
        key: '/',
        description: 'Focus search',
        category: 'search',
        callback: jest.fn(),
      };

      registry.register('test-1', config);

      const found = registry.find('/');
      expect(found).toBeDefined();
      expect(found?.config.description).toBe('Focus search');
      expect(found?.config.category).toBe('search');
    });

    it('should register a sequence shortcut', () => {
      const config: ShortcutConfig = {
        key: ['g', 'p'],
        description: 'Go to Properties',
        category: 'navigation',
        callback: jest.fn(),
      };

      registry.register('test-2', config);

      const found = registry.findSequence(['g', 'p']);
      expect(found).toBeDefined();
      expect(found?.config.description).toBe('Go to Properties');
    });

    it('should normalize keys to lowercase', () => {
      const config: ShortcutConfig = {
        key: 'A',
        description: 'Test',
        category: 'general',
        callback: jest.fn(),
      };

      registry.register('test-3', config);

      const found = registry.find('a');
      expect(found).toBeDefined();
    });

    it('should set default values for optional config properties', () => {
      const config: ShortcutConfig = {
        key: '/',
        description: 'Test',
        category: 'general',
        callback: jest.fn(),
      };

      registry.register('test-4', config);

      const found = registry.find('/');
      expect(found?.config.enabled).toBe(true);
      expect(found?.config.preventDefault).toBe(true);
      expect(found?.config.stopPropagation).toBe(false);
    });

    it('should throw error for empty key', () => {
      const config: ShortcutConfig = {
        key: '',
        description: 'Test',
        category: 'general',
        callback: jest.fn(),
      };

      expect(() => registry.register('test-5', config)).toThrow(
        'Shortcut key must be a non-empty string'
      );
    });

    it('should throw error for empty sequence', () => {
      const config: ShortcutConfig = {
        key: [],
        description: 'Test',
        category: 'general',
        callback: jest.fn(),
      };

      expect(() => registry.register('test-6', config)).toThrow(
        'Shortcut sequence cannot be empty'
      );
    });

    it('should throw error for empty description', () => {
      const config: ShortcutConfig = {
        key: '/',
        description: '',
        category: 'general',
        callback: jest.fn(),
      };

      expect(() => registry.register('test-7', config)).toThrow(
        'Shortcut description is required'
      );
    });

    it('should throw error for invalid callback', () => {
      const config = {
        key: '/',
        description: 'Test',
        category: 'general',
        callback: 'not a function',
      } as unknown as ShortcutConfig;

      expect(() => registry.register('test-8', config)).toThrow(
        'Shortcut callback must be a function'
      );
    });

    it('should throw error for invalid category', () => {
      const config = {
        key: '/',
        description: 'Test',
        category: 'invalid',
        callback: jest.fn(),
      } as unknown as ShortcutConfig;

      expect(() => registry.register('test-9', config)).toThrow(
        'Invalid shortcut category'
      );
    });

    it('should warn on duplicate key registration', () => {
      const config1: ShortcutConfig = {
        key: '/',
        description: 'First',
        category: 'general',
        callback: jest.fn(),
      };

      const config2: ShortcutConfig = {
        key: '/',
        description: 'Second',
        category: 'general',
        callback: jest.fn(),
      };

      const warnSpy = jest.spyOn(console, 'warn').mockImplementation();

      registry.register('test-10', config1);
      registry.register('test-11', config2);

      expect(warnSpy).toHaveBeenCalled();
      warnSpy.mockRestore();
    });

    it('should update config when same ID is registered again', () => {
      const config1: ShortcutConfig = {
        key: '/',
        description: 'First',
        category: 'general',
        callback: jest.fn(),
      };

      const config2: ShortcutConfig = {
        key: '/',
        description: 'Updated',
        category: 'general',
        callback: jest.fn(),
      };

      registry.register('test-12', config1);
      registry.register('test-12', config2);

      const found = registry.find('/');
      expect(found?.config.description).toBe('Updated');
    });
  });

  describe('unregister', () => {
    it('should unregister a shortcut by ID', () => {
      const config: ShortcutConfig = {
        key: '/',
        description: 'Test',
        category: 'general',
        callback: jest.fn(),
      };

      registry.register('test-13', config);
      expect(registry.find('/')).toBeDefined();

      registry.unregister('test-13');
      expect(registry.find('/')).toBeNull();
    });

    it('should warn when unregistering non-existent shortcut', () => {
      const warnSpy = jest.spyOn(console, 'warn').mockImplementation();

      registry.unregister('non-existent');

      expect(warnSpy).toHaveBeenCalled();
      warnSpy.mockRestore();
    });

    it('should remove key from registry when last entry is unregistered', () => {
      const config: ShortcutConfig = {
        key: '/',
        description: 'Test',
        category: 'general',
        callback: jest.fn(),
      };

      registry.register('test-14', config);
      registry.unregister('test-14');

      expect(registry.size).toBe(0);
    });
  });

  describe('find', () => {
    it('should find a registered shortcut by key', () => {
      const config: ShortcutConfig = {
        key: '?',
        description: 'Help',
        category: 'general',
        callback: jest.fn(),
      };

      registry.register('test-15', config);

      const found = registry.find('?');
      expect(found).toBeDefined();
      expect(found?.config.description).toBe('Help');
    });

    it('should return null for non-existent key', () => {
      const found = registry.find('x');
      expect(found).toBeNull();
    });

    it('should return first enabled entry when multiple exist', () => {
      const config1: ShortcutConfig = {
        key: '/',
        description: 'First',
        category: 'general',
        callback: jest.fn(),
        enabled: false,
      };

      const config2: ShortcutConfig = {
        key: '/',
        description: 'Second',
        category: 'general',
        callback: jest.fn(),
        enabled: true,
      };

      registry.register('test-16', config1);
      registry.register('test-17', config2);

      const found = registry.find('/');
      expect(found?.config.description).toBe('Second');
    });

    it('should normalize key before lookup', () => {
      const config: ShortcutConfig = {
        key: 'A',
        description: 'Test',
        category: 'general',
        callback: jest.fn(),
      };

      registry.register('test-18', config);

      const found = registry.find('a');
      expect(found).toBeDefined();
    });
  });

  describe('findSequence', () => {
    it('should find a sequence shortcut', () => {
      const config: ShortcutConfig = {
        key: ['g', 'd'],
        description: 'Go to Dashboard',
        category: 'navigation',
        callback: jest.fn(),
      };

      registry.register('test-19', config);

      const found = registry.findSequence(['g', 'd']);
      expect(found).toBeDefined();
      expect(found?.config.description).toBe('Go to Dashboard');
    });

    it('should return null for non-existent sequence', () => {
      const found = registry.findSequence(['x', 'y']);
      expect(found).toBeNull();
    });

    it('should normalize sequence keys', () => {
      const config: ShortcutConfig = {
        key: ['G', 'P'],
        description: 'Go to Properties',
        category: 'navigation',
        callback: jest.fn(),
      };

      registry.register('test-20', config);

      const found = registry.findSequence(['g', 'p']);
      expect(found).toBeDefined();
    });
  });

  describe('getByCategory', () => {
    it('should return shortcuts in a specific category', () => {
      const config1: ShortcutConfig = {
        key: ['g', 'p'],
        description: 'Go to Properties',
        category: 'navigation',
        callback: jest.fn(),
      };

      const config2: ShortcutConfig = {
        key: ['g', 'd'],
        description: 'Go to Dashboard',
        category: 'navigation',
        callback: jest.fn(),
      };

      const config3: ShortcutConfig = {
        key: '/',
        description: 'Search',
        category: 'search',
        callback: jest.fn(),
      };

      registry.register('test-21', config1);
      registry.register('test-22', config2);
      registry.register('test-23', config3);

      const navShortcuts = registry.getByCategory('navigation');
      expect(navShortcuts).toHaveLength(2);
      expect(navShortcuts.every(s => s.config.category === 'navigation')).toBe(true);
    });

    it('should return empty array for category with no shortcuts', () => {
      const shortcuts = registry.getByCategory('ui');
      expect(shortcuts).toEqual([]);
    });
  });

  describe('getAllByCategory', () => {
    it('should return shortcuts grouped by category', () => {
      const config1: ShortcutConfig = {
        key: ['g', 'p'],
        description: 'Go to Properties',
        category: 'navigation',
        callback: jest.fn(),
      };

      const config2: ShortcutConfig = {
        key: '/',
        description: 'Search',
        category: 'search',
        callback: jest.fn(),
      };

      registry.register('test-24', config1);
      registry.register('test-25', config2);

      const grouped = registry.getAllByCategory();
      expect(grouped.has('navigation')).toBe(true);
      expect(grouped.has('search')).toBe(true);
      expect(grouped.get('navigation')).toHaveLength(1);
      expect(grouped.get('search')).toHaveLength(1);
    });

    it('should not include empty categories', () => {
      const config: ShortcutConfig = {
        key: '/',
        description: 'Search',
        category: 'search',
        callback: jest.fn(),
      };

      registry.register('test-26', config);

      const grouped = registry.getAllByCategory();
      expect(grouped.has('navigation')).toBe(false);
      expect(grouped.has('ui')).toBe(false);
      expect(grouped.has('general')).toBe(false);
    });
  });

  describe('getAll', () => {
    it('should return all registered shortcuts', () => {
      const config1: ShortcutConfig = {
        key: '/',
        description: 'Search',
        category: 'search',
        callback: jest.fn(),
      };

      const config2: ShortcutConfig = {
        key: '?',
        description: 'Help',
        category: 'general',
        callback: jest.fn(),
      };

      registry.register('test-27', config1);
      registry.register('test-28', config2);

      const all = registry.getAll();
      expect(all).toHaveLength(2);
    });

    it('should return empty array when no shortcuts registered', () => {
      const all = registry.getAll();
      expect(all).toEqual([]);
    });
  });

  describe('clear', () => {
    it('should remove all shortcuts', () => {
      const config1: ShortcutConfig = {
        key: '/',
        description: 'Search',
        category: 'search',
        callback: jest.fn(),
      };

      const config2: ShortcutConfig = {
        key: '?',
        description: 'Help',
        category: 'general',
        callback: jest.fn(),
      };

      registry.register('test-29', config1);
      registry.register('test-30', config2);

      expect(registry.size).toBe(2);

      registry.clear();

      expect(registry.size).toBe(0);
      expect(registry.find('/')).toBeNull();
      expect(registry.find('?')).toBeNull();
    });
  });

  describe('size', () => {
    it('should return the number of registered shortcuts', () => {
      expect(registry.size).toBe(0);

      registry.register('test-31', {
        key: '/',
        description: 'Search',
        category: 'search',
        callback: jest.fn(),
      });

      expect(registry.size).toBe(1);

      registry.register('test-32', {
        key: '?',
        description: 'Help',
        category: 'general',
        callback: jest.fn(),
      });

      expect(registry.size).toBe(2);
    });

    it('should count multiple entries for same key', () => {
      registry.register('test-33', {
        key: '/',
        description: 'First',
        category: 'search',
        callback: jest.fn(),
      });

      registry.register('test-34', {
        key: '/',
        description: 'Second',
        category: 'search',
        callback: jest.fn(),
      });

      expect(registry.size).toBe(2);
    });
  });
});
