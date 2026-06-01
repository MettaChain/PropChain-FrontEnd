/**
 * Key Normalization Utility
 * 
 * Normalizes keyboard event keys to consistent lowercase strings,
 * handling browser-specific differences and deprecated key names.
 */

/**
 * Map of deprecated or inconsistent key names to their normalized equivalents
 */
const KEY_MAPPINGS: Record<string, string> = {
  'esc': 'escape',
  'spacebar': ' ',
  'left': 'arrowleft',
  'right': 'arrowright',
  'up': 'arrowup',
  'down': 'arrowdown',
  'del': 'delete',
  'return': 'enter',
};

/**
 * Normalizes a single key string to lowercase and handles browser differences
 * 
 * @param key - The key string from KeyboardEvent.key
 * @returns Normalized lowercase key string
 * 
 * @example
 * normalizeKey('Escape') // 'escape'
 * normalizeKey('Esc') // 'escape'
 * normalizeKey('/') // '/'
 */
export function normalizeKey(key: string): string;

/**
 * Normalizes a sequence of keys to a joined string representation
 * 
 * @param key - Array of key strings
 * @returns Normalized sequence as 'key1+key2+...'
 * 
 * @example
 * normalizeKey(['G', 'P']) // 'g+p'
 * normalizeKey(['g', 'd']) // 'g+d'
 */
export function normalizeKey(key: string[]): string;

/**
 * Implementation of normalizeKey with overloads
 */
export function normalizeKey(key: string | string[]): string {
  // Handle array (sequence) case
  if (Array.isArray(key)) {
    return key.map(k => normalizeSingleKey(k)).join('+');
  }
  
  // Handle single key case
  return normalizeSingleKey(key);
}

/**
 * Normalizes a single key string
 * 
 * @param key - Single key string
 * @returns Normalized lowercase key
 */
function normalizeSingleKey(key: string): string {
  // Convert to lowercase
  const normalized = key.toLowerCase();
  
  // Map deprecated/inconsistent key names
  return KEY_MAPPINGS[normalized] || normalized;
}

/**
 * Checks if a key string represents a modifier key
 * 
 * @param key - The key string to check
 * @returns True if the key is a modifier key
 */
export function isModifierKey(key: string): boolean {
  const normalized = normalizeKey(key);
  return ['control', 'shift', 'alt', 'meta', 'ctrl', 'cmd'].includes(normalized);
}

/**
 * Parses a key sequence string back into an array
 * 
 * @param sequenceKey - Normalized sequence string (e.g., 'g+p')
 * @returns Array of individual keys
 * 
 * @example
 * parseSequenceKey('g+p') // ['g', 'p']
 */
export function parseSequenceKey(sequenceKey: string): string[] {
  return sequenceKey.split('+');
}
