import { useState, useCallback } from 'react';
import { getCsrfToken, clearCsrfToken } from '@/lib/csrfClient';

export interface UseApiMutationResult<T = any> {
  mutate: (url: string, options?: RequestInit) => Promise<T>;
  loading: boolean;
  error: Error | null;
}

/**
 * A custom hook for performing write mutations (POST/PUT/DELETE) to APIs.
 * Automatically injects the CSRF token into headers and retries once on token mismatch.
 */
export function useApiMutation<T = any>(): UseApiMutationResult<T> {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const mutate = useCallback(async (url: string, options: RequestInit = {}): Promise<T> => {
    setLoading(true);
    setError(null);
    try {
      const token = await getCsrfToken().catch(() => null);
      const headers = new Headers(options.headers || {});
      if (token) {
        headers.set('X-CSRF-Token', token);
      }

      let response = await fetch(url, {
        ...options,
        headers,
      });

      if (response.status === 403) {
        // Token might have expired or rotated, clear cache and retry once
        clearCsrfToken();
        const newToken = await getCsrfToken().catch(() => null);
        if (newToken) {
          headers.set('X-CSRF-Token', newToken);
          response = await fetch(url, {
            ...options,
            headers,
          });
        }
      }

      if (!response.ok) {
        throw new Error(`Request failed with status ${response.status}`);
      }

      const data = await response.json();
      setLoading(false);
      return data as T;
    } catch (err: any) {
      const actualError = err instanceof Error ? err : new Error(String(err));
      setError(actualError);
      setLoading(false);
      throw actualError;
    }
  }, []);

  return { mutate, loading, error };
}
