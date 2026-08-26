import { act, renderHook } from '@testing-library/react';
import { useRecentlyViewedStore } from '../recentlyViewedStore';

const mockProperty = (id: string) => ({
  id,
  name: `Property ${id}`,
  location: 'Testville, TS',
  price: 100000,
  image: `/properties/${id}.jpg`,
});

describe('recentlyViewedStore', () => {
  beforeEach(() => {
    localStorage.clear();
    useRecentlyViewedStore.getState().clearHistory();
  });

  it('starts with an empty history', () => {
    const { result } = renderHook(() => useRecentlyViewedStore());
    expect(result.current.getProperties()).toEqual([]);
  });

  it('adds a property with a viewedAt timestamp', () => {
    const { result } = renderHook(() => useRecentlyViewedStore());

    act(() => {
      result.current.addProperty(mockProperty('prop-1'));
    });

    const properties = result.current.getProperties();
    expect(properties).toHaveLength(1);
    expect(properties[0].id).toBe('prop-1');
    expect(properties[0].viewedAt).toBeGreaterThan(0);
  });

  it('deduplicates properties by id and moves the re-viewed one to the front', () => {
    const { result } = renderHook(() => useRecentlyViewedStore());

    act(() => {
      result.current.addProperty(mockProperty('prop-1'));
      result.current.addProperty(mockProperty('prop-2'));
      result.current.addProperty(mockProperty('prop-1'));
    });

    const properties = result.current.getProperties();
    expect(properties).toHaveLength(2);
    expect(properties[0].id).toBe('prop-1'); // most recent first
    expect(properties[1].id).toBe('prop-2');
  });

  it('caps the history at 10 entries', () => {
    const { result } = renderHook(() => useRecentlyViewedStore());

    act(() => {
      for (let i = 1; i <= 12; i++) {
        result.current.addProperty(mockProperty(`prop-${i}`));
      }
    });

    const properties = result.current.getProperties();
    expect(properties).toHaveLength(10);
    expect(properties[0].id).toBe('prop-12');
    expect(properties[9].id).toBe('prop-3');
  });

  it('removes a single property', () => {
    const { result } = renderHook(() => useRecentlyViewedStore());

    act(() => {
      result.current.addProperty(mockProperty('prop-1'));
      result.current.addProperty(mockProperty('prop-2'));
      result.current.removeProperty('prop-1');
    });

    const properties = result.current.getProperties();
    expect(properties).toHaveLength(1);
    expect(properties[0].id).toBe('prop-2');
  });

  it('clearHistory empties the list', () => {
    const { result } = renderHook(() => useRecentlyViewedStore());

    act(() => {
      result.current.addProperty(mockProperty('prop-1'));
      result.current.clearHistory();
    });

    expect(result.current.getProperties()).toEqual([]);
  });

  it('persists the history across store instances', () => {
    const { result } = renderHook(() => useRecentlyViewedStore());

    act(() => {
      result.current.addProperty(mockProperty('prop-1'));
    });

    const { result: result2 } = renderHook(() => useRecentlyViewedStore());
    expect(result2.current.getProperties()).toHaveLength(1);
    expect(result2.current.getProperties()[0].id).toBe('prop-1');
  });
});
