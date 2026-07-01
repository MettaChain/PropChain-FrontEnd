'use client';

import { useState, useEffect } from 'react';

const SESSION_DURATION_MS = 30 * 60 * 1000; // 30 minutes
const WARN_BEFORE_MS = 5 * 60 * 1000;       // warn 5 minutes before expiry

interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  userAddress: string | null;
  sessionExpiresAt: number | null;
}

export function useAuth() {
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    isLoading: true,
    userAddress: null,
    sessionExpiresAt: null,
  });

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const hasToken = document.cookie.includes('auth-token=');
        const expiresAt = hasToken ? Date.now() + SESSION_DURATION_MS : null;
        setAuthState({
          isAuthenticated: hasToken,
          isLoading: false,
          userAddress: hasToken ? '0x...' : null,
          sessionExpiresAt: expiresAt,
        });
      } catch {
        setAuthState({
          isAuthenticated: false,
          isLoading: false,
          userAddress: null,
          sessionExpiresAt: null,
        });
      }
    };

    checkAuth();
  }, []);

  return { ...authState, WARN_BEFORE_MS };
}
