import { renderHook, act } from '@testing-library/react';
import { useDebouncedSearch } from '../useDebouncedSearch';

describe('useDebouncedSearch', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('starts with an empty query and no results', () => {
    const searchFn = jest.fn().mockResolvedValue(['a']);
    const { result } = renderHook(() =>
      useDebouncedSearch({ searchFn, delay: 300 }),
    );

    expect(result.current.query).toBe('');
    expect(result.current.results).toBeUndefined();
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('does not fire the search until the debounce window elapses', () => {
    const searchFn = jest.fn().mockResolvedValue(['a']);
    const { result } = renderHook(() =>
      useDebouncedSearch({ searchFn, delay: 300 }),
    );

    act(() => {
      result.current.setQuery('hello');
    });

    expect(searchFn).not.toHaveBeenCalled();

    act(() => {
      jest.advanceTimersByTime(300);
    });

    expect(searchFn).toHaveBeenCalledTimes(1);
    expect(searchFn).toHaveBeenCalledWith('hello', expect.any(AbortSignal));
  });

  it('collapses rapid input into a single search with the latest query', () => {
    const searchFn = jest.fn().mockResolvedValue(['a']);
    const { result } = renderHook(() =>
      useDebouncedSearch({ searchFn, delay: 300 }),
    );

    act(() => {
      result.current.setQuery('h');
      jest.advanceTimersByTime(100);
      result.current.setQuery('he');
      jest.advanceTimersByTime(100);
      result.current.setQuery('hel');
      jest.advanceTimersByTime(100);
      result.current.setQuery('hello');
      jest.advanceTimersByTime(300);
    });

    expect(searchFn).toHaveBeenCalledTimes(1);
    expect(searchFn).toHaveBeenCalledWith('hello', expect.any(AbortSignal));
  });

  it('sets results once the async search resolves', async () => {
    const searchFn = jest.fn().mockResolvedValue(['result-1']);
    const { result } = renderHook(() =>
      useDebouncedSearch({ searchFn, delay: 300 }),
    );

    act(() => {
      result.current.setQuery('hello');
    });

    await act(async () => {
      jest.advanceTimersByTime(300);
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(result.current.results).toEqual(['result-1']);
    expect(result.current.isLoading).toBe(false);
  });

  it('surfaces errors from the search function', async () => {
    const searchFn = jest.fn().mockRejectedValue(new Error('Network error'));
    const { result } = renderHook(() =>
      useDebouncedSearch({ searchFn, delay: 300 }),
    );

    act(() => {
      result.current.setQuery('hello');
    });

    await act(async () => {
      jest.advanceTimersByTime(300);
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(result.current.error).toEqual(new Error('Network error'));
    expect(result.current.isLoading).toBe(false);
  });

  it('respects minLength and does not search short queries', () => {
    const searchFn = jest.fn().mockResolvedValue(['a']);
    const { result } = renderHook(() =>
      useDebouncedSearch({ searchFn, delay: 300, minLength: 3, initialResults: ['init'] }),
    );

    act(() => {
      result.current.setQuery('hi');
      jest.advanceTimersByTime(300);
    });

    expect(searchFn).not.toHaveBeenCalled();
    expect(result.current.results).toEqual(['init']);
    expect(result.current.isLoading).toBe(false);
  });

  it('clear resets query, results and error', () => {
    const searchFn = jest.fn().mockResolvedValue(['a']);
    const { result } = renderHook(() =>
      useDebouncedSearch({ searchFn, delay: 300, initialResults: ['init'] }),
    );

    act(() => {
      result.current.setQuery('hello');
      result.current.clear();
    });

    expect(result.current.query).toBe('');
    expect(result.current.results).toEqual(['init']);
    expect(result.current.error).toBeNull();
  });

  it('cleans up pending timers on unmount', () => {
    const searchFn = jest.fn().mockResolvedValue(['a']);
    const { result, unmount } = renderHook(() =>
      useDebouncedSearch({ searchFn, delay: 300 }),
    );

    act(() => {
      result.current.setQuery('hello');
    });

    unmount();

    act(() => {
      jest.advanceTimersByTime(300);
    });

    // The pending search must not fire after unmount.
    expect(searchFn).not.toHaveBeenCalled();
  });
});
