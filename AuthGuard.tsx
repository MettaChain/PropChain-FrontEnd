'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Loader2 } from 'lucide-react';

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading, sessionExpiresAt, WARN_BEFORE_MS } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [showTimeoutWarning, setShowTimeoutWarning] = useState(false);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push(`/?callbackUrl=${encodeURIComponent(pathname)}`);
    }
  }, [isLoading, isAuthenticated, router, pathname]);

  // Schedule a warning announcement 5 minutes before session expiry
  useEffect(() => {
    if (!sessionExpiresAt) return;

    const warnAt = sessionExpiresAt - WARN_BEFORE_MS;
    const delay = warnAt - Date.now();

    if (delay <= 0) return;

    const warningTimer = setTimeout(() => setShowTimeoutWarning(true), delay);
    const expireTimer = setTimeout(() => setShowTimeoutWarning(false), sessionExpiresAt - Date.now());

    return () => {
      clearTimeout(warningTimer);
      clearTimeout(expireTimer);
    };
  }, [sessionExpiresAt, WARN_BEFORE_MS]);

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <>
      {/* aria-live region is always mounted so SR picks up dynamic content changes */}
      <div
        role="alert"
        aria-live="assertive"
        aria-atomic="true"
        className="sr-only"
      >
        {showTimeoutWarning
          ? 'Your session will expire in 5 minutes. Please save your work.'
          : ''}
      </div>
      {children}
    </>
  );
}
