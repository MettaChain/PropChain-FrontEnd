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
        const tokenMatch = document.cookie.match(/auth-token=([^;]+)/);
        const token = tokenMatch ? tokenMatch[1] : null;
        let isValid = false;
        let expiresAt = null;
        let address = null;

        if (token) {
          try {
            const payloadBase64 = token.split('.')[1];
            if (payloadBase64) {
              const payload = JSON.parse(atob(payloadBase64));
              if (payload.exp && payload.exp * 1000 > Date.now()) {
                isValid = true;
                expiresAt = payload.exp * 1000;
                address = payload.address || '0x...';
              }
            }
          } catch (e) {
            // Invalid token format
          }
        }

        setAuthState({
          isAuthenticated: isValid,
          isLoading: false,
          userAddress: address,
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
