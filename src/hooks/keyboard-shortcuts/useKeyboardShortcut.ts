'use client';

/**
 * useKeyboardShortcut Hook
 * 
 * React hook for registering keyboard shortcuts from any component.
 * Automatically handles registration on mount and cleanup on unmount.
 */

import { useEffect, useRef } from 'react';
import { useKeyboardShortcutsContext } from '@/components/keyboard-shortcuts/KeyboardShortcutsProvider';
import type { ShortcutConfig } from '@/types/keyboard-shortcuts';

/**
 * Generate a unique ID for shortcut registration
 */
let shortcutIdCounter = 0;
function generateShortcutId(): string {
  return `shortcut-${Date.now()}-${++shortcutIdCounter}`;
}

/**
 * Hook for registering a keyboard shortcut
 * 
 * @param config - Shortcut configuration
 * 
 * @example
 * ```tsx
 * // Single key shortcut
 * useKeyboardShortcut({
 *   key: '/',
 *   description: 'Focus search bar',
 *   category: 'search',
 *   callback: () => searchInputRef.current?.focus(),
 * });
 * 
 * // Sequence shortcut
 * useKeyboardShortcut({
 *   key: ['g', 'p'],
 *   description: 'Go to Properties',
 *   category: 'navigation',
 *   callback: () => router.push('/properties'),
 * });
 * ```
 */
export function useKeyboardShortcut(config: ShortcutConfig): void {
  const { registerShortcut, unregisterShortcut } = useKeyboardShortcutsContext();
  
  // Generate stable ID for this shortcut
  const idRef = useRef<string>();
  if (!idRef.current) {
    idRef.current = generateShortcutId();
  }
  
  // Register shortcut on mount and when config changes
  useEffect(() => {
    const id = idRef.current!;
    
    // Register the shortcut
    registerShortcut(id, config);
    
    // Cleanup: unregister on unmount
    return () => {
      unregisterShortcut(id);
    };
  }, [
    registerShortcut,
    unregisterShortcut,
    // Dependencies: all config properties
    config.key,
    config.description,
    config.category,
    config.callback,
    config.enabled,
    config.preventDefault,
    config.stopPropagation,
  ]);
}
