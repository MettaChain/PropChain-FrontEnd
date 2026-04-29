'use client';

import { RouteErrorBoundary } from '@/components/error/RouteErrorBoundary';
import { ErrorFactory } from '@/utils/errorFactory';
import { ErrorCategory } from '@/types/errors';

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <RouteErrorBoundary
      error={ErrorFactory.fromError(error, ErrorCategory.UI, {
        context: {
          route: 'dashboard',
          section: 'portfolio-management',
          digest: error.digest,
        },
      })}
      routeName="Dashboard"
      resetError={reset}
    />
  );
}
