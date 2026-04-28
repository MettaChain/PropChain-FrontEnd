'use client';

import { RouteErrorBoundary } from '@/components/error/RouteErrorBoundary';
import { ErrorFactory } from '@/utils/errorFactory';
import { ErrorCategory } from '@/types/errors';

export default function PropertiesError({
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
          route: 'properties',
          section: 'property-listing',
          digest: error.digest,
        },
      })}
      routeName="Properties"
      resetError={reset}
    />
  );
}
