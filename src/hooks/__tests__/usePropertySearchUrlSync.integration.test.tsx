/**
 * Integration tests for usePropertySearchUrlSync with the real search store and
 * the real URL (de)serialisers. Only next/navigation is mocked.
 */
import { renderHook, act } from '@testing-library/react';
import { usePropertySearchUrlSync } from '../usePropertySearchUrlSync';
import { useSearchStore } from '@/store/searchStore';

const mockPush = jest.fn();
const mockRouter = { push: mockPush };
let mockSearchParams = new URLSearchParams();

jest.mock('next/navigation', () => ({
  useRouter: () => mockRouter,
  useSearchParams: () => mockSearchParams,
}));

describe('usePropertySearchUrlSync integration', () => {
  beforeEach(() => {
    mockPush.mockClear();
    mockSearchParams = new URLSearchParams();
    act(() => {
      useSearchStore.getState().reset();
    });
  });

  it('initialises store filters and sort from the URL', () => {
    mockSearchParams = new URLSearchParams('q=loft&minPrice=100000&sort=price-asc');

    renderHook(() => usePropertySearchUrlSync());

    const { filters, sortBy } = useSearchStore.getState();
    expect(filters.query).toBe('loft');
    expect(filters.priceRange[0]).toBe(100000);
    expect(sortBy).toBe('price-asc');
  });

  it('does not push to the URL on mount when nothing changed', () => {
    renderHook(() => usePropertySearchUrlSync());

    expect(mockPush).not.toHaveBeenCalled();
  });

  it('pushes a store filter change to the URL', () => {
    renderHook(() => usePropertySearchUrlSync());

    act(() => {
      useSearchStore.getState().setFilter('query', 'villa');
    });

    expect(mockPush).toHaveBeenCalledTimes(1);
    const [url, options] = mockPush.mock.calls[0];
    expect(url).toMatch(/^\/properties\?/);
    expect(new URLSearchParams(url.split('?')[1]).get('q')).toBe('villa');
    expect(options).toEqual({ scroll: false });
  });

  it('writes to a custom base path and preserves pagination params', () => {
    mockSearchParams = new URLSearchParams('page=3&size=24');

    renderHook(() => usePropertySearchUrlSync('/search'));

    act(() => {
      useSearchStore.getState().setFilter('location', 'Lisbon');
    });

    const url: string = mockPush.mock.calls[0][0];
    const params = new URLSearchParams(url.split('?')[1]);
    expect(url.startsWith('/search?')).toBe(true);
    expect(params.get('location')).toBe('Lisbon');
    expect(params.get('page')).toBe('3');
    expect(params.get('size')).toBe('24');
  });

  it('ignores invalid URL params instead of corrupting the store', () => {
    mockSearchParams = new URLSearchParams('types=bogus&sort=nonsense');

    renderHook(() => usePropertySearchUrlSync());

    const { filters, sortBy } = useSearchStore.getState();
    expect(filters.propertyTypes).toEqual([]);
    expect(sortBy).toBe('newest');
  });

  it('clearing filters in the store resets them to defaults', () => {
    mockSearchParams = new URLSearchParams('q=loft');
    renderHook(() => usePropertySearchUrlSync());
    expect(useSearchStore.getState().filters.query).toBe('loft');

    act(() => {
      useSearchStore.getState().clearFilters();
    });

    expect(useSearchStore.getState().filters.query).toBe('');
  });
});
