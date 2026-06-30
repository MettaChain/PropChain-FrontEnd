import { renderHook, act } from '@testing-library/react';
import { useSavedSearchStore } from '../savedSearchStore';

test('debug useSavedSearchStore shape', () => {
  const { result } = renderHook(() => useSavedSearchStore());
  console.log('useSavedSearchStore typeof', typeof useSavedSearchStore);
  console.log('result.current keys', Object.keys(result.current || {}));

  // Assert methods exist and are callable
  expect(typeof result.current.addSearch).toBe('function');
  expect(typeof result.current.loadSearches).toBe('function');

  // Call synchronous methods inside act
  const mock = { id: 'dbg', name: 'dbg', userId: 'u', filters: {}, createdAt: Date.now(), updatedAt: Date.now() };
  act(() => {
    result.current.addSearch(mock as any);
  });
  expect(result.current.searches.length).toBeGreaterThanOrEqual(1);
});
