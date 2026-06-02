/**
 * Unit tests for keyNormalizer
 * 
 * Tests single key normalization, sequence normalization,
 * browser-specific key mappings, and case insensitivity.
 */

import { normalizeKey, isModifierKey, parseSequenceKey } from '../keyNormalizer';

describe('keyNormalizer', () => {
  describe('normalizeKey - single keys', () => {
    it('should normalize uppercase keys to lowercase', () => {
      expect(normalizeKey('A')).toBe('a');
      expect(normalizeKey('Z')).toBe('z');
      expect(normalizeKey('G')).toBe('g');
    });

    it('should keep lowercase keys as lowercase', () => {
      expect(normalizeKey('a')).toBe('a');
      expect(normalizeKey('z')).toBe('z');
      expect(normalizeKey('g')).toBe('g');
    });

    it('should handle special characters', () => {
      expect(normalizeKey('/')).toBe('/');
      expect(normalizeKey('?')).toBe('?');
      expect(normalizeKey('!')).toBe('!');
      expect(normalizeKey('@')).toBe('@');
      expect(normalizeKey('#')).toBe('#');
      expect(normalizeKey('$')).toBe('$');
      expect(normalizeKey('%')).toBe('%');
      expect(normalizeKey('^')).toBe('^');
      expect(normalizeKey('&')).toBe('&');
      expect(normalizeKey('*')).toBe('*');
    });

    it('should handle numbers', () => {
      expect(normalizeKey('0')).toBe('0');
      expect(normalizeKey('1')).toBe('1');
      expect(normalizeKey('9')).toBe('9');
    });

    it('should handle space', () => {
      expect(normalizeKey(' ')).toBe(' ');
    });

    describe('browser-specific key mappings', () => {
      it('should normalize "Esc" to "escape"', () => {
        expect(normalizeKey('Esc')).toBe('escape');
        expect(normalizeKey('esc')).toBe('escape');
        expect(normalizeKey('ESC')).toBe('escape');
      });

      it('should normalize "Escape" to "escape"', () => {
        expect(normalizeKey('Escape')).toBe('escape');
        expect(normalizeKey('escape')).toBe('escape');
      });

      it('should normalize "Spacebar" to space', () => {
        expect(normalizeKey('Spacebar')).toBe(' ');
        expect(normalizeKey('spacebar')).toBe(' ');
        expect(normalizeKey('SPACEBAR')).toBe(' ');
      });

      it('should normalize arrow key variants', () => {
        expect(normalizeKey('Left')).toBe('arrowleft');
        expect(normalizeKey('left')).toBe('arrowleft');
        expect(normalizeKey('ArrowLeft')).toBe('arrowleft');

        expect(normalizeKey('Right')).toBe('arrowright');
        expect(normalizeKey('right')).toBe('arrowright');
        expect(normalizeKey('ArrowRight')).toBe('arrowright');

        expect(normalizeKey('Up')).toBe('arrowup');
        expect(normalizeKey('up')).toBe('arrowup');
        expect(normalizeKey('ArrowUp')).toBe('arrowup');

        expect(normalizeKey('Down')).toBe('arrowdown');
        expect(normalizeKey('down')).toBe('arrowdown');
        expect(normalizeKey('ArrowDown')).toBe('arrowdown');
      });

      it('should normalize "Del" to "delete"', () => {
        expect(normalizeKey('Del')).toBe('delete');
        expect(normalizeKey('del')).toBe('delete');
        expect(normalizeKey('DEL')).toBe('delete');
      });

      it('should normalize "Delete" to "delete"', () => {
        expect(normalizeKey('Delete')).toBe('delete');
        expect(normalizeKey('delete')).toBe('delete');
      });

      it('should normalize "Return" to "enter"', () => {
        expect(normalizeKey('Return')).toBe('enter');
        expect(normalizeKey('return')).toBe('enter');
        expect(normalizeKey('RETURN')).toBe('enter');
      });

      it('should normalize "Enter" to "enter"', () => {
        expect(normalizeKey('Enter')).toBe('enter');
        expect(normalizeKey('enter')).toBe('enter');
      });
    });

    describe('modifier keys', () => {
      it('should normalize Control', () => {
        expect(normalizeKey('Control')).toBe('control');
        expect(normalizeKey('control')).toBe('control');
      });

      it('should normalize Shift', () => {
        expect(normalizeKey('Shift')).toBe('shift');
        expect(normalizeKey('shift')).toBe('shift');
      });

      it('should normalize Alt', () => {
        expect(normalizeKey('Alt')).toBe('alt');
        expect(normalizeKey('alt')).toBe('alt');
      });

      it('should normalize Meta', () => {
        expect(normalizeKey('Meta')).toBe('meta');
        expect(normalizeKey('meta')).toBe('meta');
      });
    });
  });

  describe('normalizeKey - sequences', () => {
    it('should normalize sequence of keys', () => {
      expect(normalizeKey(['g', 'p'])).toBe('g+p');
      expect(normalizeKey(['g', 'd'])).toBe('g+d');
    });

    it('should normalize uppercase keys in sequences', () => {
      expect(normalizeKey(['G', 'P'])).toBe('g+p');
      expect(normalizeKey(['G', 'D'])).toBe('g+d');
    });

    it('should normalize mixed case keys in sequences', () => {
      expect(normalizeKey(['G', 'p'])).toBe('g+p');
      expect(normalizeKey(['g', 'D'])).toBe('g+d');
    });

    it('should handle browser-specific keys in sequences', () => {
      expect(normalizeKey(['g', 'Esc'])).toBe('g+escape');
      expect(normalizeKey(['Esc', 'p'])).toBe('escape+p');
    });

    it('should handle single-key sequences', () => {
      expect(normalizeKey(['g'])).toBe('g');
      expect(normalizeKey(['G'])).toBe('g');
    });

    it('should handle three-key sequences', () => {
      expect(normalizeKey(['g', 'p', 'f'])).toBe('g+p+f');
      expect(normalizeKey(['G', 'P', 'F'])).toBe('g+p+f');
    });

    it('should handle empty sequences', () => {
      expect(normalizeKey([])).toBe('');
    });

    it('should handle sequences with special characters', () => {
      expect(normalizeKey(['/', '?'])).toBe('/+?');
      expect(normalizeKey(['g', '/'])).toBe('g+/');
    });
  });

  describe('isModifierKey', () => {
    it('should return true for Control', () => {
      expect(isModifierKey('Control')).toBe(true);
      expect(isModifierKey('control')).toBe(true);
      expect(isModifierKey('CONTROL')).toBe(true);
    });

    it('should return true for Shift', () => {
      expect(isModifierKey('Shift')).toBe(true);
      expect(isModifierKey('shift')).toBe(true);
      expect(isModifierKey('SHIFT')).toBe(true);
    });

    it('should return true for Alt', () => {
      expect(isModifierKey('Alt')).toBe(true);
      expect(isModifierKey('alt')).toBe(true);
      expect(isModifierKey('ALT')).toBe(true);
    });

    it('should return true for Meta', () => {
      expect(isModifierKey('Meta')).toBe(true);
      expect(isModifierKey('meta')).toBe(true);
      expect(isModifierKey('META')).toBe(true);
    });

    it('should return true for Ctrl', () => {
      expect(isModifierKey('Ctrl')).toBe(true);
      expect(isModifierKey('ctrl')).toBe(true);
      expect(isModifierKey('CTRL')).toBe(true);
    });

    it('should return true for Cmd', () => {
      expect(isModifierKey('Cmd')).toBe(true);
      expect(isModifierKey('cmd')).toBe(true);
      expect(isModifierKey('CMD')).toBe(true);
    });

    it('should return false for regular keys', () => {
      expect(isModifierKey('a')).toBe(false);
      expect(isModifierKey('g')).toBe(false);
      expect(isModifierKey('/')).toBe(false);
      expect(isModifierKey('?')).toBe(false);
      expect(isModifierKey('Enter')).toBe(false);
      expect(isModifierKey('Escape')).toBe(false);
    });

    it('should return false for arrow keys', () => {
      expect(isModifierKey('ArrowLeft')).toBe(false);
      expect(isModifierKey('ArrowRight')).toBe(false);
      expect(isModifierKey('ArrowUp')).toBe(false);
      expect(isModifierKey('ArrowDown')).toBe(false);
    });

    it('should return false for empty string', () => {
      expect(isModifierKey('')).toBe(false);
    });
  });

  describe('parseSequenceKey', () => {
    it('should parse two-key sequence', () => {
      expect(parseSequenceKey('g+p')).toEqual(['g', 'p']);
      expect(parseSequenceKey('g+d')).toEqual(['g', 'd']);
    });

    it('should parse three-key sequence', () => {
      expect(parseSequenceKey('g+p+f')).toEqual(['g', 'p', 'f']);
    });

    it('should parse single key', () => {
      expect(parseSequenceKey('g')).toEqual(['g']);
    });

    it('should handle empty string', () => {
      expect(parseSequenceKey('')).toEqual(['']);
    });

    it('should parse sequence with special characters', () => {
      expect(parseSequenceKey('g+/')).toEqual(['g', '/']);
      expect(parseSequenceKey('/+?')).toEqual(['/', '?']);
    });

    it('should parse sequence with normalized keys', () => {
      expect(parseSequenceKey('escape+p')).toEqual(['escape', 'p']);
      expect(parseSequenceKey('arrowleft+arrowright')).toEqual(['arrowleft', 'arrowright']);
    });
  });

  describe('idempotence', () => {
    it('should be idempotent for single keys', () => {
      const key = 'G';
      const normalized = normalizeKey(key);
      const normalizedAgain = normalizeKey(normalized);
      expect(normalized).toBe(normalizedAgain);
    });

    it('should be idempotent for sequences', () => {
      const sequence = ['G', 'P'];
      const normalized = normalizeKey(sequence);
      const parsed = parseSequenceKey(normalized);
      const normalizedAgain = normalizeKey(parsed);
      expect(normalized).toBe(normalizedAgain);
    });

    it('should be idempotent for browser-specific keys', () => {
      const key = 'Esc';
      const normalized = normalizeKey(key);
      const normalizedAgain = normalizeKey(normalized);
      expect(normalized).toBe(normalizedAgain);
    });

    it('should be idempotent for special characters', () => {
      const key = '/';
      const normalized = normalizeKey(key);
      const normalizedAgain = normalizeKey(normalized);
      expect(normalized).toBe(normalizedAgain);
    });

    it('should be idempotent for multiple normalizations', () => {
      const key = 'Escape';
      let normalized = normalizeKey(key);
      for (let i = 0; i < 10; i++) {
        const next = normalizeKey(normalized);
        expect(next).toBe(normalized);
        normalized = next;
      }
    });
  });

  describe('edge cases', () => {
    it('should handle empty string', () => {
      expect(normalizeKey('')).toBe('');
    });

    it('should handle whitespace', () => {
      expect(normalizeKey(' ')).toBe(' ');
      expect(normalizeKey('  ')).toBe('  ');
    });

    it('should handle tab character', () => {
      expect(normalizeKey('Tab')).toBe('tab');
      expect(normalizeKey('tab')).toBe('tab');
    });

    it('should handle unicode characters', () => {
      expect(normalizeKey('€')).toBe('€');
      expect(normalizeKey('ñ')).toBe('ñ');
      expect(normalizeKey('中')).toBe('中');
    });

    it('should handle very long sequences', () => {
      const longSequence = Array.from({ length: 100 }, (_, i) => String(i));
      const normalized = normalizeKey(longSequence);
      expect(normalized).toBe(longSequence.join('+'));
    });
  });
});
