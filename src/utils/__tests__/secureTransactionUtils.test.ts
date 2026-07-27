import { 
  formatAddress, 
  formatEth, 
  getRiskLevelColor, 
  getRiskLevelBg, 
  getProgressForStep 
} from '../secureTransactionUtils';

describe('secureTransactionUtils', () => {
  describe('formatAddress', () => {
    it('formats a standard ethereum address', () => {
      expect(formatAddress('0x1234567890123456789012345678901234567890'))
        .toBe('0x1234...7890');
    });

    it('returns the same string if it is too short', () => {
      expect(formatAddress('0x123')).toBe('0x123');
    });

    it('handles empty string', () => {
      expect(formatAddress('')).toBe('');
    });
  });

  describe('formatEth', () => {
    it('formats wei to eth with 6 decimal places', () => {
      expect(formatEth('1000000000000000000')).toBe('1.000000');
      expect(formatEth('500000000000000000')).toBe('0.500000');
    });

    it('handles zero', () => {
      expect(formatEth('0')).toBe('0.000000');
    });

    it('handles undefined or null', () => {
      expect(formatEth(undefined)).toBe('0.000000');
    });

    it('handles invalid input gracefully', () => {
      expect(formatEth('invalid')).toBe('0.000000');
    });
  });

  describe('getRiskLevelColor', () => {
    it('returns correct red for critical', () => {
      expect(getRiskLevelColor('critical')).toContain('red-600');
    });

    it('returns correct orange for high', () => {
      expect(getRiskLevelColor('high')).toContain('orange-600');
    });

    it('returns default color for unknown level', () => {
      expect(getRiskLevelColor('unknown')).toContain('gray-600');
    });
  });

  describe('getRiskLevelBg', () => {
    it('returns correct background for critical', () => {
      expect(getRiskLevelBg('critical')).toContain('bg-red-50');
    });

    it('returns correct background for low', () => {
      expect(getRiskLevelBg('low')).toContain('bg-green-50');
    });
  });

  describe('getProgressForStep', () => {
    it('returns correct progress for validation', () => {
      expect(getProgressForStep('validation')).toBe(25);
    });

    it('returns correct progress for signing', () => {
      expect(getProgressForStep('signing')).toBe(50);
    });

    it('returns correct progress for broadcast', () => {
      expect(getProgressForStep('broadcast')).toBe(75);
    });
  });
});
