import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';

import { Web3ErrorBoundary } from '@/components/error/Web3ErrorBoundary';

const ThrowError: React.FC = () => {
  throw new Error('Wallet disconnected');
};

describe('Web3ErrorBoundary', () => {
  it('renders children normally when no error occurs', () => {
    render(
      <Web3ErrorBoundary>
        <div>Wallet panel content</div>
      </Web3ErrorBoundary>,
    );

    expect(screen.getByText('Wallet panel content')).toBeInTheDocument();
  });

  it('renders custom fallback UI when a child throws', () => {
    render(
      <Web3ErrorBoundary fallback={<div>Custom fallback content</div>}>
        <ThrowError />
      </Web3ErrorBoundary>,
    );

    expect(screen.getByText('Custom fallback content')).toBeInTheDocument();
  });

  it('renders the built-in Web3 error card and shows reconnect actions when recovery is enabled', () => {
    const originalLocation = window.location;
    const reloadSpy = jest.fn();

    // Replace location.reload for the test environment
    delete (window as any).location;
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: {
        ...originalLocation,
        reload: reloadSpy,
      },
    });

    render(
      <Web3ErrorBoundary enableRetry>
        <ThrowError />
      </Web3ErrorBoundary>,
    );

    expect(screen.getByText(/Blockchain Error/i)).toBeInTheDocument();
    const reconnectButton = screen.getByRole('button', { name: /Reconnect Wallet/i });
    expect(reconnectButton).toBeInTheDocument();

    fireEvent.click(reconnectButton);
    expect(reloadSpy).toHaveBeenCalled();

    Object.defineProperty(window, 'location', {
      configurable: true,
      value: originalLocation,
    });
  });

  it('does not render recovery button when enableRetry is false', () => {
    render(
      <Web3ErrorBoundary enableRetry={false}>
        <ThrowError />
      </Web3ErrorBoundary>,
    );

    expect(screen.getByText(/Blockchain Error/i)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Reconnect Wallet/i })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Reload Page/i })).toBeInTheDocument();
  });
});
