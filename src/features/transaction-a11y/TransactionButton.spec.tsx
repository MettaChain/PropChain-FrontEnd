import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { TransactionButton } from './TransactionButton';

import { useTransactionA11yStore } from './transactionA11yStore';

describe('TransactionButton', () => {
  beforeEach(() => {
    useTransactionA11yStore.getState().reset();
  });

  it('renders with initial label', () => {
    render(<TransactionButton onClick={jest.fn()} label="Sign Transaction" />);
    expect(screen.getByText('Sign Transaction')).toBeInTheDocument();
  });

  it('updates aria-busy and label during pending state', async () => {
    // Create a promise that we can resolve manually
    let resolvePromise: () => void;
    const mockOnClick = () => new Promise<void>((resolve) => {
      resolvePromise = resolve;
    });
    
    render(<TransactionButton onClick={mockOnClick} label="Submit" loadingLabel="Working..." />);
    
    const button = screen.getByRole('button');
    fireEvent.click(button);
    
    // Check pending state
    expect(button).toHaveAttribute('aria-busy', 'true');
    expect(screen.getByText('Working...')).toBeInTheDocument();
    
    // Check live region
    const liveRegion = screen.getByTestId('transaction-live-region');
    expect(liveRegion).toHaveTextContent(/processing/i);
    
    // Resolve the promise to clean up
    resolvePromise!();
    await waitFor(() => {
      expect(button).toHaveAttribute('aria-busy', 'false');
    });
  });

  it('shows success state after successful resolution', async () => {
    const mockOnClick = () => Promise.resolve();
    render(<TransactionButton onClick={mockOnClick} label="Submit" successLabel="Done!" />);
    
    fireEvent.click(screen.getByRole('button'));
    
    await waitFor(() => {
      expect(screen.getByText('Done!')).toBeInTheDocument();
      expect(screen.getByTestId('transaction-live-region')).toHaveTextContent(/successfully/i);
    });
  });

  it('shows error state after rejection', async () => {
    const mockOnClick = () => Promise.reject(new Error('Failed'));
    render(<TransactionButton onClick={mockOnClick} label="Submit" errorLabel="Error" />);
    
    fireEvent.click(screen.getByRole('button'));
    
    await waitFor(() => {
      expect(screen.getByText('Error')).toBeInTheDocument();
      expect(screen.getByTestId('transaction-live-region')).toHaveTextContent(/failed/i);
    });
  });
});
