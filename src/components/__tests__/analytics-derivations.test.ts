/**
 * #506 — Direct unit tests for the chart-data derivation functions extracted
 * from TransactionAnalytics.
 *
 * The component previously held a single `analyticsData` useMemo. #506
 * refactored it into three independent memos. To make the structural split
 * observable to tests (a black-box render test would still pass if the
 * three memos were re-merged into one), the three computations are exposed
 * as named exports and unit-tested in isolation here:
 *
 *   - `computeStatusChartData`
 *   - `computeTypeChartData`
 *   - `computeVolumeChartData`
 *
 * Each is a pure function: `Transaction[] -> derived array shape`. There
 * is no React, no jsdom, no recharts mock — only data-shape verification.
 * A regression that merges the three derivations into one helper (or that
 * couples them via shared state) cannot pass these tests.
 */

import {
  computeStatusChartData,
  computeTypeChartData,
  computeVolumeChartData,
} from '@/components/TransactionAnalytics';
import type { Transaction } from '@/store/transactionStore';

// The whole point of this file is structural independence. If a future
// refactor aliases one derivation to another the rest of the file still
// passes by accident — only this assertion is the actual lock-in.
it('each derivation is a distinct function object (#506)', () => {
  expect(computeStatusChartData).not.toBe(computeTypeChartData);
  expect(computeStatusChartData).not.toBe(computeVolumeChartData);
  expect(computeTypeChartData).not.toBe(computeVolumeChartData);
});

// Build a Transaction with only the field(s) the assertion under test
// actually inspects. Unspecified fields get valid placeholders so the
// type compiles; the derivations themselves read only what they need.
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

describe('computeStatusChartData (#506)', () => {
  it('returns [] for an empty input', () => {
    expect(computeStatusChartData([])).toEqual([]);
  });

  it('counts by status and ignores tx.type and tx.value', () => {
    const tx = [
      makeTx({ id: 'a', type: 'purchase', status: 'confirmed', value: '999' }),
      makeTx({ id: 'b', type: 'transfer', status: 'confirmed', value: '1' }),
      makeTx({ id: 'c', type: 'purchase', status: 'failed' }),
      makeTx({ id: 'd', type: 'management', status: 'pending' }),
    ];
    const data = computeStatusChartData(tx);
    const counts = Object.fromEntries(data.map((d) => [d.name, d.value]));
    expect(counts.confirmed).toBe(2);
    expect(counts.failed).toBe(1);
    expect(counts.pending).toBe(1);
    // Shape contract: every datum is {name, value}.
    for (const d of data) {
      expect(d).toHaveProperty('name');
      expect(d).toHaveProperty('value');
      expect(typeof d.name).toBe('string');
      expect(typeof d.value).toBe('number');
    }
  });

  it('does not mutate the input array', () => {
    const tx = [
      makeTx({ id: 'a', type: 'purchase', status: 'confirmed' }),
      makeTx({ id: 'b', type: 'transfer', status: 'failed' }),
    ];
    const before = JSON.parse(JSON.stringify(tx));
    computeStatusChartData(tx);
    expect(tx).toEqual(before);
  });
});

describe('computeTypeChartData (#506)', () => {
  it('returns [] for an empty input', () => {
    expect(computeTypeChartData([])).toEqual([]);
  });

  it('counts by type and ignores tx.status and tx.value', () => {
    const tx = [
      makeTx({ id: 'a', type: 'purchase', status: 'confirmed' }),
      makeTx({ id: 'b', type: 'purchase', status: 'failed' }),
      makeTx({ id: 'c', type: 'purchase', status: 'pending' }),
      makeTx({ id: 'd', type: 'transfer', status: 'confirmed' }),
      makeTx({ id: 'e', type: 'management', status: 'cancelled', value: '12345' }),
    ];
    const data = computeTypeChartData(tx);
    const counts = Object.fromEntries(data.map((d) => [d.name, d.value]));
    expect(counts.purchase).toBe(3);
    expect(counts.transfer).toBe(1);
    expect(counts.management).toBe(1);
    for (const d of data) {
      expect(d).toHaveProperty('name');
      expect(d).toHaveProperty('value');
    }
  });

  it('produces a different result than computeStatusChartData on the same input', () => {
    // The two functions must not be accidentally aliased / share state.
    const tx = [
      makeTx({ id: 'a', type: 'purchase', status: 'confirmed' }),
      makeTx({ id: 'b', type: 'transfer', status: 'confirmed' }),
    ];
    const status = computeStatusChartData(tx);
    const type = computeTypeChartData(tx);
    expect(status).toEqual([{ name: 'confirmed', value: 2 }]);
    expect(type).toEqual([
      { name: 'purchase', value: 1 },
      { name: 'transfer', value: 1 },
    ]);
    expect(status).not.toEqual(type);
  });
});

describe('computeVolumeChartData (#506)', () => {
  it('returns [] for an empty input', () => {
    expect(computeVolumeChartData([])).toEqual([]);
  });

  it('aggregates values per day and ignores status/type entirely', () => {
    const tx = [
      makeTx({
        id: 'a',
        type: 'purchase',
        status: 'confirmed',
        value: '10',
        timestamp: Date.parse('2026-06-10T12:00:00Z'),
      }),
      makeTx({
        id: 'b',
        type: 'transfer',
        status: 'failed',
        value: '20',
        timestamp: Date.parse('2026-06-10T12:00:00Z'),
      }),
      makeTx({
        id: 'c',
        type: 'management',
        status: 'pending',
        value: '5.5',
        timestamp: Date.parse('2026-06-11T12:00:00Z'),
      }),
    ];
    expect(computeVolumeChartData(tx)).toEqual([
      { date: '2026-06-10', value: 30 },
      { date: '2026-06-11', value: 5.5 },
    ]);
  });

  it('sorts ascending by date string when input is given out of order', () => {
    const tx = [
      makeTx({
        id: 'late',
        type: 'purchase',
        status: 'confirmed',
        value: '1',
        timestamp: Date.parse('2026-06-12T12:00:00Z'),
      }),
      makeTx({
        id: 'early',
        type: 'purchase',
        status: 'confirmed',
        value: '1',
        timestamp: Date.parse('2026-06-09T12:00:00Z'),
      }),
      makeTx({
        id: 'mid',
        type: 'purchase',
        status: 'confirmed',
        value: '1',
        timestamp: Date.parse('2026-06-10T12:00:00Z'),
      }),
    ];
    expect(computeVolumeChartData(tx).map((d) => d.date)).toEqual([
      '2026-06-09',
      '2026-06-10',
      '2026-06-12',
    ]);
  });

  it('caps to the 30 most recent buckets (newest slice)', () => {
    const tx: Transaction[] = [];
    // 35 day-stride entries; the slice keeps the 30 newest.
    for (let i = 0; i < 35; i++) {
      tx.push(
        makeTx({
          id: `d${i}`,
          type: 'purchase',
          status: 'confirmed',
          value: String(i),
          // Midday UTC keeps `format(date, 'yyyy-MM-dd')` timezone-robust
          // from UTC-12 to UTC+12.
          timestamp: Date.parse('2026-01-01T12:00:00Z') + i * 86_400_000,
        })
      );
    }
    const data = computeVolumeChartData(tx);
    expect(data).toHaveLength(30);
    expect(data[0].date.startsWith('2026-01-06')).toBe(true);
    expect(data.at(-1)?.date.startsWith('2026-02-04')).toBe(true);
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
    expect(computeVolumeChartData(tx)).toEqual([
      { date: '2026-06-10', value: 0 },
    ]);
  });

  it('produces a structurally different result than the count-based slices', () => {
    // The volume datum shape is {date, value}, distinct from the count
    // datum {name, value} used by status/type. If they accidentally
    // shared a code path producing the same shape, the volume result
    // would have `name: <status>` instead of `date:`.
    const tx = [
      makeTx({
        id: 'a',
        type: 'purchase',
        status: 'confirmed',
        value: '7',
        timestamp: Date.parse('2026-06-10T12:00:00Z'),
      }),
    ];
    const volume = computeVolumeChartData(tx);
    expect(volume).toHaveLength(1);
    const datum = volume[0];
    expect(Object.keys(datum).sort()).toEqual(['date', 'value']);
    expect(datum).toEqual({ date: '2026-06-10', value: 7 });
  });
});
