import {
  isRecord,
  hasStringField,
  getErrorMessage,
  getErrorCode,
  type UnknownRecord,
} from '../typeGuards';

describe('typeGuards', () => {
  describe('isRecord', () => {
    it('should return true for objects', () => {
      expect(isRecord({})).toBe(true);
      expect(isRecord({ key: 'value' })).toBe(true);
      expect(isRecord({ nested: { prop: true } })).toBe(true);
    });

    it('should return false for non-objects', () => {
      expect(isRecord(null)).toBe(false);
      expect(isRecord(undefined)).toBe(false);
      expect(isRecord('string')).toBe(false);
      expect(isRecord(123)).toBe(false);
      expect(isRecord(true)).toBe(false);
      expect(isRecord([])).toBe(false);
      expect(isRecord(() => {})).toBe(false);
    });
  });

  describe('hasStringField', () => {
    it('should return true for objects with string field', () => {
      const obj = { name: 'test', age: 25 };
      expect(hasStringField(obj, 'name')).toBe(true);
    });

    it('should return false for objects without string field', () => {
      const obj = { name: 'test', age: 25 };
      expect(hasStringField(obj, 'age')).toBe(false);
      expect(hasStringField(obj, 'missing')).toBe(false);
    });

    it('should return false for non-objects', () => {
      expect(hasStringField(null as any, 'key')).toBe(false);
      expect(hasStringField(undefined as any, 'key')).toBe(false);
    });
  });

  describe('getErrorMessage', () => {
    it('should return message from Error instance', () => {
      const error = new Error('Test error message');
      expect(getErrorMessage(error)).toBe('Test error message');
    });

    it('should return message from error object', () => {
      const error = { message: 'Object error message' };
      expect(getErrorMessage(error)).toBe('Object error message');
    });

    it('should return string error as-is', () => {
      const error = 'String error message';
      expect(getErrorMessage(error)).toBe('String error message');
    });

    it('should return fallback for unknown error types', () => {
      expect(getErrorMessage(123)).toBe('Unknown error occurred');
      expect(getErrorMessage(null)).toBe('Unknown error occurred');
      expect(getErrorMessage(undefined)).toBe('Unknown error occurred');
      expect(getErrorMessage({})).toBe('Unknown error occurred');
    });

    it('should return custom fallback message', () => {
      expect(getErrorMessage(123, 'Custom fallback')).toBe('Custom fallback');
    });

    it('should handle empty strings', () => {
      expect(getErrorMessage('')).toBe('Unknown error occurred');
      expect(getErrorMessage('   ')).toBe('Unknown error occurred');
    });
  });

  describe('getErrorCode', () => {
    it('should return numeric code from error object', () => {
      const error = { code: 404 };
      expect(getErrorCode(error)).toBe(404);
    });

    it('should return string code from error object', () => {
      const error = { code: 'NOT_FOUND' };
      expect(getErrorCode(error)).toBe('NOT_FOUND');
    });

    it('should return undefined for missing code', () => {
      const error = { message: 'No code here' };
      expect(getErrorCode(error)).toBeUndefined();
    });

    it('should return undefined for non-objects', () => {
      expect(getErrorCode(null)).toBeUndefined();
      expect(getErrorCode('string')).toBeUndefined();
      expect(getErrorCode(123)).toBeUndefined();
    });

    it('should return undefined for invalid code types', () => {
      const error = { code: { invalid: true } };
      expect(getErrorCode(error)).toBeUndefined();
      const error2 = { code: true };
      expect(getErrorCode(error2)).toBeUndefined();
    });
  });
});
