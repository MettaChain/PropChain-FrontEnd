let globalCsrfToken: string | null = null;
let isFetching = false;
let tokenPromise: Promise<string> | null = null;

/**
 * Retrieves the current CSRF token from the server, caching it in memory.
 */
export async function getCsrfToken(): Promise<string> {
  if (globalCsrfToken) return globalCsrfToken;
  if (tokenPromise) return tokenPromise;

  isFetching = true;
  tokenPromise = fetch('/api/security/csrf')
    .then((res) => {
      if (!res.ok) throw new Error('Failed to fetch CSRF token');
      return res.json();
    })
    .then((data) => {
      globalCsrfToken = data.csrfToken;
      isFetching = false;
      tokenPromise = null;
      return data.csrfToken as string;
    })
    .catch((err) => {
      isFetching = false;
      tokenPromise = null;
      throw err;
    });

  return tokenPromise;
}

/**
 * Clears the cached CSRF token, forcing the next mutation to retrieve a new one.
 */
export function clearCsrfToken() {
  globalCsrfToken = null;
}

// Automatically subscribe to wallet changes to rotate the token on auth state change
import { useWalletStore } from '@/store/walletStore';

if (typeof window !== 'undefined' && useWalletStore && typeof useWalletStore.subscribe === 'function') {
  let lastAddress: string | null = null;
  useWalletStore.subscribe((state) => {
    if (state && state.address !== lastAddress) {
      lastAddress = state.address;
      clearCsrfToken();
    }
  });
}
