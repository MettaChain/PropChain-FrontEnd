/**
 * @jest-environment jsdom
 *
 * #506 — TransactionAnalytics split-memoization lock-in tests.
 *
 * The component splits a previous single `analyticsData` useMemo into three
 * independent memos (statusChartData, typeChartData, volumeChartData). This
 * file locks in:
 *   1. Each slice computes the correct data given `transactions`.
 *   2. Each memo returns a STABLE REFERENCE across re-renders when the same
 *      `transactions` array reference is passed (memo dep shallow-equal).
 *   3. Each memo returns a NEW REFERENCE when a different `transactions`
 *      array reference is passed (memo invalidation).
 *   4. Edge cases: missing values, same-day aggregation, out-of-order dates,
 *      and the last-30-day window.
 *   5. Loading + empty states route correctly.
 *
 * Implementation notes:
 *  - Recharts primitives are mocked as jest.fn() inside the factory; the
 *    resulting mocks are pulled in via the regular `import { ... } from
 *    'recharts'` so they expose `.mock.calls` for assertions.
 *  - The `<Pie>` element (NOT `<PieChart>`) carries the status data;
 *    `<BarChart>` and `<LineChart>` containers carry their own data.
 *  - All volume test dates use midday UTC so the production
 *    `format(date, 'yyyy-MM-dd')` formatting is timezone-robust from
 *    UTC-12 to UTC+12.
 */

jest.mock('recharts', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports, global-require
  const R = require('react');

  // Components that take a `data` prop (memo output lands on this prop).
  // Each receives its own jest.fn so `.mock.calls` is isolated per chart.
  const dataHolders = {
    BarChart: jest.fn(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (props: any) =>
        R.createElement(
          'div',
          {
            'data-testid': 'mock-bar-chart',
            'data-length': props.data ? props.data.length : 0,
          },
          props.children
        )
    ),
    Pie: jest.fn(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (props: any) =>
        R.createElement(
          'div',
          {
            'data-testid': 'mock-pie',
            'data-length': props.data ? props.data.length : 0,
          },
          props.children
        )
    ),
    LineChart: jest.fn(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (props: any) =>
        R.createElement(
          'div',
          {
            'data-testid': 'mock-line-chart',
            'data-length': props.data ? props.data.length : 0,
          },
          props.children
        )
    ),
  };

  // Plain chart containers / sub-elements — passthrough renders only.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const passthrough = (testid: string) => (props: any) =>
    R.createElement('div', { 'data-testid': testid }, props.children);

  const Cell = jest.fn(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (props: any) =>
      R.createElement(
        'div',
        { 'data-testid': 'mock-cell', 'data-fill': props.fill },
        props.children
      )
  );

  return {
    __esModule: true,
    ...dataHolders,
    PieChart: jest.fn(passthrough('mock-pie-chart')),
    Bar: jest.fn(passthrough('mock-bar')),
    Line: jest.fn(passthrough('mock-line')),
    XAxis: jest.fn(passthrough('mock-xaxis')),
    YAxis: jest.fn(passthrough('mock-yaxis')),
    ResponsiveContainer: jest.fn(passthrough('mock-responsive')),
    Cell,
    Tooltip: jest.fn(() => null),
    Legend: jest.fn(() => null),
  };
});

jest.mock('@/components/ui/chart', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports, global-require
  const R = require('react');
  return {
    __esModule: true,
    ChartContainer: ({
      children,
    }: {
      children?: R.ReactNode;
    }) =>
      R.createElement(
        'div',
        { 'data-testid': 'mock-chart-container' },
        children
      ),
    ChartTooltip: () => null,
    ChartTooltipContent: () => null,
    ChartLegend: () => null,
    ChartLegendContent: () => null,
  };
});

jest.mock('@/components/ui/card', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports, global-require
  const R = require('react');
  const pair = (testid: string) =>
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ({ children }: any) =>
      R.createElement('div', { 'data-testid': testid }, children);
  return {
    __esModule: true,
    Card: pair('mock-card'),
    CardHeader: pair('mock-card-header'),
    CardTitle: pair('mock-card-title'),
    CardContent: pair('mock-card-content'),
  };
});

jest.mock('@/components/ui/EmptyState', () => {
  return {
    __esModule: true,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    EmptyState: ({ title }: any) => {
      // eslint-disable-next-line @typescript-eslint/no-require-imports, global-require
      const R = require('react');
      return R.createElement(
        'div',
        { 'data-testid': 'mock-empty-state', 'data-title': title },
        null
      );
    },
  };
});

import { render, screen } from '@testing-library/react';
// `import { BarChart, … } from 'recharts'` resolves to the jest.mock
// factory's exports, so each entry is a jest.fn whose `.mock.calls` we
// inspect below.
import { BarChart, Pie, LineChart, Cell } from 'recharts';
import { TransactionAnalytics } from '@/components/TransactionAnalytics';
import type { Transaction } from '@/store/transactionStore';

// Build a Transaction with only the fields TransactionAnalytics actually
// inspects (type, status, value, timestamp). The rest is filled with valid
// placeholders so the type compiles; TransactionAnalytics never reads them.
const makeTx = (
  partial: Partial<Transaction> & Pick<Transaction, 'id' | 'status' | 'type'>
): Transaction => ({
  id: partial.id,
  hash: partial.hash ?? '0xhash',
  type: partial.type,
  status: partial.status,
  chainId: partial.chainId ?? 1,
  from: partial.from ?? '0xfrom',
  to: partial.to,
  value: partial.value,
  gasUsed: partial.gasUsed,
  gasPrice: partial.gasPrice,
  confirmations: partial.confirmations ?? 0,
  requiredConfirmations: partial.requiredConfirmations ?? 1,
  timestamp: partial.timestamp ?? Date.parse('2026-06-15'),
  error: partial.error,
  description: partial.description,
  propertyId: partial.propertyId,
});

// Pull the `data` arg of the most recent call to a data-holding chart
// mock. After render+rerender, useMemo'd refs are reused when deps are
// stable, so the reference-equality of the data prop is what locks in
// #506's behaviour.
const lastDataOf = (mock: jest.Mock): unknown => {
  const calls = mock.mock.calls;
  if (calls.length === 0) return undefined;
  const lastProps = calls[calls.length - 1][0] as
    | { data: unknown }
    | undefined;
  return lastProps ? lastProps.data : undefined;
};

beforeEach(() => {
  jest.clearAllMocks();
});

describe('TransactionAnalytics (#506)', () => {
  describe('state routing', () => {
    it('renders nothing when isLoading=true', () => {
      render(<TransactionAnalytics transactions={[]} isLoading />);

      expect(screen.queryByTestId('mock-empty-state')).toBeNull();
      expect(screen.queryByTestId('mock-bar-chart')).toBeNull();
      expect(screen.queryByTestId('mock-pie-chart')).toBeNull();
      expect(screen.queryByTestId('mock-line-chart')).toBeNull();
    });

    it('renders <EmptyState> when not loading and there are no transactions', () => {
      render(<TransactionAnalytics transactions={[]} isLoading={false} />);

      const empty = screen.getByTestId('mock-empty-state');
      expect(empty.getAttribute('data-title')).toBe('No Data Available');
      expect(screen.queryByTestId('mock-bar-chart')).toBeNull();
    });
  });

  describe('status pie chart slice (#506 — statusChartData)', () => {
    it('counts by status, ignoring type and value', () => {
      const tx = [
        makeTx({ id: 't1', type: 'purchase', status: 'confirmed' }),
        makeTx({ id: 't2', type: 'transfer', status: 'confirmed' }),
        makeTx({ id: 't3', type: 'purchase', status: 'failed' }),
      ];
      render(<TransactionAnalytics transactions={tx} isLoading={false} />);

      // Status data lives on <Pie data={...}> inside <PieChart>.
      const data = lastDataOf(Pie) as
        | { name: string; value: number }[]
        | undefined;
      expect(data).toBeDefined();
      const counts = Object.fromEntries(
        (data ?? []).map((d) => [d.name, d.value])
      );
      expect(counts.confirmed).toBe(2);
      expect(counts.failed).toBe(1);
    });

    it('memo preserves reference when transactions array reference is stable', () => {
      const tx = [
        makeTx({ id: 't1', type: 'purchase', status: 'confirmed' }),
        makeTx({ id: 't2', type: 'transfer', status: 'confirmed' }),
      ];
      const { rerender } = render(
        <TransactionAnalytics transactions={tx} isLoading={false} />
      );
      const firstData = lastDataOf(Pie);

      rerender(<TransactionAnalytics transactions={tx} isLoading={false} />);
      const secondData = lastDataOf(Pie);

      expect(firstData).toBe(secondData);
    });

    it('memo produces a new reference when transactions array reference changes', () => {
      const tx1 = [
        makeTx({ id: 't1', type: 'purchase', status: 'confirmed' }),
      ];
      const tx2 = [
        makeTx({ id: 't1', type: 'purchase', status: 'confirmed' }),
        makeTx({ id: 't2', type: 'transfer', status: 'failed' }),
      ];
      const { rerender } = render(
        <TransactionAnalytics transactions={tx1} isLoading={false} />
      );
      const firstData = lastDataOf(Pie);

      rerender(<TransactionAnalytics transactions={tx2} isLoading={false} />);
      const secondData = lastDataOf(Pie);

      expect(firstData).not.toBe(secondData);
    });

    it('stamps the matching chart-config color on at least one cell per status', () => {
      // Two statuses so we test that the correct color lands in each entry
      // regardless of Object.entries iteration order. Verified via both
      // the captured mock calls AND the rendered DOM so a future refactor
      // moving fill derivation off of `<Cell>` (e.g. into `<Pie>`'s label
      // render) will still produce a meaningful failure.
      const tx = [
        makeTx({ id: 't1', type: 'purchase', status: 'confirmed' }),
        makeTx({ id: 't2', type: 'transfer', status: 'failed' }),
      ];
      render(<TransactionAnalytics transactions={tx} isLoading={false} />);

      const fills = Cell.mock.calls.map(
        (c) => (c[0] as { fill: string }).fill
      );
      expect(fills).toContain('#22c55e'); // confirmed green
      expect(fills).toContain('#ef4444'); // failed red

      const renderedFills = screen
        .getAllByTestId('mock-cell')
        .map((el) => el.getAttribute('data-fill'));
      expect(renderedFills).toEqual(expect.arrayContaining(fills));
    });
  });

  describe('type bar chart slice (#506 — typeChartData)', () => {
    it('counts by type, ignoring status and value', () => {
      const tx = [
        makeTx({ id: 't1', type: 'purchase', status: 'confirmed' }),
        makeTx({ id: 't2', type: 'purchase', status: 'failed' }),
        makeTx({ id: 't3', type: 'management', status: 'pending' }),
      ];
      render(<TransactionAnalytics transactions={tx} isLoading={false} />);

      // Type data lives on <BarChart data={...}>.
      const data = lastDataOf(BarChart) as
        | { name: string; value: number }[]
        | undefined;
      expect(data).toBeDefined();
      const counts = Object.fromEntries(
        (data ?? []).map((d) => [d.name, d.value])
      );
      expect(counts.purchase).toBe(2);
      expect(counts.management).toBe(1);
    });

    it('memo preserves reference when transactions array reference is stable', () => {
      const tx = [makeTx({ id: 't1', type: 'purchase', status: 'confirmed' })];
      const { rerender } = render(
        <TransactionAnalytics transactions={tx} isLoading={false} />
      );
      const firstData = lastDataOf(BarChart);

      rerender(<TransactionAnalytics transactions={tx} isLoading={false} />);
      const secondData = lastDataOf(BarChart);

      expect(firstData).toBe(secondData);
    });

    it('memo produces a new reference when transactions array reference changes', () => {
      const tx1 = [makeTx({ id: 't1', type: 'purchase', status: 'confirmed' })];
      const tx2 = [makeTx({ id: 't1', type: 'transfer', status: 'confirmed' })];
      const { rerender } = render(
        <TransactionAnalytics transactions={tx1} isLoading={false} />
      );
      const firstData = lastDataOf(BarChart);

      rerender(<TransactionAnalytics transactions={tx2} isLoading={false} />);
      const secondData = lastDataOf(BarChart);

      expect(firstData).not.toBe(secondData);
    });
  });

  describe('volume line chart slice (#506 — volumeChartData)', () => {
    it('aggregates by date and ignores status/type', () => {
      const tx = [
        makeTx({
          id: 't1',
          type: 'purchase',
          status: 'confirmed',
          value: '10',
          timestamp: Date.parse('2026-06-10T12:00:00Z'),
        }),
        makeTx({
          id: 't2',
          type: 'transfer',
          status: 'failed',
          value: '20',
          timestamp: Date.parse('2026-06-10T12:00:00Z'),
        }),
        makeTx({
          id: 't3',
          type: 'purchase',
          status: 'confirmed',
          value: '5',
          timestamp: Date.parse('2026-06-11T12:00:00Z'),
        }),
      ];
      render(<TransactionAnalytics transactions={tx} isLoading={false} />);

      // Volume data lives on <LineChart data={...}>.
      const data = lastDataOf(LineChart) as
        | { date: string; value: number }[]
        | undefined;
      expect(data).toEqual([
        { date: '2026-06-10', value: 30 },
        { date: '2026-06-11', value: 5 },
      ]);
    });

    it('sorts entries ascending by date when input is given out of order', () => {
      const tx = [
        makeTx({
          id: 'late',
          type: 'transfer',
          status: 'confirmed',
          value: '1',
          timestamp: Date.parse('2026-06-12T12:00:00Z'),
        }),
        makeTx({
          id: 'early',
          type: 'transfer',
          status: 'confirmed',
          value: '2',
          timestamp: Date.parse('2026-06-09T12:00:00Z'),
        }),
        makeTx({
          id: 'mid',
          type: 'transfer',
          status: 'confirmed',
          value: '3',
          timestamp: Date.parse('2026-06-10T12:00:00Z'),
        }),
      ];
      render(<TransactionAnalytics transactions={tx} isLoading={false} />);

      const data = lastDataOf(LineChart) as
        | { date: string; value: number }[]
        | undefined;
      expect(data?.map((d) => d.date)).toEqual([
        '2026-06-09',
        '2026-06-10',
        '2026-06-12',
      ]);
    });

    it('caps the output at the last 30 days (newest slice)', () => {
      const tx: Transaction[] = [];
      // Build 35 distinct-day entries. Day 0 = oldest, day 34 = newest.
      // The chart should keep the 30 most recent (days 5..34) via
      // `.slice(-30)`. The first entry must be day 5 = 2026-01-06 and the
      // last entry must be day 34 = 2026-02-04 (UTC). Both bounds asserted
      // so a future flip to `slice(0, 30)` would fail loudly.
      for (let i = 0; i < 35; i++) {
        tx.push(
          makeTx({
            id: `d${i}`,
            type: 'purchase',
            status: 'confirmed',
            value: String(i),
            timestamp: Date.parse('2026-01-01T12:00:00Z') + i * 86_400_000,
          })
        );
      }
      render(<TransactionAnalytics transactions={tx} isLoading={false} />);

      const data = lastDataOf(LineChart) as
        | { date: string; value: number }[]
        | undefined;
      expect(data).toHaveLength(30);
      expect(data?.[0]?.date.startsWith('2026-01-06')).toBe(true);
      expect(data?.at(-1)?.date.startsWith('2026-02-04')).toBe(true);
    });

    it('does not produce NaN when value is undefined or empty', () => {
      const tx = [
        makeTx({
          id: 'a',
          type: 'purchase',
          status: 'confirmed',
          value: undefined,
          timestamp: Date.parse('2026-06-10T12:00:00Z'),
        }),
        makeTx({
          id: 'b',
          type: 'purchase',
          status: 'confirmed',
          value: '',
          timestamp: Date.parse('2026-06-10T12:00:00Z'),
        }),
      ];
      render(<TransactionAnalytics transactions={tx} isLoading={false} />);

      // Pinned behaviour of the production memo: `parseFloat(tx.value || '0')`
      // short-circuits undefined and '' to 0 instead of NaN.
      const data = lastDataOf(LineChart) as
        | { date: string; value: number }[]
        | undefined;
      expect(data).toEqual([{ date: '2026-06-10', value: 0 }]);
    });

    it('memo preserves reference when transactions array reference is stable', () => {
      const tx = [
        makeTx({
          id: 't1',
          type: 'purchase',
          status: 'confirmed',
          value: '1',
          timestamp: Date.parse('2026-06-10T12:00:00Z'),
        }),
      ];
      const { rerender } = render(
        <TransactionAnalytics transactions={tx} isLoading={false} />
      );
      const firstData = lastDataOf(LineChart);

      rerender(<TransactionAnalytics transactions={tx} isLoading={false} />);
      const secondData = lastDataOf(LineChart);

      expect(firstData).toBe(secondData);
    });

    it('memo produces a new reference when transactions array reference changes', () => {
      const tx1 = [
        makeTx({
          id: 't1',
          type: 'purchase',
          status: 'confirmed',
          value: '1',
          timestamp: Date.parse('2026-06-10T12:00:00Z'),
        }),
      ];
      const tx2 = [
        makeTx({
          id: 't1',
          type: 'purchase',
          status: 'confirmed',
          value: '2',
          timestamp: Date.parse('2026-06-10T12:00:00Z'),
        }),
      ];
      const { rerender } = render(
        <TransactionAnalytics transactions={tx1} isLoading={false} />
      );
      const firstData = lastDataOf(LineChart);

      rerender(<TransactionAnalytics transactions={tx2} isLoading={false} />);
      const secondData = lastDataOf(LineChart);

      expect(firstData).not.toBe(secondData);
    });
  });
});
