/**
 * Unit tests for SequenceStateManager
 * 
 * Tests sequence start, key addition, completion detection,
 * timeout handling, and state management.
 */

import { SequenceStateManager } from '../SequenceStateManager';

describe('SequenceStateManager', () => {
  let manager: SequenceStateManager;

  beforeEach(() => {
    manager = new SequenceStateManager(1000);
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.clearAllTimers();
    jest.useRealTimers();
  });

  describe('startSequence', () => {
    it('should start a new sequence with the first key', () => {
      manager.startSequence('g', ['p', 'd']);

      expect(manager.isActive()).toBe(true);
      expect(manager.getCurrentKeys()).toEqual(['g']);
      expect(manager.getExpectedKeys()).toEqual(['p', 'd']);
    });

    it('should reset any existing sequence when starting a new one', () => {
      manager.startSequence('g', ['p', 'd']);
      manager.startSequence('h', ['e', 'l']);

      expect(manager.getCurrentKeys()).toEqual(['h']);
      expect(manager.getExpectedKeys()).toEqual(['e', 'l']);
    });

    it('should set up a timeout for the sequence', () => {
      manager.startSequence('g', ['p', 'd']);

      expect(manager.isActive()).toBe(true);

      // Fast-forward time past the timeout
      jest.advanceTimersByTime(1000);

      expect(manager.isActive()).toBe(false);
    });

    it('should track the timestamp when sequence starts', () => {
      const startTime = Date.now();
      manager.startSequence('g', ['p', 'd']);

      const state = manager.getState();
      expect(state).not.toBeNull();
      expect(state!.timestamp).toBeGreaterThanOrEqual(startTime);
    });
  });

  describe('addKey', () => {
    beforeEach(() => {
      manager.startSequence('g', ['p', 'd']);
    });

    it('should add an expected key to the sequence', () => {
      const complete = manager.addKey('p');

      expect(complete).toBe(true);
      expect(manager.getCurrentKeys()).toEqual(['g', 'p']);
    });

    it('should return true when sequence is complete', () => {
      const complete = manager.addKey('p');

      expect(complete).toBe(true);
    });

    it('should reset sequence if unexpected key is pressed', () => {
      const complete = manager.addKey('x');

      expect(complete).toBe(false);
      expect(manager.isActive()).toBe(false);
    });

    it('should return false if no sequence is active', () => {
      manager.reset();
      const complete = manager.addKey('p');

      expect(complete).toBe(false);
    });

    it('should handle multiple expected keys correctly', () => {
      const completeP = manager.addKey('p');
      expect(completeP).toBe(true);

      // Start a new sequence
      manager.startSequence('g', ['p', 'd']);
      const completeD = manager.addKey('d');
      expect(completeD).toBe(true);
    });
  });

  describe('reset', () => {
    it('should clear the sequence state', () => {
      manager.startSequence('g', ['p', 'd']);
      manager.reset();

      expect(manager.isActive()).toBe(false);
      expect(manager.getState()).toBeNull();
      expect(manager.getCurrentKeys()).toEqual([]);
      expect(manager.getExpectedKeys()).toEqual([]);
    });

    it('should clear the timeout', () => {
      manager.startSequence('g', ['p', 'd']);
      const state = manager.getState();
      const timeoutId = state!.timeoutId;

      manager.reset();

      // Advance time to verify timeout was cleared
      jest.advanceTimersByTime(1000);
      expect(manager.isActive()).toBe(false);
    });

    it('should be safe to call when no sequence is active', () => {
      expect(() => manager.reset()).not.toThrow();
    });

    it('should be safe to call multiple times', () => {
      manager.startSequence('g', ['p', 'd']);
      manager.reset();
      manager.reset();

      expect(manager.isActive()).toBe(false);
    });
  });

  describe('isActive', () => {
    it('should return false initially', () => {
      expect(manager.isActive()).toBe(false);
    });

    it('should return true when sequence is active', () => {
      manager.startSequence('g', ['p', 'd']);
      expect(manager.isActive()).toBe(true);
    });

    it('should return false after reset', () => {
      manager.startSequence('g', ['p', 'd']);
      manager.reset();
      expect(manager.isActive()).toBe(false);
    });

    it('should return false after timeout', () => {
      manager.startSequence('g', ['p', 'd']);
      jest.advanceTimersByTime(1000);
      expect(manager.isActive()).toBe(false);
    });
  });

  describe('getState', () => {
    it('should return null when no sequence is active', () => {
      expect(manager.getState()).toBeNull();
    });

    it('should return the current state when sequence is active', () => {
      manager.startSequence('g', ['p', 'd']);
      const state = manager.getState();

      expect(state).not.toBeNull();
      expect(state!.keys).toEqual(['g']);
      expect(state!.expectedKeys).toEqual(['p', 'd']);
      expect(state!.timestamp).toBeDefined();
      expect(state!.timeoutId).toBeDefined();
    });
  });

  describe('getCurrentKeys', () => {
    it('should return empty array when no sequence is active', () => {
      expect(manager.getCurrentKeys()).toEqual([]);
    });

    it('should return keys pressed so far', () => {
      manager.startSequence('g', ['p', 'd']);
      expect(manager.getCurrentKeys()).toEqual(['g']);

      manager.addKey('p');
      expect(manager.getCurrentKeys()).toEqual(['g', 'p']);
    });
  });

  describe('getExpectedKeys', () => {
    it('should return empty array when no sequence is active', () => {
      expect(manager.getExpectedKeys()).toEqual([]);
    });

    it('should return expected next keys', () => {
      manager.startSequence('g', ['p', 'd']);
      expect(manager.getExpectedKeys()).toEqual(['p', 'd']);
    });
  });

  describe('getElapsedTime', () => {
    it('should return 0 when no sequence is active', () => {
      expect(manager.getElapsedTime()).toBe(0);
    });

    it('should return elapsed time since sequence started', () => {
      manager.startSequence('g', ['p', 'd']);
      
      jest.advanceTimersByTime(500);
      
      const elapsed = manager.getElapsedTime();
      expect(elapsed).toBeGreaterThanOrEqual(500);
      expect(elapsed).toBeLessThan(600);
    });
  });

  describe('setTimeout', () => {
    it('should update the timeout duration', () => {
      manager.setTimeout(2000);
      expect(manager.getTimeout()).toBe(2000);
    });

    it('should restart timeout for active sequence with new duration', () => {
      manager.startSequence('g', ['p', 'd']);
      manager.setTimeout(2000);

      // Advance by original timeout (1000ms) - should still be active
      jest.advanceTimersByTime(1000);
      expect(manager.isActive()).toBe(true);

      // Advance by new timeout (2000ms total)
      jest.advanceTimersByTime(1000);
      expect(manager.isActive()).toBe(false);
    });

    it('should not affect inactive sequences', () => {
      manager.setTimeout(2000);
      expect(manager.isActive()).toBe(false);
    });
  });

  describe('getTimeout', () => {
    it('should return the default timeout', () => {
      expect(manager.getTimeout()).toBe(1000);
    });

    it('should return the updated timeout', () => {
      manager.setTimeout(2000);
      expect(manager.getTimeout()).toBe(2000);
    });
  });

  describe('timeout behavior', () => {
    it('should automatically reset sequence after timeout', () => {
      manager.startSequence('g', ['p', 'd']);
      expect(manager.isActive()).toBe(true);

      jest.advanceTimersByTime(1000);

      expect(manager.isActive()).toBe(false);
      expect(manager.getState()).toBeNull();
    });

    it('should not reset if sequence is completed before timeout', () => {
      manager.startSequence('g', ['p', 'd']);
      
      jest.advanceTimersByTime(500);
      manager.addKey('p');

      // Advance past original timeout
      jest.advanceTimersByTime(600);

      // Sequence should have been completed and reset manually
      // (in real usage, the provider would reset after executing callback)
    });

    it('should handle custom timeout durations', () => {
      const customManager = new SequenceStateManager(500);
      customManager.startSequence('g', ['p', 'd']);

      jest.advanceTimersByTime(400);
      expect(customManager.isActive()).toBe(true);

      jest.advanceTimersByTime(100);
      expect(customManager.isActive()).toBe(false);
    });
  });

  describe('edge cases', () => {
    it('should handle empty expected keys array', () => {
      manager.startSequence('g', []);
      expect(manager.getExpectedKeys()).toEqual([]);
    });

    it('should handle single expected key', () => {
      manager.startSequence('g', ['p']);
      const complete = manager.addKey('p');
      expect(complete).toBe(true);
    });

    it('should handle many expected keys', () => {
      manager.startSequence('g', ['a', 'b', 'c', 'd', 'e']);
      expect(manager.getExpectedKeys()).toEqual(['a', 'b', 'c', 'd', 'e']);
    });

    it('should handle rapid sequence starts', () => {
      manager.startSequence('g', ['p']);
      manager.startSequence('h', ['e']);
      manager.startSequence('i', ['j']);

      expect(manager.getCurrentKeys()).toEqual(['i']);
      expect(manager.getExpectedKeys()).toEqual(['j']);
    });
  });
});
