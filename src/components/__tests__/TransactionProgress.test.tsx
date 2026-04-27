import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TransactionProgress, useTransactionProgress } from '../TransactionProgress';

describe('TransactionProgress', () => {
  it('should render when isOpen is true', () => {
    render(
      <TransactionProgress 
        isOpen={true}
        onClose={jest.fn()}
        transactionHash="0x1234567890abcdef"
      />
    );
    
    expect(screen.getByText('Transaction in Progress')).toBeInTheDocument();
    expect(screen.getByText('Signing Transaction')).toBeInTheDocument();
  });

  it('should not render when isOpen is false', () => {
    render(
      <TransactionProgress 
        isOpen={false}
        onClose={jest.fn()}
      />
    );
    
    expect(screen.queryByText('Transaction in Progress')).not.toBeInTheDocument();
  });

  it('should display transaction hash when provided', () => {
    render(
      <TransactionProgress 
        isOpen={true}
        onClose={jest.fn()}
        transactionHash="0x1234567890abcdef"
      />
    );
    
    expect(screen.getByText(/0x1234...cdef/)).toBeInTheDocument();
  });

  it('should call onClose when close button clicked', async () => {
    const onClose = jest.fn();
    render(
      <TransactionProgress 
        isOpen={true}
        onClose={onClose}
      />
    );
    
    const closeButton = screen.getByText('Close');
    await userEvent.click(closeButton);
    
    expect(onClose).toHaveBeenCalled();
  });
});

describe('useTransactionProgress', () => {
  it('should return initial state', () => {
    const { result } = renderHook(() => useTransactionProgress());
    
    expect(result.current.isOpen).toBe(false);
    expect(result.current.transactionHash).toBeUndefined();
  });

  it('should start transaction', () => {
    const { result } = renderHook(() => useTransactionProgress());
    const hash = '0x1234567890abcdef';
    
    act(() => {
      result.current.startTransaction(hash);
    });
    
    expect(result.current.isOpen).toBe(true);
    expect(result.current.transactionHash).toBe(hash);
  });

  it('should close transaction', () => {
    const { result } = renderHook(() => useTransactionProgress());
    
    act(() => {
      result.current.startTransaction('0x1234567890abcdef');
    });
    
    act(() => {
      result.current.closeTransaction();
    });
    
    expect(result.current.isOpen).toBe(false);
  });
});
