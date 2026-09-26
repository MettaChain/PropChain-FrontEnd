/**
 * Tests for the canonical compare store (#1090).
 *
 * Replaces the separate compareStore / comparisonStore / comparisonHistoryStore
 * suites. Both slices are covered here because the point of the merge is that
 * selection and history can no longer disagree with each other.
 */
import type { Property } from '@/types/property';
import { MAX_COMPARE, MAX_HISTORY, useCompareStore } from '../compareStore';

const propertyFixture = (id: string): Property =>
  ({
    id,
    name: `Property ${id}`,
    price: { total: 100_000, currency: 'USD' },
  }) as unknown as Property;

const reset = () =>
  useCompareStore.setState({ selectedIds: [], propertyCache: {}, history: [] });

describe('selection slice', () => {
  beforeEach(reset);

  it('starts empty', () => {
    const state = useCompareStore.getState();
    expect(state.selectedIds).toEqual([]);
    expect(state.getSelectedProperties()).toEqual([]);
  });

  it('adds by id', () => {
    useCompareStore.getState().addProperty('a');
    expect(useCompareStore.getState().selectedIds).toEqual(['a']);
  });

  it('adds by property and caches the object', () => {
    useCompareStore.getState().addProperty(propertyFixture('a'));

    const state = useCompareStore.getState();
    expect(state.selectedIds).toEqual(['a']);
    expect(state.getSelectedProperties()).toHaveLength(1);
    expect(state.getSelectedProperties()[0].name).toBe('Property a');
  });

  it('ignores a duplicate', () => {
    const store = useCompareStore.getState();
    store.addProperty('a');
    store.addProperty('a');
    expect(useCompareStore.getState().selectedIds).toEqual(['a']);
  });

  it('caps the selection at MAX_COMPARE', () => {
    const store = useCompareStore.getState();
    for (const id of ['a', 'b', 'c', 'd']) store.addProperty(id);

    expect(useCompareStore.getState().selectedIds).toHaveLength(MAX_COMPARE);
    expect(useCompareStore.getState().selectedIds).not.toContain('d');
  });

  it('removes by id and by property alike', () => {
    const store = useCompareStore.getState();
    store.addProperty(propertyFixture('a'));
    store.addProperty(propertyFixture('b'));

    useCompareStore.getState().removeProperty('a');
    expect(useCompareStore.getState().selectedIds).toEqual(['b']);

    useCompareStore.getState().removeProperty(propertyFixture('b'));
    expect(useCompareStore.getState().selectedIds).toEqual([]);
  });

  it('drops the cached object when a selection is removed', () => {
    useCompareStore.getState().addProperty(propertyFixture('a'));
    useCompareStore.getState().removeProperty('a');

    expect(useCompareStore.getState().propertyCache).toEqual({});
  });

  it('toggles on and off', () => {
    const toggle = () => useCompareStore.getState().toggleProperty('a');

    toggle();
    expect(useCompareStore.getState().isPropertySelected('a')).toBe(true);

    toggle();
    expect(useCompareStore.getState().isPropertySelected('a')).toBe(false);
  });

  it('does not toggle a fourth property in', () => {
    const store = useCompareStore.getState();
    for (const id of ['a', 'b', 'c']) store.addProperty(id);

    useCompareStore.getState().toggleProperty('d');

    expect(useCompareStore.getState().isPropertySelected('d')).toBe(false);
    expect(useCompareStore.getState().selectedIds).toHaveLength(MAX_COMPARE);
  });

  it('clears selection and cache together', () => {
    useCompareStore.getState().addProperty(propertyFixture('a'));
    useCompareStore.getState().clearCompare();

    const state = useCompareStore.getState();
    expect(state.selectedIds).toEqual([]);
    expect(state.propertyCache).toEqual({});
  });

  it('caps setSelectedIds and keeps only still-selected cache entries', () => {
    useCompareStore.getState().addProperty(propertyFixture('a'));
    useCompareStore.getState().addProperty(propertyFixture('b'));

    useCompareStore.getState().setSelectedIds(['b', 'x', 'y', 'z']);

    const state = useCompareStore.getState();
    expect(state.selectedIds).toEqual(['b', 'x', 'y']);
    // 'a' is no longer selected, so its object is not retained.
    expect(Object.keys(state.propertyCache)).toEqual(['b']);
  });

  it('returns selected properties in selection order, skipping uncached ids', () => {
    const store = useCompareStore.getState();
    store.addProperty(propertyFixture('a'));
    // Added by bare id, as a share link or restored session would.
    store.addProperty('b');
    store.addProperty(propertyFixture('c'));

    const resolved = useCompareStore.getState().getSelectedProperties();

    expect(resolved.map((p) => p.id)).toEqual(['a', 'c']);
  });
});

describe('history slice', () => {
  beforeEach(reset);

  it('records a comparison with a share URL', () => {
    useCompareStore.getState().addComparison(['a', 'b']);

    const [entry] = useCompareStore.getState().history;
    expect(entry.propertyIds).toEqual(['a', 'b']);
    expect(entry.shareUrl).toBe('/compare?ids=a,b');
    expect(entry.timestamp).toBeGreaterThan(0);
    expect(entry.id).toMatch(/^comp/);
  });

  it('ignores an empty comparison', () => {
    useCompareStore.getState().addComparison([]);
    expect(useCompareStore.getState().history).toEqual([]);
  });

  it('puts the newest entry first', () => {
    useCompareStore.getState().addComparison(['a']);
    useCompareStore.getState().addComparison(['b']);

    expect(useCompareStore.getState().history[0].propertyIds).toEqual(['b']);
  });

  it('caps history at MAX_HISTORY', () => {
    for (let i = 0; i < MAX_HISTORY + 3; i++) {
      useCompareStore.getState().addComparison([`p${i}`]);
    }

    expect(useCompareStore.getState().history).toHaveLength(MAX_HISTORY);
  });

  it('removes a single entry by id', () => {
    useCompareStore.getState().addComparison(['a']);
    const { id } = useCompareStore.getState().history[0];

    useCompareStore.getState().removeComparison(id);

    expect(useCompareStore.getState().history).toEqual([]);
  });

  it('clears all history', () => {
    useCompareStore.getState().addComparison(['a']);
    useCompareStore.getState().addComparison(['b']);

    useCompareStore.getState().clearHistory();

    expect(useCompareStore.getState().getHistory()).toEqual([]);
  });

  it('keeps history independent of selection', () => {
    // The reason history was a separate store; it must survive a clear.
    useCompareStore.getState().addComparison(['a', 'b']);
    useCompareStore.getState().addProperty('a');

    useCompareStore.getState().clearCompare();

    expect(useCompareStore.getState().selectedIds).toEqual([]);
    expect(useCompareStore.getState().history).toHaveLength(1);
  });
});

describe('persistence', () => {
  beforeEach(reset);

  it('persists selection, cache and history under one key', () => {
    useCompareStore.getState().addProperty(propertyFixture('a'));
    useCompareStore.getState().addComparison(['a']);

    const raw = window.localStorage.getItem('propchain-compare');
    expect(raw).not.toBeNull();

    const parsed = JSON.parse(raw as string);
    expect(parsed.state.selectedIds).toEqual(['a']);
    expect(parsed.state.history).toHaveLength(1);
    expect(Object.keys(parsed.state.propertyCache)).toEqual(['a']);
    expect(parsed.version).toBe(2);
  });
});
