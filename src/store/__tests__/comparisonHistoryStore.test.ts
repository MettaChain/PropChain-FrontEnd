import { act, renderHook } from '@testing-library/react';
import { useComparisonHistoryStore } from '../comparisonHistoryStore';

describe('comparisonHistoryStore', () => {
  beforeEach(() => {
    localStorage.clear();
    useComparisonHistoryStore.getState().clearHistory();
  });

  it('starts with an empty history', () => {
    const { result } = renderHook(() => useComparisonHistoryStore());
    expect(result.current.getHistory()).toEqual([]);
  });

  it('records a comparison with a share URL', () => {
    const { result } = renderHook(() => useComparisonHistoryStore());

    act(() => {
      result.current.addComparison(['prop-1', 'prop-2']);
    });

    const history = result.current.getHistory();
    expect(history).toHaveLength(1);
    expect(history[0].propertyIds).toEqual(['prop-1', 'prop-2']);
    expect(history[0].shareUrl).toBe('/compare?ids=prop-1,prop-2');
    expect(history[0].timestamp).toBeGreaterThan(0);
  });

  it('ignores empty comparison requests', () => {
    const { result } = renderHook(() => useComparisonHistoryStore());

    act(() => {
      result.current.addComparison([]);
    });

    expect(result.current.getHistory()).toEqual([]);
  });

  it('caps the history at 5 entries, evicting the oldest', () => {
    const { result } = renderHook(() => useComparisonHistoryStore());

    act(() => {
      for (let i = 1; i <= 6; i++) {
        result.current.addComparison([`prop-${i}`]);
      }
    });

    const history = result.current.getHistory();
    expect(history).toHaveLength(5);
    expect(history[0].propertyIds).toEqual(['prop-6']);
    expect(history[4].propertyIds).toEqual(['prop-2']);
  });

  it('removes a single comparison entry', () => {
    const { result } = renderHook(() => useComparisonHistoryStore());

    act(() => {
      result.current.addComparison(['prop-1']);
      result.current.addComparison(['prop-2']);
    });

    const firstId = result.current.getHistory()[0].id;
    act(() => {
      result.current.removeComparison(firstId);
    });

    const history = result.current.getHistory();
    expect(history).toHaveLength(1);
    expect(history[0].propertyIds).toEqual(['prop-1']);
  });

  it('clearHistory empties the history', () => {
    const { result } = renderHook(() => useComparisonHistoryStore());

    act(() => {
      result.current.addComparison(['prop-1']);
      result.current.clearHistory();
    });

    expect(result.current.getHistory()).toEqual([]);
  });

  it('persists the history across store instances', () => {
    const { result } = renderHook(() => useComparisonHistoryStore());

    act(() => {
      result.current.addComparison(['prop-1', 'prop-2']);
    });

    const { result: result2 } = renderHook(() => useComparisonHistoryStore());
    expect(result2.current.getHistory()).toHaveLength(1);
    expect(result2.current.getHistory()[0].propertyIds).toEqual(['prop-1', 'prop-2']);
  });
});
