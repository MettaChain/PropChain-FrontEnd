/**
 * Keyboard Shortcuts Type Definitions
 * 
 * This file contains all TypeScript types and interfaces for the keyboard shortcuts system.
 */

/**
 * Category for grouping shortcuts in the help dialog
 */
export type ShortcutCategory = 
  | 'navigation' 
  | 'ui' 
  | 'search' 
  | 'general';

/**
 * Configuration for a keyboard shortcut
 */
export interface ShortcutConfig {
  /** Single key or sequence of keys (e.g., 'g' or ['g', 'p']) */
  key: string | string[];
  
  /** Human-readable description of what the shortcut does */
  description: string;
  
  /** Category for grouping in help dialog */
  category: ShortcutCategory;
  
  /** Callback function to execute when shortcut is triggered */
  callback: () => void | Promise<void>;
  
  /** Whether the shortcut is enabled (default: true) */
  enabled?: boolean;
  
  /** Whether to prevent default browser behavior (default: true) */
  preventDefault?: boolean;
  
  /** Whether to stop event propagation (default: false) */
  stopPropagation?: boolean;
}

/**
 * Internal registry entry for a registered shortcut
 */
export interface ShortcutEntry {
  /** Unique identifier for this shortcut registration */
  id: string;
  
  /** The shortcut configuration */
  config: ShortcutConfig;
  
  /** Timestamp when the shortcut was registered (for debugging) */
  registeredAt: number;
}

/**
 * State tracking for multi-key sequence shortcuts
 */
export interface SequenceState {
  /** Keys pressed so far in the sequence (e.g., ['g']) */
  keys: string[];
  
  /** Timestamp when the sequence started */
  timestamp: number;
  
  /** Timeout handle for resetting the sequence */
  timeoutId: NodeJS.Timeout | null;
  
  /** Possible next keys that can complete the sequence (e.g., ['p', 'd']) */
  expectedKeys: string[];
}

/**
 * Context value provided by KeyboardShortcutsProvider
 */
export interface KeyboardShortcutsContextValue {
  /** Register a new keyboard shortcut */
  registerShortcut: (id: string, config: ShortcutConfig) => void;
  
  /** Unregister a keyboard shortcut */
  unregisterShortcut: (id: string) => void;
  
  /** Get all registered shortcuts */
  shortcuts: Map<string, ShortcutEntry[]>;
  
  /** Open the keyboard shortcuts help dialog */
  openHelpDialog: () => void;
  
  /** Current sequence state (null if no sequence is active) */
  sequenceState: SequenceState | null;
}

/**
 * Props for KeyboardShortcutsProvider component
 */
export interface KeyboardShortcutsProviderProps {
  /** Child components */
  children: React.ReactNode;
  
  /** Timeout in milliseconds for sequence shortcuts (default: 1000) */
  sequenceTimeout?: number;
  
  /** Global disable flag for all shortcuts */
  disabled?: boolean;
}

/**
 * Props for ShortcutHelpDialog component
 */
export interface ShortcutHelpDialogProps {
  /** Whether the dialog is open */
  open: boolean;
  
  /** Callback when dialog open state changes */
  onOpenChange: (open: boolean) => void;
  
  /** Grouped shortcuts to display */
  shortcuts: Map<ShortcutCategory, ShortcutEntry[]>;
}

/**
 * Props for SequenceIndicator component
 */
export interface SequenceIndicatorProps {
  /** Keys pressed so far in the sequence (e.g., ['g']) */
  currentSequence: string[];
  
  /** Possible next keys (e.g., ['p', 'd']) */
  expectedKeys: string[];
  
  /** Whether the indicator should be visible */
  visible: boolean;
}

/**
 * Internal state for keyboard event handler
 */
export interface KeyboardEventState {
  /** Prevent re-entrant calls */
  isProcessing: boolean;
  
  /** Timestamp of last processed event (for debouncing) */
  lastEventTimestamp: number;
  
  /** Currently held modifier keys */
  activeModifiers: Set<string>;
}
