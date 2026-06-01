'use client';

/**
 * Keyboard Shortcuts Provider
 * 
 * Global context provider that manages keyboard shortcuts system.
 * Provides centralized registration, event handling, and state management.
 */

import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import type {
  KeyboardShortcutsContextValue,
  KeyboardShortcutsProviderProps,
  ShortcutConfig,
  SequenceState,
  ShortcutCategory,
} from '@/types/keyboard-shortcuts';
import { ShortcutRegistry } from '@/lib/keyboard-shortcuts/ShortcutRegistry';
import { SequenceStateManager } from '@/lib/keyboard-shortcuts/SequenceStateManager';
import { isTextInputContext } from '@/lib/keyboard-shortcuts/contextDetector';
import { normalizeKey } from '@/lib/keyboard-shortcuts/keyNormalizer';
import { logger } from '@/utils/logger';
import { ShortcutHelpDialog } from './ShortcutHelpDialog';
import { SequenceIndicator } from './SequenceIndicator';

/**
 * Context for keyboard shortcuts system
 */
const KeyboardShortcutsContext = createContext<KeyboardShortcutsContextValue | null>(null);

/**
 * Hook to access keyboard shortcuts context
 * 
 * @throws Error if used outside KeyboardShortcutsProvider
 */
export function useKeyboardShortcutsContext(): KeyboardShortcutsContextValue {
  const context = useContext(KeyboardShortcutsContext);
  
  if (!context) {
    throw new Error(
      'useKeyboardShortcutsContext must be used within KeyboardShortcutsProvider'
    );
  }
  
  return context;
}

/**
 * Keyboard Shortcuts Provider Component
 * 
 * Manages global keyboard shortcuts system with:
 * - Single global event listener for performance
 * - Context-aware shortcut triggering
 * - Sequence shortcut support with timeout
 * - Visual feedback for sequence progress
 */
export function KeyboardShortcutsProvider({
  children,
  sequenceTimeout = 1000,
  disabled = false,
}: KeyboardShortcutsProviderProps) {
  const router = useRouter();
  
  // Registry and state manager instances (stable across renders)
  const registryRef = useRef(new ShortcutRegistry());
  const sequenceManagerRef = useRef(new SequenceStateManager(sequenceTimeout));
  
  // State for sequence visual feedback
  const [sequenceState, setSequenceState] = useState<SequenceState | null>(null);
  
  // State for help dialog
  const [helpDialogOpen, setHelpDialogOpen] = useState(false);
  
  // Event processing state (prevent re-entrant calls)
  const isProcessingRef = useRef(false);
  const lastEventTimestampRef = useRef(0);
  
  // Debounce threshold (50ms)
  const DEBOUNCE_THRESHOLD = 50;
  
  /**
   * Get all open dialogs/modals in the document
   */
  const getOpenDialog = useCallback(() => {
    // Check for Radix UI dialogs with [data-state="open"]
    const openDialogs = document.querySelectorAll('[data-slot="dialog"][data-state="open"]');
    return openDialogs.length > 0 ? openDialogs[0] : null;
  }, []);
  
  /**
   * Close any open modal/dialog
   */
  const closeOpenDialog = useCallback(() => {
    const openDialog = getOpenDialog();
    if (openDialog) {
      const closeButton = openDialog.querySelector('[data-slot="dialog-close"]') as HTMLButtonElement;
      if (closeButton) {
        closeButton.click();
        return true;
      }
    }
    return false;
  }, [getOpenDialog]);
  
  /**
   * Focus the search input
   */
  const focusSearchInput = useCallback(() => {
    const searchInput = document.querySelector('input[placeholder*="Search"]') as HTMLInputElement;
    if (searchInput) {
      searchInput.focus();
    }
  }, []);
  
  /**
   * Register a keyboard shortcut
   */
  const registerShortcut = useCallback((id: string, config: ShortcutConfig) => {
    registryRef.current.register(id, config);
  }, []);
  
  /**
   * Unregister a keyboard shortcut
   */
  const unregisterShortcut = useCallback((id: string) => {
    registryRef.current.unregister(id);
  }, []);
  
  /**
   * Open the help dialog
   */
  const openHelpDialog = useCallback(() => {
    setHelpDialogOpen(true);
  }, []);
  
  /**
   * Execute a shortcut callback with error handling
   */
  const executeShortcut = useCallback(async (
    entry: ReturnType<typeof registryRef.current.find>,
    event: KeyboardEvent
  ) => {
    if (!entry) return;
    
    try {
      // Prevent default and stop propagation based on config
      if (entry.config.preventDefault) {
        event.preventDefault();
      }
      if (entry.config.stopPropagation) {
        event.stopPropagation();
      }
      
      // Execute callback
      await entry.config.callback();
      
      logger.debug(`Executed shortcut: ${entry.config.description}`);
    } catch (error) {
      logger.error('Keyboard shortcut callback error', {
        shortcut: entry.config.description,
        key: entry.config.key,
        error,
      });
    }
  }, []);
  
  /**
   * Update sequence state for visual feedback
   */
  const updateSequenceState = useCallback(() => {
    const state = sequenceManagerRef.current.getState();
    setSequenceState(state);
  }, []);
  
  /**
   * Register default global shortcuts
   */
  useEffect(() => {
    // Escape - Close modal/dialog
    registerShortcut('close-modal', {
      key: 'escape',
      description: 'Close modal/dialog',
      category: 'ui',
      callback: closeOpenDialog,
      preventDefault: true,
    });
    
    // ? - Show keyboard shortcuts help
    registerShortcut('open-help', {
      key: '?',
      description: 'Show keyboard shortcuts help',
      category: 'general',
      callback: openHelpDialog,
      preventDefault: true,
    });
    
    // / - Focus search bar
    registerShortcut('focus-search', {
      key: '/',
      description: 'Focus search bar',
      category: 'search',
      callback: focusSearchInput,
      preventDefault: true,
    });
    
    // G+P - Go to Properties
    registerShortcut('goto-properties', {
      key: ['g', 'p'],
      description: 'Go to Properties',
      category: 'navigation',
      callback: () => router.push('/properties'),
      preventDefault: true,
    });
    
    // G+D - Go to Dashboard
    registerShortcut('goto-dashboard', {
      key: ['g', 'd'],
      description: 'Go to Dashboard',
      category: 'navigation',
      callback: () => router.push('/dashboard'),
      preventDefault: true,
    });
  }, [router, registerShortcut, closeOpenDialog, openHelpDialog, focusSearchInput]);
  
  /**
   * Global keyboard event handler
   */
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    // Skip if disabled
    if (disabled) return;
    
    // Debounce rapid events
    const now = Date.now();
    if (now - lastEventTimestampRef.current < DEBOUNCE_THRESHOLD) {
      return;
    }
    lastEventTimestampRef.current = now;
    
    // Prevent re-entrant calls
    if (isProcessingRef.current) {
      return;
    }
    isProcessingRef.current = true;
    
    try {
      // Check if we're in a text input context
      if (isTextInputContext(document.activeElement)) {
        logger.debug('Ignoring keyboard event in text input context');
        return;
      }
      
      // Normalize the key
      const key = normalizeKey(event.key);
      
      logger.debug(`Key pressed: ${key}`);
      
      // Check if we're in an active sequence
      if (sequenceManagerRef.current.isActive()) {
        const complete = sequenceManagerRef.current.addKey(key);
        
        if (complete) {
          // Sequence completed - find and execute the shortcut
          const currentKeys = sequenceManagerRef.current.getCurrentKeys();
          const entry = registryRef.current.findSequence(currentKeys);
          
          if (entry) {
            executeShortcut(entry, event);
          }
          
          // Reset sequence
          sequenceManagerRef.current.reset();
          updateSequenceState();
        } else {
          // Sequence incomplete or reset - update visual feedback
          updateSequenceState();
        }
        
        return;
      }
      
      // Check for single-key shortcut
      const singleKeyEntry = registryRef.current.find(key);
      
      if (singleKeyEntry) {
        executeShortcut(singleKeyEntry, event);
        return;
      }
      
      // Check if this key starts a sequence
      // Get all shortcuts and check if any sequence starts with this key
      const allShortcuts = registryRef.current.getAll();
      const sequenceStarters = allShortcuts.filter(entry => {
        if (Array.isArray(entry.config.key)) {
          const normalized = normalizeKey(entry.config.key);
          const keys = normalized.split('+');
          return keys[0] === key && keys.length > 1;
        }
        return false;
      });
      
      if (sequenceStarters.length > 0) {
        // Start a sequence
        const expectedKeys = sequenceStarters.map(entry => {
          const normalized = normalizeKey(entry.config.key);
          const keys = normalized.split('+');
          return keys[1]; // Get the second key in the sequence
        });
        
        // Remove duplicates
        const uniqueExpectedKeys = Array.from(new Set(expectedKeys));
        
        sequenceManagerRef.current.startSequence(key, uniqueExpectedKeys);
        updateSequenceState();
        
        // Prevent default for sequence starter keys
        event.preventDefault();
      }
    } finally {
      isProcessingRef.current = false;
    }
  }, [disabled, executeShortcut, updateSequenceState]);
  
  /**
   * Set up global keyboard event listener
   */
  useEffect(() => {
    // Add event listener
    document.addEventListener('keydown', handleKeyDown);
    
    logger.debug('Keyboard shortcuts system initialized');
    
    // Cleanup
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      sequenceManagerRef.current.reset();
      logger.debug('Keyboard shortcuts system cleaned up');
    };
  }, [handleKeyDown]);
  
  /**
   * Update sequence timeout when prop changes
   */
  useEffect(() => {
    sequenceManagerRef.current.setTimeout(sequenceTimeout);
  }, [sequenceTimeout]);
  
  /**
   * Context value
   */
  const contextValue: KeyboardShortcutsContextValue = {
    registerShortcut,
    unregisterShortcut,
    shortcuts: registryRef.current['shortcuts'], // Access private field for context
    openHelpDialog,
    sequenceState,
  };
  
  return (
    <KeyboardShortcutsContext.Provider value={contextValue}>
      {children}
      <ShortcutHelpDialog 
        open={helpDialogOpen} 
        onOpenChange={setHelpDialogOpen}
        shortcuts={registryRef.current.getAllByCategory()}
      />
      <SequenceIndicator
        currentSequence={sequenceState?.keys || []}
        expectedKeys={sequenceState?.expectedKeys || []}
        visible={sequenceState !== null}
      />
    </KeyboardShortcutsContext.Provider>
  );
}
