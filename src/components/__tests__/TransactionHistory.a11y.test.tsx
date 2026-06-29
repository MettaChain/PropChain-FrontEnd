import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { TransactionHistory } from '@/components/TransactionHistory';

jest.mock('@/components/TransactionDetailsModal', () => ({
  TransactionDetailsModal: () => null,
}));

jest.mock('@/hooks/useTransactionQuery', () => ({
  useTransactionHistory: () => ({
    transactions: [
      {
        id: '1',
        hash: '0xabc123',
        type: 'purchase',
        status: 'confirmed',
        from: '0x1111',
        to: '0x2222',
        value: '10',
        gasUsed: '21000',
        gasPrice: '20',
        chainId: 1,
        confirmations: 2,
        description: 'Purchase property',
        propertyId: 'prop-1',
        timestamp: Date.now(),
        error: '',
      },
    ],
    getTransactionsByType: jest.fn((type: string) => []),
    isLoading: false,
    error: null,
    refetch: jest.fn(),
  }),
}));

describe('TransactionHistory accessibility', () => {
  it('updates sortable headers with aria-sort', () => {
    render(<TransactionHistory />);

    const timeHeader = screen.getByRole('columnheader', { name: /time/i });
    expect(timeHeader).toHaveAttribute('aria-sort', 'descending');

    fireEvent.click(timeHeader);
    expect(timeHeader).toHaveAttribute('aria-sort', 'ascending');
  });
});
