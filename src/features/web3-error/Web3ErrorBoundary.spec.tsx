import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { Web3ErrorBoundary } from './Web3ErrorBoundary';
import { describe, it, expect, vi } from 'vitest';

// A component that intentionally throws an error
const ThrowError = ({ message }: { message: string }) => {
  throw new Error(message);
};

describe('Web3ErrorBoundary', () => {
  const originalConsoleError = console.error;
  
  beforeAll(() => {
    // Suppress console.error in tests to keep output clean
    console.error = vi.fn();
  });
  
  afterAll(() => {
    console.error = originalConsoleError;
  });

  it('renders children when there is no error', () => {
    render(
      <Web3ErrorBoundary>
        <div data-testid="child">Safe Content</div>
      </Web3ErrorBoundary>
    );
    
    expect(screen.getByTestId('child')).toBeInTheDocument();
  });

  it('renders default fallback UI when a web3 error occurs', () => {
    render(
      <Web3ErrorBoundary>
        <ThrowError message="insufficient funds for gas" />
      </Web3ErrorBoundary>
    );
    
    expect(screen.getByText('Web3 Transaction Failed')).toBeInTheDocument();
    expect(screen.getByText('insufficient funds for gas')).toBeInTheDocument();
  });

  it('renders custom fallback if provided', () => {
    render(
      <Web3ErrorBoundary fallback={<div data-testid="custom-fallback">Custom Error View</div>}>
        <ThrowError message="wallet disconnected" />
      </Web3ErrorBoundary>
    );
    
    expect(screen.getByTestId('custom-fallback')).toBeInTheDocument();
  });
});
