'use client';

import React from 'react';
import { render, screen } from '@testing-library/react';
import { Web3ErrorBoundary } from '../Web3ErrorBoundary';
import { errorReporting } from '@/utils/errorReporting';

describe('Web3ErrorBoundary', () => {
  beforeEach(() => {
    jest.restoreAllMocks();
    jest.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  it('renders child content when no error occurs', () => {
    render(
      <Web3ErrorBoundary>
        <div>Wallet connected</div>
      </Web3ErrorBoundary>,
    );

    expect(screen.getByText('Wallet connected')).toBeInTheDocument();
  });

  it('catches render errors and displays the blockchain error UI', () => {
    const reportErrorSpy = jest
      .spyOn(errorReporting, 'reportError')
      .mockImplementation(() => undefined);

    const ProblemChild = () => {
      throw new Error('Simulated wallet connection failure');
    };

    render(
      <Web3ErrorBoundary enableRetry maxRetries={3}>
        <ProblemChild />
      </Web3ErrorBoundary>,
    );

    expect(screen.getByText('Blockchain Error')).toBeInTheDocument();
    expect(reportErrorSpy).toHaveBeenCalled();
    expect(screen.getByRole('button', { name: /Reconnect Wallet/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Reload Page/i })).toBeInTheDocument();
  });

  it('renders custom fallback content when fallback prop is provided', () => {
    const ProblemChild = () => {
      throw new Error('Simulated fallback error');
    };

    render(
      <Web3ErrorBoundary fallback={<div>Custom fallback UI</div>}>
        <ProblemChild />
      </Web3ErrorBoundary>,
    );

    expect(screen.getByText('Custom fallback UI')).toBeInTheDocument();
  });
});
