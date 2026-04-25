'use client';

import { useEffect } from 'react';
import { EnhancedErrorBoundary, ErrorBoundaryPresets } from '@/components/error/EnhancedErrorBoundary';
import { RouteErrorBoundary } from '@/components/error/RouteErrorBoundary';
import type { AppError } from '@/types/errors';
import { ErrorCategory } from '@/types/errors';
import { ErrorFactory } from '@/utils/errorFactory';
import { logger } from '@/utils/logger';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to monitoring service
    const appError = ErrorFactory.fromError(error, ErrorCategory.UI, {
      context: {
        route: 'global',
        digest: error.digest,
      },
    });

    logger.error('Global error boundary caught error:', appError);

    // Send to error reporting service
    fetch('/api/errors', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        errorId: `error-${Date.now()}`,
        category: 'UI',
        severity: 'high',
        message: error.message,
        userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'SSR',
        url: typeof window !== 'undefined' ? window.location.href : 'SSR',
        timestamp: new Date().toISOString(),
        context: {
          digest: error.digest,
          stack: error.stack,
        },
      }),
    }).catch(err => {
      console.error('Failed to report error:', err);
    });
  }, [error]);

  return (
    <RouteErrorBoundary
      error={ErrorFactory.fromError(error, ErrorCategory.UI)}
      routeName="Global"
      resetError={reset}
    />
  );
}
