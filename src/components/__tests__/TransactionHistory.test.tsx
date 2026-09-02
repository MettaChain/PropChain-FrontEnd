/**
 * @jest-environment jsdom
 *
 * #505 + #506: TransactionHistory must render without statically importing
 * recharts/xlsx (#505 code-split), and the analytics tab must mount the
 * lazy TransactionAnalytics component (#506 split memoisation lives there).
 * Also covers #502 virtualization of large transaction lists.
 */

// Capture the inner mock fns at jest.mock() factory evaluation time so the
// tests can assert against them after the production code dynamically
// imports the mocked xlsx module.
const xlsxJsonToSheet = jest.fn(() => ({}));
const xlsxBookNew = jest.fn(() => ({}));
const xlsxBookAppendSheet = jest.fn();
const xlsxWrite = jest.fn(() => new ArrayBuffer(8));

jest.mock('next/dynamic', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports, global-require
  const React = require('react');
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const dynamicSpy = jest.fn(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (loader: () => Promise<any>, opts?: { ssr?: boolean; loading?: () => unknown }) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const LazyComp: React.FC<any> = (props) => {
        const [Comp, setComp] = React.useState<React.ComponentType | null>(null);
        React.useEffect(() => {
          let mounted = true;
          loader().then((mod) => {
            const resolved =
              (mod as { default?: React.ComponentType }).default ??
              (mod as unknown as React.ComponentType);
            if (mounted) setComp(() => resolved);
          });
          return () => {
            mounted = false;
          };
        }, []);
        return Comp
          ? React.createElement(Comp, props)
          : opts?.loading
            ? opts.loading()
            : null;
      };
      return LazyComp;
    }
  );
  return {
    __esModule: true,
    default: dynamicSpy,
  };
});

jest.mock('next/link', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports, global-require
  const React = require('react');
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return ({ children, ...rest }: any) =>
    React.createElement('a', rest, children);
});

jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (k: string) => k, i18n: { dir: () => 'ltr' } }),
}));

jest.mock('@/hooks/useTransactionQuery', () => ({
  useTransactionHistory: jest.fn(),
}));

jest.mock('@/components/TransactionDetailsModal', () => ({
  TransactionDetailsModal: () => null,
}));

jest.mock('@/components/TransactionAnalytics', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports, global-require
  const React = require('react');
  return {
    __esModule: true,
    TransactionAnalytics: (props: { transactions: unknown[]; isLoading: boolean }) =>
      React.createElement(
        'div',
        { 'data-testid': 'transaction-analytics' },
        React.createElement(
          'h2',
          null,
          'Transaction Status Distribution'
        ),
        React.createElement(
          'div',
          null,
          `count=${(props.transactions as unknown[]).length}, loading=${String(props.isLoading)}`
        )
      ),
  };
});

jest.mock('xlsx', () => ({
  __esModule: true,
  default: {
    utils: {
      json_to_sheet: xlsxJsonToSheet,
      book_new: xlsxBookNew,
      book_append_sheet: xlsxBookAppendSheet,
    },
    write: xlsxWrite,
  },
  utils: {
    json_to_sheet: xlsxJsonToSheet,
    book_new: xlsxBookNew,
    book_append_sheet: xlsxBookAppendSheet,
  },
  write: xlsxWrite,
}));

jest.mock('@tanstack/react-virtual', () => ({
  useVirtualizer: jest.fn(({ count, estimateSize }: { count: number; estimateSize: () => number }) => ({
    getVirtualItems: () =>
      Array.from({ length: Math.min(count, 10) }, (_, i) => ({
        index: i,
        start: i * estimateSize(),
        end: (i + 1) * estimateSize(),
        size: estimateSize(),
        key: i,
        lane: 0,
      })),
    getTotalSize: () => count * estimateSize(),
  })),
}));

global.ResizeObserver = class {
  observe() {}
  unobserve() {}
  disconnect() {}
};

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
// eslint-disable-next-line @typescript-eslint/no-require-imports, global-require
const nextDynamic = require('next/dynamic');
import { useTransactionHistory } from '@/hooks/useTransactionQuery';
import type { Transaction } from '@/store/transactionStore';

function makeTx(i: number): Transaction {
  return {
    id: `tx-${i}`,
    hash: `0x${'a'.repeat(60)}${String(i).padStart(4, '0')}`,
    type: 'purchase',
    status: 'confirmed',
    from: `0x${'b'.repeat(64)}`,
    to: `0x${'c'.repeat(64)}`,
    value: String(i * 0.1),
    gasUsed: '21000',
    gasPrice: '20',
    timestamp: Date.now() - i * 1000,
    chainId: 1,
    confirmations: 12,
    blockNumber: 1000 + i,
  };
}

const mockTransactions = Array.from({ length: 50 }, (_, i) => makeTx(i));

beforeEach(() => {
  jest.clearAllMocks();
  (useTransactionHistory as jest.Mock).mockReturnValue({
    transactions: mockTransactions,
    getTransactionsByType: (type: string) => mockTransactions.filter((t) => t.type === type),
    isLoading: false,
    error: null,
    refetch: jest.fn(),
  });
});

describe('TransactionHistory (#505 + #506)', () => {
  it('uses next/dynamic with ssr:false for the analytics tab (#505)', async () => {
    const { TransactionHistory } = await import('@/components/TransactionHistory');
    render(<TransactionHistory />);

    expect(nextDynamic.default).toHaveBeenCalled();
    const lastCall =
      nextDynamic.default.mock.calls[
        nextDynamic.default.mock.calls.length - 1
      ];
    expect(lastCall[1]).toMatchObject({ ssr: false });
  });

  it('dynamically imports xlsx on Excel export (#505)', async () => {
    const { TransactionHistory } = await import('@/components/TransactionHistory');
    render(<TransactionHistory />);

    const excelButton = screen.getByRole('button', { name: /exportExcel/i });
    fireEvent.click(excelButton);

    await waitFor(() => {
      expect(xlsxJsonToSheet).toHaveBeenCalled();
      expect(xlsxBookAppendSheet).toHaveBeenCalled();
      expect(xlsxWrite).toHaveBeenCalled();
    });
  });
});

describe('TransactionHistory – virtualization (#502)', () => {
  it('renders the transaction list container', async () => {
    const { TransactionHistory } = await import('@/components/TransactionHistory');
    render(<TransactionHistory />);
    expect(screen.getByTestId('transaction-list')).toBeInTheDocument();
  });

  it('renders only virtualised rows — not all 50 at once', async () => {
    const { TransactionHistory } = await import('@/components/TransactionHistory');
    render(<TransactionHistory />);
    const rows = screen.getAllByTestId('transaction-item');
    expect(rows.length).toBeLessThan(50);
    expect(rows.length).toBeGreaterThan(0);
  });
});
