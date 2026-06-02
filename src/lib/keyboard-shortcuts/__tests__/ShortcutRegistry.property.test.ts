/**
 * Property-Based Tests for ShortcutRegistry
 * 
 * **Property 3: Registration Round-Trip**
 * **Validates: Requirements 7.3, 13.6**
 * 
 * For any valid shortcut configuration, registering then finding should return the config.
 */

import fc from 'fast-check';
import { ShortcutRegistry } from '../ShortcutRegistry';
import type { ShortcutConfig, ShortcutCategory } from '@/types/keyboard-shortcuts';

describe('ShortcutRegistry Property Tests', () => {
  describe('Property 3: Registration Round-Trip', () => {
    it('should preserve config through register-find cycle for single-key shortcuts', () => {
      fc.assert(
        fc.property(
          // Generate valid shortcut configurations
          fc.record({
            key: fc.string({ minLength: 1, maxLength: 10 }).filter(s => {
              const trimmed = s.trim();
              return trimmed.length > 0 && trimmed === s; // No leading/trailing whitespace
            }),
            description: fc.string({ minLength: 1, maxLength: 100 }).filter(s => s.trim().length > 0),
            category: fc.constantFrom<ShortcutCategory>(
              'navigation',
              'ui',
              'search',
              'general'
            ),
            enabled: fc.boolean(),
            preventDefault: fc.boolean(),
            stopPropagation: fc.boolean(),
          }),
          (config) => {
            const registry = new ShortcutRegistry();
            const id = 'test-id';
            
            // Create full config with callback
            const fullConfig: ShortcutConfig = {
              ...config,
              callback: jest.fn(),
            };
            
            // Register the shortcut
            registry.register(id, fullConfig);
            
            // Find the shortcut
            const found = registry.find(config.key);
            
            // Verify the shortcut was found (or not found if disabled)
            if (config.enabled === false) {
              // Disabled shortcuts should not be returned by find()
              expect(found).toBeNull();
            } else {
              expect(found).toBeDefined();
              expect(found).not.toBeNull();
              
              if (found) {
                // Verify key is preserved as-is (not normalized in config)
                expect(found.config.key).toBe(config.key);
                
                // Verify description is preserved
                expect(found.config.description).toBe(config.description);
                
                // Verify category is preserved
                expect(found.config.category).toBe(config.category);
                
                // Verify enabled flag (should be true since we found it)
                expect(found.config.enabled).toBe(true);
                
                // Verify preventDefault flag is preserved
                expect(found.config.preventDefault).toBe(config.preventDefault);
                
                // Verify stopPropagation flag is preserved
                expect(found.config.stopPropagation).toBe(config.stopPropagation);
                
                // Verify callback exists
                expect(typeof found.config.callback).toBe('function');
                
                // Verify entry has ID
                expect(found.id).toBe(id);
                
                // Verify entry has timestamp
                expect(found.registeredAt).toBeGreaterThan(0);
              }
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should preserve config through register-findSequence cycle for sequence shortcuts', () => {
      fc.assert(
        fc.property(
          // Generate valid sequence shortcut configurations
          fc.record({
            key: fc.array(
              fc.string({ minLength: 1, maxLength: 5 }).filter(s => {
                const trimmed = s.trim();
                return trimmed.length > 0 && trimmed === s; // No leading/trailing whitespace
              }),
              { minLength: 2, maxLength: 3 }
            ),
            description: fc.string({ minLength: 1, maxLength: 100 }).filter(s => s.trim().length > 0),
            category: fc.constantFrom<ShortcutCategory>(
              'navigation',
              'ui',
              'search',
              'general'
            ),
            enabled: fc.boolean(),
            preventDefault: fc.boolean(),
            stopPropagation: fc.boolean(),
          }),
          (config) => {
            const registry = new ShortcutRegistry();
            const id = 'test-sequence-id';
            
            // Create full config with callback
            const fullConfig: ShortcutConfig = {
              ...config,
              callback: jest.fn(),
            };
            
            // Register the shortcut
            registry.register(id, fullConfig);
            
            // Find the shortcut using sequence
            const found = registry.findSequence(config.key);
            
            // Verify the shortcut was found (or not found if disabled)
            if (config.enabled === false) {
              // Disabled shortcuts should not be returned by findSequence()
              expect(found).toBeNull();
            } else {
              expect(found).toBeDefined();
              expect(found).not.toBeNull();
              
              if (found) {
                // Verify key sequence is preserved as-is (not normalized in config)
                expect(found.config.key).toEqual(config.key);
                
                // Verify description is preserved
                expect(found.config.description).toBe(config.description);
                
                // Verify category is preserved
                expect(found.config.category).toBe(config.category);
                
                // Verify enabled flag (should be true since we found it)
                expect(found.config.enabled).toBe(true);
                
                // Verify preventDefault flag is preserved
                expect(found.config.preventDefault).toBe(config.preventDefault);
                
                // Verify stopPropagation flag is preserved
                expect(found.config.stopPropagation).toBe(config.stopPropagation);
                
                // Verify callback exists
                expect(typeof found.config.callback).toBe('function');
                
                // Verify entry has ID
                expect(found.id).toBe(id);
                
                // Verify entry has timestamp
                expect(found.registeredAt).toBeGreaterThan(0);
              }
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle register-unregister-find cycle correctly', () => {
      fc.assert(
        fc.property(
          fc.record({
            key: fc.string({ minLength: 1, maxLength: 10 }).filter(s => {
              const trimmed = s.trim();
              return trimmed.length > 0 && trimmed === s; // No leading/trailing whitespace
            }),
            description: fc.string({ minLength: 1, maxLength: 100 }).filter(s => s.trim().length > 0),
            category: fc.constantFrom<ShortcutCategory>(
              'navigation',
              'ui',
              'search',
              'general'
            ),
          }),
          (config) => {
            const registry = new ShortcutRegistry();
            const id = 'test-unregister-id';
            
            // Create full config with callback
            const fullConfig: ShortcutConfig = {
              ...config,
              callback: jest.fn(),
            };
            
            // Register the shortcut
            registry.register(id, fullConfig);
            
            // Verify it can be found
            const foundBefore = registry.find(config.key);
            expect(foundBefore).not.toBeNull();
            
            // Unregister the shortcut
            registry.unregister(id);
            
            // Verify it cannot be found after unregistration
            const foundAfter = registry.find(config.key);
            expect(foundAfter).toBeNull();
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should maintain registry size correctly through register-unregister cycles', () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.record({
              key: fc.string({ minLength: 1, maxLength: 10 }).filter(s => {
                const trimmed = s.trim();
                return trimmed.length > 0 && trimmed === s; // No leading/trailing whitespace
              }),
              description: fc.string({ minLength: 1, maxLength: 100 }).filter(s => s.trim().length > 0),
              category: fc.constantFrom<ShortcutCategory>(
                'navigation',
                'ui',
                'search',
                'general'
              ),
            }),
            { minLength: 1, maxLength: 10 }
          ),
          (configs) => {
            const registry = new ShortcutRegistry();
            const ids: string[] = [];
            
            // Register all shortcuts
            configs.forEach((config, index) => {
              const id = `test-${index}`;
              ids.push(id);
              
              const fullConfig: ShortcutConfig = {
                ...config,
                callback: jest.fn(),
              };
              
              registry.register(id, fullConfig);
            });
            
            // Verify size matches number of registered shortcuts
            expect(registry.size).toBe(configs.length);
            
            // Unregister all shortcuts
            ids.forEach(id => {
              registry.unregister(id);
            });
            
            // Verify size is 0 after unregistering all
            expect(registry.size).toBe(0);
          }
        ),
        { numRuns: 50 }
      );
    });

    it('should correctly filter shortcuts by category', () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.record({
              key: fc.string({ minLength: 1, maxLength: 10 }).filter(s => {
                const trimmed = s.trim();
                return trimmed.length > 0 && trimmed === s; // No leading/trailing whitespace
              }),
              description: fc.string({ minLength: 1, maxLength: 100 }).filter(s => s.trim().length > 0),
              category: fc.constantFrom<ShortcutCategory>(
                'navigation',
                'ui',
                'search',
                'general'
              ),
            }),
            { minLength: 1, maxLength: 20 }
          ),
          (configs) => {
            const registry = new ShortcutRegistry();
            
            // Register all shortcuts
            configs.forEach((config, index) => {
              const fullConfig: ShortcutConfig = {
                ...config,
                callback: jest.fn(),
              };
              
              registry.register(`test-${index}`, fullConfig);
            });
            
            // Count expected shortcuts per category
            const expectedCounts = new Map<ShortcutCategory, number>();
            configs.forEach(config => {
              const count = expectedCounts.get(config.category) || 0;
              expectedCounts.set(config.category, count + 1);
            });
            
            // Verify getByCategory returns correct counts
            const categories: ShortcutCategory[] = ['navigation', 'ui', 'search', 'general'];
            categories.forEach(category => {
              const shortcuts = registry.getByCategory(category);
              const expectedCount = expectedCounts.get(category) || 0;
              expect(shortcuts.length).toBe(expectedCount);
              
              // Verify all returned shortcuts have the correct category
              shortcuts.forEach(entry => {
                expect(entry.config.category).toBe(category);
              });
            });
          }
        ),
        { numRuns: 50 }
      );
    });
  });
});
