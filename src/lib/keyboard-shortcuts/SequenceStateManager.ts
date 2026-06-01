/**
 * Sequence State Manager
 * 
 * Manages the state of multi-key sequence shortcuts (e.g., G+P, G+D).
 * Tracks keys pressed in a sequence and handles timeout-based reset.
 */

import type { SequenceState } from '@/types/keyboard-shortcuts';
import { logger } from '@/utils/logger';

/**
 * Manages state for multi-key sequence shortcuts
 */
export class SequenceStateManager {
  /**
   * Current sequence state (null if no sequence is active)
   */
  private state: SequenceState | null = null;

  /**
   * Timeout duration in milliseconds
   */
  private timeout: number;

  /**
   * Creates a new SequenceStateManager
   * 
   * @param timeout - Timeout in milliseconds for sequence completion (default: 1000)
   */
  constructor(timeout: number = 1000) {
    this.timeout = timeout;
  }

  /**
   * Starts a new sequence with the first key
   * 
   * @param key - The first key in the sequence
   * @param expectedKeys - Array of possible next keys
   * 
   * @example
   * manager.startSequence('g', ['p', 'd']);
   */
  startSequence(key: string, expectedKeys: string[]): void {
    // Clear any existing sequence
    this.reset();
    
    // Create timeout to reset sequence
    const timeoutId = setTimeout(() => {
      logger.debug(`Sequence timeout: ${key}`);
      this.reset();
    }, this.timeout);
    
    // Set new state
    this.state = {
      keys: [key],
      timestamp: Date.now(),
      timeoutId,
      expectedKeys,
    };
    
    logger.debug(`Started sequence: ${key} (expecting: ${expectedKeys.join(', ')})`);
  }

  /**
   * Adds a key to the current sequence
   * 
   * @param key - The key to add
   * @returns True if the sequence is complete, false otherwise
   * 
   * @example
   * manager.startSequence('g', ['p', 'd']);
   * const complete = manager.addKey('p'); // true
   */
  addKey(key: string): boolean {
    if (!this.state) {
      logger.warn(`Attempted to add key "${key}" to non-existent sequence`);
      return false;
    }
    
    // Check if this key is expected
    if (!this.state.expectedKeys.includes(key)) {
      logger.debug(`Unexpected key "${key}" in sequence, resetting`);
      this.reset();
      return false;
    }
    
    // Add key to sequence
    this.state.keys.push(key);
    
    logger.debug(`Added key to sequence: ${this.state.keys.join('+')}`);
    
    // Sequence is complete (we only support 2-key sequences currently)
    return true;
  }

  /**
   * Resets the sequence state
   */
  reset(): void {
    if (this.state) {
      // Clear timeout
      if (this.state.timeoutId) {
        clearTimeout(this.state.timeoutId);
      }
      
      logger.debug(`Reset sequence: ${this.state.keys.join('+')}`);
      this.state = null;
    }
  }

  /**
   * Checks if a sequence is currently active
   * 
   * @returns True if a sequence is active
   */
  isActive(): boolean {
    return this.state !== null;
  }

  /**
   * Gets the current sequence state
   * 
   * @returns The current state, or null if no sequence is active
   */
  getState(): SequenceState | null {
    return this.state;
  }

  /**
   * Gets the keys pressed so far in the current sequence
   * 
   * @returns Array of keys, or empty array if no sequence is active
   */
  getCurrentKeys(): string[] {
    return this.state?.keys || [];
  }

  /**
   * Gets the expected next keys for the current sequence
   * 
   * @returns Array of expected keys, or empty array if no sequence is active
   */
  getExpectedKeys(): string[] {
    return this.state?.expectedKeys || [];
  }

  /**
   * Gets the time elapsed since the sequence started
   * 
   * @returns Elapsed time in milliseconds, or 0 if no sequence is active
   */
  getElapsedTime(): number {
    if (!this.state) {
      return 0;
    }
    return Date.now() - this.state.timestamp;
  }

  /**
   * Updates the timeout duration
   * 
   * @param timeout - New timeout in milliseconds
   */
  setTimeout(timeout: number): void {
    this.timeout = timeout;
    
    // If a sequence is active, restart the timeout with the new duration
    if (this.state) {
      if (this.state.timeoutId) {
        clearTimeout(this.state.timeoutId);
      }
      
      const timeoutId = setTimeout(() => {
        logger.debug(`Sequence timeout (updated): ${this.state?.keys.join('+')}`);
        this.reset();
      }, this.timeout);
      
      this.state.timeoutId = timeoutId;
    }
  }

  /**
   * Gets the current timeout duration
   * 
   * @returns Timeout in milliseconds
   */
  getTimeout(): number {
    return this.timeout;
  }
}
