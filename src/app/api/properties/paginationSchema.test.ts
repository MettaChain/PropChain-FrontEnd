import { paginationSchema } from './paginationSchema';

describe('paginationSchema (#1015)', () => {
  it('defaults page and size when omitted', () => {
    const result = paginationSchema.safeParse({ page: undefined, size: undefined });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual({ page: 1, size: 12 });
    }
  });

  it('coerces numeric query string values', () => {
    const result = paginationSchema.safeParse({ page: '3', size: '25' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual({ page: 3, size: 25 });
    }
  });

  it('rejects an oversized page size', () => {
    const result = paginationSchema.safeParse({ page: '1', size: '10000' });
    expect(result.success).toBe(false);
  });

  it('rejects a page below 1', () => {
    const result = paginationSchema.safeParse({ page: '0', size: '12' });
    expect(result.success).toBe(false);
  });

  it('rejects non-numeric input', () => {
    const result = paginationSchema.safeParse({ page: 'not-a-number', size: '12' });
    expect(result.success).toBe(false);
  });
});
