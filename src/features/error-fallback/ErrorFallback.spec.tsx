import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ErrorFallback } from './ErrorFallback';
import { describe, it, expect, vi } from 'vitest';

describe('ErrorFallback', () => {
  const mockReset = vi.fn();

  beforeEach(() => {
    mockReset.mockClear();
  });

  it('renders a friendly error message for network errors', () => {
    const error = new Error('Network Error: Failed to fetch data');
    render(<ErrorFallback error={error} resetErrorBoundary={mockReset} />);
    
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    expect(screen.getByText(/We are having trouble connecting to the network/)).toBeInTheDocument();
  });

  it('calls resetErrorBoundary when Try Again is clicked', () => {
    const error = new Error('Test error');
    render(<ErrorFallback error={error} resetErrorBoundary={mockReset} />);
    
    fireEvent.click(screen.getByText('Try Again'));
    expect(mockReset).toHaveBeenCalledTimes(1);
  });

  it('hides technical details by default when showDetails is true', () => {
    const error = new Error('Cryptic internal error');
    error.stack = 'Error trace here';
    render(<ErrorFallback error={error} resetErrorBoundary={mockReset} showDetails={true} />);
    
    expect(screen.queryByText('Error trace here')).not.toBeInTheDocument();
  });

  it('toggles technical details when Show Details is clicked', () => {
    const error = new Error('Cryptic internal error');
    error.stack = 'Error trace here';
    render(<ErrorFallback error={error} resetErrorBoundary={mockReset} showDetails={true} />);
    
    fireEvent.click(screen.getByText('Show Details'));
    expect(screen.getByText('Error trace here')).toBeInTheDocument();
    expect(screen.getByText('Hide Details')).toBeInTheDocument();
    
    fireEvent.click(screen.getByText('Hide Details'));
    expect(screen.queryByText('Error trace here')).not.toBeInTheDocument();
  });
});
