import { act, renderHook } from '@testing-library/react';
import { usePaginationParams, isValidPageSize, PAGE_SIZE_OPTIONS } from '../usePaginationParams';

const mockRouterPush = jest.fn();
let mockSearchParams: URLSearchParams = new URLSearchParams();

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: (...args: unknown[]) => mockRouterPush(...args) }),
  useSearchParams: () => mockSearchParams,
  usePathname: () => '/properties',
}));

describe('isValidPageSize', () => {
  it('accepts the configured page sizes', () => {
    expect(PAGE_SIZE_OPTIONS).toEqual([12, 24, 48]);
    for (const size of PAGE_SIZE_OPTIONS) {
      expect(isValidPageSize(size)).toBe(true);
    }
  });

  it('rejects arbitrary sizes', () => {
    expect(isValidPageSize(10)).toBe(false);
    expect(isValidPageSize(99)).toBe(false);
    expect(isValidPageSize(0)).toBe(false);
  });
});

describe('usePaginationParams', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSearchParams = new URLSearchParams();
    window.scrollTo = jest.fn();
  });

  it('defaults to page 1 and size 12 when no params are present', () => {
    const { result } = renderHook(() => usePaginationParams());
    expect(result.current.page).toBe(1);
    expect(result.current.size).toBe(12);
  });

  it('parses valid page and size params', () => {
    mockSearchParams = new URLSearchParams('page=3&size=24');
    const { result } = renderHook(() => usePaginationParams());
    expect(result.current.page).toBe(3);
    expect(result.current.size).toBe(24);
  });

  it('clamps invalid page values to 1', () => {
    for (const value of ['0', '-2', 'abc', '2.5']) {
      mockSearchParams = new URLSearchParams(`page=${value}`);
      const { result } = renderHook(() => usePaginationParams());
      expect(result.current.page).toBe(1);
    }
  });

  it('falls back to size 12 for invalid size values', () => {
    mockSearchParams = new URLSearchParams('size=99');
    const { result } = renderHook(() => usePaginationParams());
    expect(result.current.size).toBe(12);
  });

  it('builds an href that preserves other query params', () => {
    mockSearchParams = new URLSearchParams('sort=price-desc&page=1');
    const { result } = renderHook(() => usePaginationParams());

    const href = result.current.buildHref(2, 24);
    expect(href).toBe('/properties?sort=price-desc&page=2&size=24');
  });

  it('buildHref defaults to the current size when omitted', () => {
    mockSearchParams = new URLSearchParams('size=48');
    const { result } = renderHook(() => usePaginationParams());

    expect(result.current.buildHref(4)).toBe('/properties?size=48&page=4');
  });

  it('setPage pushes the updated href without scrolling', () => {
    mockSearchParams = new URLSearchParams('sort=price-desc');
    const { result } = renderHook(() => usePaginationParams());

    act(() => {
      result.current.setPage(5);
    });

    expect(mockRouterPush).toHaveBeenCalledWith(
      '/properties?sort=price-desc&page=5&size=12',
      { scroll: false },
    );
    expect(window.scrollTo).toHaveBeenCalledWith({ top: 0, behavior: 'smooth' });
  });

  it('setSize resets to page 1 with the new size', () => {
    mockSearchParams = new URLSearchParams('page=4');
    const { result } = renderHook(() => usePaginationParams());

    act(() => {
      result.current.setSize(48);
    });

    expect(mockRouterPush).toHaveBeenCalledWith(
      '/properties?page=1&size=48',
      { scroll: false },
    );
  });
});
