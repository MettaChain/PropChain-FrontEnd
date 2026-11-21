/**
 * Typed helpers for the property comparison translation catalog (#1382).
 * The JSON files sit next to this file; keys resolve inside the `common`
 * namespace registered by `src/lib/i18n.ts`.
 */

export const PROPERTY_COMPARISON_LANGUAGES = [
  'en',
  'es',
  'fr',
  'de',
  'zh',
  'ar',
  'he',
] as const;

export type PropertyComparisonLanguage = (typeof PROPERTY_COMPARISON_LANGUAGES)[number];

export const RTL_LANGUAGES = ['ar', 'he'] as const;

export function isRtl(language: string): boolean {
  const base = language.toLowerCase().split('-')[0];
  return (RTL_LANGUAGES as readonly string[]).includes(base);
}

export const PROPERTY_COMPARISON_NAMESPACE = 'propertyComparison';

export type PropertyComparisonKey =
  | 'title'
  | 'subtitle'
  | 'headers.property'
  | 'headers.location'
  | 'headers.price'
  | 'headers.roi'
  | 'headers.yield'
  | 'headers.details'
  | 'headers.actions'
  | 'filters.label'
  | 'filters.search'
  | 'filters.searchPlaceholder'
  | 'filters.minPrice'
  | 'filters.maxPrice'
  | 'filters.minRoi'
  | 'filters.maxRoi'
  | 'filters.propertyType'
  | 'filters.location'
  | 'filters.sortBy'
  | 'filters.clearFilters'
  | 'filters.applyFilters'
  | 'empty.title'
  | 'empty.description'
  | 'empty.noResultsTitle'
  | 'empty.noResultsDescription'
  | 'errors.loadFailed'
  | 'errors.loadFailedDescription'
  | 'errors.invalidPriceRange'
  | 'errors.selectionLimit'
  | 'errors.missingProperty'
  | 'errors.retry'
  | 'tooltips.roi'
  | 'tooltips.yield'
  | 'tooltips.price'
  | 'tooltips.location'
  | 'tooltips.sort'
  | 'tooltips.remove'
  | 'actions.add'
  | 'actions.remove'
  | 'actions.clear'
  | 'actions.share'
  | '_direction';

export function propertyComparisonKey(key: PropertyComparisonKey): string {
  return `${PROPERTY_COMPARISON_NAMESPACE}.${key}`;
}
