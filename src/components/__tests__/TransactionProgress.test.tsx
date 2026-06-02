import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { act, renderHook } from '@testing-library/react';
import { vi, describe, it, expect } from 'vitest';
import { TransactionProgress, useTransactionProgress } from '../TransactionProgress';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        'transactionProgress.title': 'Transaction in Progress',
        'transactionProgress.overallProgress': 'Overall Progress',
        'transactionProgress.blockConfirmations': 'Block Confirmations',
        'transactionProgress.securedByBlockchain': 'Secured by blockchain',
        'transactionProgress.closeAria': 'Close transaction progress',
        'transactionProgress.close': 'Close',
        'transactionProgress.processing': 'Processing...',
      };
      return translations[key] || key;
    },
    i18n: { language: 'en' },
  }),
}));

describe('TransactionProgress', () => {
  it('should render when isOpen is true', () => {
    render(
      <TransactionProgress 
        isOpen={true}
        onClose={vi.fn()}
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
        onClose={vi.fn()}
      />
    );
    
    expect(screen.queryByText('Transaction in Progress')).not.toBeInTheDocument();
  });

  it('should display transaction hash when provided', () => {
    render(
      <TransactionProgress 
        isOpen={true}
        onClose={vi.fn()}
        transactionHash="0x1234567890abcdef"
      />
    );
    
    expect(screen.getByText(/0x12345678\.\.\.90abcdef/)).toBeInTheDocument();
  });

  it('should call onClose when close button clicked', async () => {
    const onClose = vi.fn();
    render(
      <TransactionProgress 
        isOpen={true}
        onClose={onClose}
      />
    );
    
    const closeButton = screen.getByLabelText('Close transaction progress');
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
