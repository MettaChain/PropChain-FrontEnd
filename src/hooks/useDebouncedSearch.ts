import { useCallback, useEffect, useRef, useState } from 'react';

export interface UseDebouncedSearchOptions<T> {
  searchFn: (query: string, signal?: AbortSignal) => Promise<T>;
  delay?: number;
  minLength?: number;
  initialResults?: T;
}

export interface UseDebouncedSearchReturn<T> {
  query: string;
  setQuery: (query: string) => void;
  results: T | undefined;
  isLoading: boolean;
  error: Error | null;
  clear: () => void;
}

export function useDebouncedSearch<T>({
  searchFn,
  delay = 300,
  minLength = 0,
  initialResults,
}: UseDebouncedSearchOptions<T>): UseDebouncedSearchReturn<T> {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<T | undefined>(initialResults);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const abortControllerRef = useRef<AbortController | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const latestQueryRef = useRef(query);

  useEffect(() => {
    latestQueryRef.current = query;
  }, [query]);

  const search = useCallback(
    async (searchQuery: string) => {
      if (searchQuery.length < minLength) {
        setResults(initialResults);
        setIsLoading(false);
        return;
      }

      abortControllerRef.current?.abort();
      abortControllerRef.current = new AbortController();
      const signal = abortControllerRef.current.signal;

      setIsLoading(true);
      setError(null);

      try {
        const data = await searchFn(searchQuery, signal);
        if (!signal.aborted && latestQueryRef.current === searchQuery) {
          setResults(data);
        }
      } catch (err) {
        if (!signal.aborted) {
          setError(err instanceof Error ? err : new Error(String(err)));
        }
      } finally {
        if (!signal.aborted) {
          setIsLoading(false);
        }
      }
    },
    [searchFn, minLength, initialResults]
  );

  useEffect(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    if (query.length >= minLength) {
      setIsLoading(true);
      timeoutRef.current = setTimeout(() => {
        search(query);
      }, delay);
    } else {
      setResults(initialResults);
      setIsLoading(false);
      abortControllerRef.current?.abort();
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [query, delay, minLength, search, initialResults]);

  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const clear = useCallback(() => {
    setQuery('');
    setResults(initialResults);
    setError(null);
    abortControllerRef.current?.abort();
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
  }, [initialResults]);

  return {
    query,
    setQuery,
    results,
    isLoading,
    error,
    clear,
  };
}
