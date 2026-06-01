'use client';

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { logger } from '@/utils/logger';
import { errorReporting } from '@/utils/errorReporting';
import { NetworkErrorBoundary } from '../NetworkErrorBoundary';

describe('NetworkErrorBoundary', () => {
  beforeEach(() => {
    jest.restoreAllMocks();
  });

  it('renders children when no error occurs', () => {
    render(
      <NetworkErrorBoundary>
        <div>Network OK</div>
      </NetworkErrorBoundary>,
    );

    expect(screen.getByText('Network OK')).toBeInTheDocument();
  });

  it('captures child errors and reports them without using console.log', () => {
    const errorReportSpy = jest.spyOn(errorReporting, 'reportError').mockImplementation(() => undefined);
    const debugSpy = jest.spyOn(logger, 'debug').mockImplementation(() => undefined);
    const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => undefined);
    jest.spyOn(console, 'error').mockImplementation(() => undefined);

    const ProblemChild = () => {
      throw new Error('Simulated network failure');
    };

    render(
      <NetworkErrorBoundary>
        <ProblemChild />
      </NetworkErrorBoundary>,
    );

    expect(screen.getByText('Network Error')).toBeInTheDocument();
    expect(errorReportSpy).toHaveBeenCalled();
    expect(debugSpy).toHaveBeenCalledWith(
      'NetworkErrorBoundary captured an error',
      expect.objectContaining({ error: expect.objectContaining({ message: 'Simulated network failure' }) }),
    );
    expect(consoleLogSpy).not.toHaveBeenCalled();
  });

  it('adds debug logging for online/offline lifecycle events', () => {
    const debugSpy = jest.spyOn(logger, 'debug').mockImplementation(() => undefined);
    // Ensure navigator.onLine exists for JSDOM
    Object.defineProperty(navigator, 'onLine', { value: true, writable: true });

    render(
      <NetworkErrorBoundary>
        <div>Network watcher</div>
      </NetworkErrorBoundary>,
    );

    fireEvent(window, new Event('offline'));
    fireEvent(window, new Event('online'));

    expect(debugSpy).toHaveBeenCalledWith('NetworkErrorBoundary offline event received', { isOnline: false });
    expect(debugSpy).toHaveBeenCalledWith('NetworkErrorBoundary online event received', { isOnline: true });
  });
});
