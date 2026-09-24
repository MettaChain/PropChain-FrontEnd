/**
 * Canonical compare-selection accessor.
 *
 * PropertyCard, the compare page, and the header badge previously read
 * selection state from two independent stores (`compareStore` and
 * `comparisonStore`), which could disagree. `compareStore` is the single
 * source of truth for the current selection; `comparisonHistoryStore`
 * remains scoped to history snapshots only. Consumers should import
 * `useCanonicalCompareSelection` instead of reading `comparisonStore`
 * directly, so selection state can't fork again.
 */
import { useCompareStore } from './compareStore';

export function useCanonicalCompareSelection() {
  const selectedIds = useCompareStore((state) => state.selectedIds ?? []);
  const toggle = useCompareStore((state) => state.toggleProperty);
  const clear = useCompareStore((state) => state.clearCompare);

  return {
    selectedIds,
    count: selectedIds.length,
    toggle,
    clear,
  };
}
