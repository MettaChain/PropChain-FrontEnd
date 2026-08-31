import { act, renderHook } from '@testing-library/react';
import { useCompareStore } from '../compareStore';

describe('compareStore', () => {
  beforeEach(() => {
    localStorage.clear();
    useCompareStore.getState().clearCompare();
  });

  it('starts with no selected properties', () => {
    const { result } = renderHook(() => useCompareStore());
    expect(result.current.selectedIds).toEqual([]);
  });

  it('adds a property to the selection', () => {
    const { result } = renderHook(() => useCompareStore());

    act(() => {
      result.current.addProperty('prop-1');
    });

    expect(result.current.selectedIds).toEqual(['prop-1']);
  });

  it('does not add a duplicate property', () => {
    const { result } = renderHook(() => useCompareStore());

    act(() => {
      result.current.addProperty('prop-1');
      result.current.addProperty('prop-1');
    });

    expect(result.current.selectedIds).toEqual(['prop-1']);
  });

  it('limits the selection to 3 properties', () => {
    const { result } = renderHook(() => useCompareStore());

    act(() => {
      result.current.addProperty('prop-1');
      result.current.addProperty('prop-2');
      result.current.addProperty('prop-3');
      result.current.addProperty('prop-4');
    });

    expect(result.current.selectedIds).toEqual(['prop-1', 'prop-2', 'prop-3']);
  });

  it('removes a property from the selection', () => {
    const { result } = renderHook(() => useCompareStore());

    act(() => {
      result.current.addProperty('prop-1');
      result.current.addProperty('prop-2');
      result.current.removeProperty('prop-1');
    });

    expect(result.current.selectedIds).toEqual(['prop-2']);
  });

  it('toggles a property in and out of the selection', () => {
    const { result } = renderHook(() => useCompareStore());

    act(() => {
      result.current.toggleProperty('prop-1');
    });
    expect(result.current.selectedIds).toEqual(['prop-1']);

    act(() => {
      result.current.toggleProperty('prop-1');
    });
    expect(result.current.selectedIds).toEqual([]);
  });

  it('does not toggle beyond the 3-property limit', () => {
    const { result } = renderHook(() => useCompareStore());

    act(() => {
      result.current.addProperty('prop-1');
      result.current.addProperty('prop-2');
      result.current.addProperty('prop-3');
      result.current.toggleProperty('prop-4');
    });

    expect(result.current.selectedIds).toEqual(['prop-1', 'prop-2', 'prop-3']);
  });

  it('setSelectedIds replaces the selection and clamps to 3', () => {
    const { result } = renderHook(() => useCompareStore());

    act(() => {
      result.current.setSelectedIds(['a', 'b', 'c', 'd', 'e']);
    });

    expect(result.current.selectedIds).toEqual(['a', 'b', 'c']);
  });

  it('clearCompare empties the selection', () => {
    const { result } = renderHook(() => useCompareStore());

    act(() => {
      result.current.addProperty('prop-1');
      result.current.clearCompare();
    });

    expect(result.current.selectedIds).toEqual([]);
  });

  it('persists the selection across store instances', () => {
    const { result } = renderHook(() => useCompareStore());

    act(() => {
      result.current.addProperty('prop-1');
    });

    const { result: result2 } = renderHook(() => useCompareStore());
    expect(result2.current.selectedIds).toEqual(['prop-1']);
  });
});
