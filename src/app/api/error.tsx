'use client';

import { RouteErrorBoundary } from '@/components/error/RouteErrorBoundary';
import { ErrorFactory } from '@/utils/errorFactory';
import { ErrorCategory } from '@/types/errors';

export default function APIError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <RouteErrorBoundary
      error={ErrorFactory.fromError(error, ErrorCategory.NETWORK, {
        context: {
          route: 'api',
          section: 'api-routes',
          digest: error.digest,
        },
      })}
      routeName="API Routes"
      resetError={reset}
    />
  );
}
