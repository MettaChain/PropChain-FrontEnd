import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { errorReporting } from '@/utils/errorReporting';
import { NetworkErrorBoundary } from '@/components/error/NetworkErrorBoundary';

let reloadMock: jest.Mock;

const ThrowOnceNetworkError: React.FC = () => {
  throw new Error('Network connection failed');
};

describe('NetworkErrorBoundary', () => {
  beforeEach(() => {
    reloadMock = jest.fn();

    const originalLocation = window.location;
    // @ts-expect-error -- override location.reload for test purposes
    delete (window as any).location;
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: {
        ...originalLocation,
        reload: reloadMock,
      },
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('renders children normally when no error occurs', () => {
    render(
      <NetworkErrorBoundary>
        <div>Network panel is healthy</div>
      </NetworkErrorBoundary>,
    );

    expect(screen.getByText('Network panel is healthy')).toBeInTheDocument();
  });

  it('renders the built-in network error UI when a child throws', () => {
    render(
      <NetworkErrorBoundary>
        <ThrowOnceNetworkError />
      </NetworkErrorBoundary>,
    );

    expect(screen.getByText(/Network Error/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Reload Page/i })).toBeInTheDocument();
  });

  it('uses the retry button and recovers when attemptRecovery succeeds', async () => {
    const recoverySpy = jest
      .spyOn(errorReporting, 'attemptRecovery')
      .mockResolvedValue(true);

    render(
      <NetworkErrorBoundary enableRetry maxRetries={1}>
        <ThrowOnceNetworkError />
      </NetworkErrorBoundary>,
    );

    const retryButton = screen.getByRole('button', { name: /Retry Connection/i });
    expect(retryButton).toBeInTheDocument();

    fireEvent.click(retryButton);

    await waitFor(() => {
      expect(recoverySpy).toHaveBeenCalled();
    });
  });

  it('shows offline banner when navigator is offline', () => {
    Object.defineProperty(window.navigator, 'onLine', {
      configurable: true,
      get: () => false,
    });

    render(
      <NetworkErrorBoundary>
        <div>Offline test content</div>
      </NetworkErrorBoundary>,
    );

    expect(screen.getByText(/You're offline/i)).toBeInTheDocument();
  });
});
