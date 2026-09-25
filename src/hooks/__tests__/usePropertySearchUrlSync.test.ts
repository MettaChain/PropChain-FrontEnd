/**
 * Tests for usePropertySearchUrlSync (#1091).
 *
 * Two things are worth pinning. The owned-key list must match what
 * `filtersToUrlParams` actually emits, or a renamed filter param would stop
 * being cleared and stick in the URL forever. And the sync must preserve
 * `page` / `size`, which `usePaginationParams` owns — pushing
 * `filtersToUrlParams` output verbatim, as the deleted legacy hook did, would
 * reset a deep-linked page on every filter change.
 */
import { FILTER_PARAM_KEYS } from '../usePropertySearchUrlSync';
import { filtersToUrlParams } from '@/utils/searchUtils';
import type { SearchFilters } from '@/types/property';

/** Filters with every optional field populated, so every param is emitted. */
const fullyPopulated: SearchFilters = {
  query: 'loft',
  priceRange: [100_000, 900_000],
  propertyTypes: ['apartment'],
  blockchains: ['ethereum'],
  roiMin: 4,
  roiMax: 20,
  location: 'Lisbon',
  bedrooms: [2],
  bathrooms: [1],
  squareFeetRange: [500, 2_000],
} as SearchFilters;

describe('FILTER_PARAM_KEYS covers filtersToUrlParams', () => {
  it('lists every key the serialiser can emit', () => {
    const emitted = [...new URLSearchParams(filtersToUrlParams(fullyPopulated, 'price-asc')).keys()];

    const missing = emitted.filter((key) => !FILTER_PARAM_KEYS.includes(key as never));
    expect(missing).toEqual([]);
  });

  it('includes the sort key, which is emitted only for a non-default sort', () => {
    const withSort = [...new URLSearchParams(filtersToUrlParams(fullyPopulated, 'price-asc')).keys()];
    expect(withSort).toContain('sort');
    expect(FILTER_PARAM_KEYS).toContain('sort');
  });

  it('does not claim pagination keys, which usePaginationParams owns', () => {
    // If these ever appear here the sync would start fighting the paginator.
    expect(FILTER_PARAM_KEYS).not.toContain('page');
    expect(FILTER_PARAM_KEYS).not.toContain('size');
  });

  it('lists no key the serialiser cannot emit', () => {
    // A stale key would be deleted from the URL on every sync for no reason.
    const emitted = new Set([
      ...new URLSearchParams(filtersToUrlParams(fullyPopulated, 'price-asc')).keys(),
    ]);
    const stale = FILTER_PARAM_KEYS.filter((key) => !emitted.has(key));
    expect(stale).toEqual([]);
  });
});

describe('merge semantics the hook relies on', () => {
  /** Mirrors the hook's merge: clear owned keys, apply new ones, keep the rest. */
  function merge(current: string, filters: SearchFilters, sortBy: string): string {
    const merged = new URLSearchParams(current);
    for (const key of FILTER_PARAM_KEYS) merged.delete(key);
    for (const [k, v] of new URLSearchParams(
      filtersToUrlParams(filters, sortBy as never),
    )) {
      merged.set(k, v);
    }
    merged.sort();
    return merged.toString();
  }

  it('preserves pagination params across a filter change', () => {
    const result = merge('page=3&size=24&q=old', fullyPopulated, 'newest');
    const params = new URLSearchParams(result);

    expect(params.get('page')).toBe('3');
    expect(params.get('size')).toBe('24');
    expect(params.get('q')).toBe('loft');
  });

  it('drops a filter param that no longer applies', () => {
    const cleared = {
      ...fullyPopulated,
      query: '',
      location: '',
    } as SearchFilters;

    const params = new URLSearchParams(merge('q=stale&location=stale&page=2', cleared, 'newest'));

    expect(params.get('q')).toBeNull();
    expect(params.get('location')).toBeNull();
    // Still not our key to remove.
    expect(params.get('page')).toBe('2');
  });

  it('preserves unrelated params it does not own', () => {
    const params = new URLSearchParams(merge('utm_source=email', fullyPopulated, 'newest'));
    expect(params.get('utm_source')).toBe('email');
  });

  it('is idempotent, so the effect settles instead of looping', () => {
    const once = merge('page=2', fullyPopulated, 'price-asc');
    const twice = merge(once, fullyPopulated, 'price-asc');
    expect(twice).toBe(once);
  });
});
