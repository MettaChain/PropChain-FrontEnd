/**
 * @jest-environment jsdom
 *
 * #505 + #506: TransactionHistory must render without statically importing
 * recharts/xlsx (#505 code-split), and the analytics tab must mount the
 * lazy TransactionAnalytics component (#506 split memoisation lives there).
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
  // eslint-disable-next-line @typescript-eslint/no-require-imports, global-require
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
  useTransactionHistory: () => ({
    transactions: [
      {
        id: 'tx-1',
        hash: '0xabc',
        type: 'purchase',
        status: 'confirmed',
        from: '0xfrom',
        to: '0xto',
        timestamp: Date.parse('2026-06-28'),
        chainId: 1,
        confirmations: 12,
      },
    ],
    getTransactionsByType: () => [],
    isLoading: false,
    error: null,
    refetch: jest.fn(),
  }),
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

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
// eslint-disable-next-line @typescript-eslint/no-require-imports, global-require
const nextDynamic = require('next/dynamic');

describe('TransactionHistory (#505 + #506)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('uses next/dynamic with ssr:false for the analytics tab (#505)', async () => {
    const { TransactionHistory } = await import('@/components/TransactionHistory');
    render(<TransactionHistory />);

    expect(nextDynamic.default).toHaveBeenCalled();
    const lastCall =
      nextDynamic.default.mock.calls[
        nextDynamic.default.mock.calls.length - 1
      ];
    // ssr:false is what keeps recharts out of the SSR bundle and out of the
    // initial client JS chunk.
    expect(lastCall[1]).toMatchObject({ ssr: false });
  });

  it('dynamically imports xlsx on Excel export (#505)', async () => {
    const { TransactionHistory } = await import('@/components/TransactionHistory');
    render(<TransactionHistory />);

    const excelButton = screen.getByRole('button', { name: /exportExcel/i });
    fireEvent.click(excelButton);

    await waitFor(() => {
      // The captured inner mock fn from the top-level jest.mock factory
      // fires only if the production code's `await import('xlsx')` resolves
      // to the mock.
      expect(xlsxJsonToSheet).toHaveBeenCalled();
      expect(xlsxBookAppendSheet).toHaveBeenCalled();
      expect(xlsxWrite).toHaveBeenCalled();
    });
  });
});
