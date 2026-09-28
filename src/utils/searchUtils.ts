import {
  isBlockchainNetwork,
  isPropertyType,
  isSortOption,
} from '@/types/property';
import type { SearchFilters, SortOption } from '@/types/property';

const getResolvedLocale = (locale?: string): string => {
  if (locale) return locale;
  if (typeof navigator !== 'undefined' && navigator.language) {
    return navigator.language;
  }
  return 'en-US';
};

/**
 * Search Utility Functions
 * Helper functions for search and filter operations
 */

/**
 * Converts search filters and sort options into a URL-encoded query string.
 * Parameter keys are canonicalized and invariant to user locale.
 *
 * @param filters - The search filters object containing query, price range, property types, etc.
 * @param sortBy - The current property sort option to include in parameters.
 * @returns A URL-encoded query string representation of the filters and sort option.
 *
 * @example
 * ```ts
 * const queryStr = filtersToUrlParams({ query: 'penthouse', priceRange: [1000, 5000000], propertyTypes: ['residential'] }, 'price-asc');
 * // returns "q=penthouse&minPrice=1000&maxPrice=5000000&types=residential&sort=price-asc"
 * ```
 */
export function filtersToUrlParams(filters: SearchFilters, sortBy: SortOption): string {
  const params = new URLSearchParams();

  if (filters.query) params.set('q', filters.query);
  if (filters.priceRange[0] > 0) params.set('minPrice', filters.priceRange[0].toString());
  if (filters.priceRange[1] < 10000000) params.set('maxPrice', filters.priceRange[1].toString());
  if (filters.propertyTypes.length > 0) params.set('types', filters.propertyTypes.join(','));
  if (filters.blockchains.length > 0) params.set('chains', filters.blockchains.join(','));
  if (filters.roiMin > 0) params.set('minRoi', filters.roiMin.toString());
  if (filters.roiMax < 100) params.set('maxRoi', filters.roiMax.toString());
  if (filters.location) params.set('location', filters.location);
  if (filters.bedrooms.length > 0) params.set('bedrooms', filters.bedrooms.join(','));
  if (filters.bathrooms.length > 0) params.set('bathrooms', filters.bathrooms.join(','));
  if (filters.squareFeetRange[0] > 0) params.set('minSqft', filters.squareFeetRange[0].toString());
  if (filters.squareFeetRange[1] < 50000) params.set('maxSqft', filters.squareFeetRange[1].toString());
  if (sortBy !== 'newest') params.set('sort', sortBy);

  return params.toString();
}

/**
 * Parses URL query parameters into partial search filters and a sort option.
 * Accepts standard URL parameter keys invariant across locales.
 *
 * @param searchParams - The URLSearchParams instance containing query keys to parse.
 * @returns An object containing the parsed partial `filters` and the active `sortBy` option.
 *
 * @example
 * ```ts
 * const params = new URLSearchParams('q=condo&minPrice=200000&sort=newest');
 * const { filters, sortBy } = urlParamsToFilters(params);
 * // filters: { query: 'condo', priceRange: [200000, 10000000] }, sortBy: 'newest'
 * ```
 */
export function urlParamsToFilters(searchParams: URLSearchParams): {
  filters: Partial<SearchFilters>;
  sortBy: SortOption;
} {
  const filters: Partial<SearchFilters> = {};
  let sortBy: SortOption = 'newest';

  const query = searchParams.get('q');
  if (query) filters.query = query;

  const minPrice = searchParams.get('minPrice');
  const maxPrice = searchParams.get('maxPrice');
  if (minPrice || maxPrice) {
    filters.priceRange = [
      minPrice ? parseInt(minPrice) : 0,
      maxPrice ? parseInt(maxPrice) : 10000000,
    ];
  }

  const types = searchParams.get('types');
  if (types) {
    filters.propertyTypes = types
      .split(',')
      .map((item) => item.trim().toLowerCase())
      .filter(isPropertyType);
  }

  const chains = searchParams.get('chains');
  if (chains) {
    filters.blockchains = chains
      .split(',')
      .map((item) => item.trim().toLowerCase())
      .filter(isBlockchainNetwork);
  }

  const minRoi = searchParams.get('minRoi');
  const maxRoi = searchParams.get('maxRoi');
  if (minRoi) filters.roiMin = parseFloat(minRoi);
  if (maxRoi) filters.roiMax = parseFloat(maxRoi);

  const location = searchParams.get('location');
  if (location) filters.location = location;

  const bedrooms = searchParams.get('bedrooms');
  if (bedrooms) filters.bedrooms = bedrooms.split(',').map(Number);

  const bathrooms = searchParams.get('bathrooms');
  if (bathrooms) filters.bathrooms = bathrooms.split(',').map(Number);

  const minSqft = searchParams.get('minSqft');
  const maxSqft = searchParams.get('maxSqft');
  if (minSqft || maxSqft) {
    filters.squareFeetRange = [
      minSqft ? parseInt(minSqft) : 0,
      maxSqft ? parseInt(maxSqft) : 50000,
    ];
  }

  const sort = searchParams.get('sort');
  if (sort && isSortOption(sort)) sortBy = sort;

  return { filters, sortBy };
}

/**
 * Formats a numeric price for localized currency display.
 * Resolves locale using the provided `locale` argument, falling back to
 * `navigator.language` in browser environments or 'en-US' as default.
 *
 * @param price - The numeric price value to format.
 * @param currency - The ISO currency code (defaults to 'USD').
 * @param locale - Optional BCP 47 language tag (e.g. 'en-US', 'de-DE'). Falls back to browser/environment locale.
 * @returns Formatted currency string according to the resolved locale and currency.
 *
 * @example
 * ```ts
 * formatPrice(250000, 'USD', 'en-US'); // "$250,000"
 * formatPrice(250000, 'EUR', 'de-DE'); // "250.000 €"
 * ```
 */
export function formatPrice(price: number, currency: string = 'USD', locale?: string): string {
  return new Intl.NumberFormat(getResolvedLocale(locale), {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price);
}

/**
 * Formats a number with locale-sensitive grouping separators.
 * Resolves locale using the provided `locale` argument, falling back to
 * `navigator.language` in browser environments or 'en-US' as default.
 *
 * @param num - The numeric value to format.
 * @param locale - Optional BCP 47 language tag (e.g. 'en-US', 'fr-FR'). Falls back to browser/environment locale.
 * @returns Formatted number string with appropriate group separators for the locale.
 *
 * @example
 * ```ts
 * formatNumber(1250000, 'en-US'); // "1,250,000"
 * formatNumber(1250000, 'fr-FR'); // "1 250 000"
 * ```
 */
export function formatNumber(num: number, locale?: string): string {
  return new Intl.NumberFormat(getResolvedLocale(locale)).format(num);
}

/**
 * Formats a return on investment (ROI) number as a percentage string with 1 decimal place.
 *
 * @param roi - The numeric return on investment percentage (e.g. 8.5 for 8.5%).
 * @returns Formatted percentage string ending with '%'.
 *
 * @example
 * ```ts
 * formatROI(8.54); // "8.5%"
 * formatROI(12);   // "12.0%"
 * ```
 */
export function formatROI(roi: number): string {
  return `${roi.toFixed(1)}%`;
}

/**
 * Formats an ISO date string for localized, human-friendly date display.
 * Resolves locale using the provided `locale` argument, falling back to
 * `navigator.language` in browser environments or 'en-US' as default.
 *
 * @param dateString - The ISO date string or date-compatible string to format.
 * @param locale - Optional BCP 47 language tag (e.g. 'en-US', 'es-ES'). Falls back to browser/environment locale.
 * @returns Localized date string formatted with numeric year, short month, and numeric day.
 *
 * @example
 * ```ts
 * formatDate('2024-01-15T00:00:00Z', 'en-US'); // "Jan 15, 2024"
 * ```
 */
export function formatDate(dateString: string, locale?: string): string {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat(getResolvedLocale(locale), {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(date);
}

/**
 * Calculates and returns a relative elapsed time ("time ago") string from a date.
 *
 * @param dateString - The ISO date string to compare against the current time.
 * @returns Human-readable relative time interval (e.g. "Just now", "2 hours ago", "3 days ago").
 *
 * @example
 * ```ts
 * timeAgo(new Date(Date.now() - 3600 * 1000).toISOString()); // "1 hour ago"
 * timeAgo(new Date().toISOString()); // "Just now"
 * ```
 */
export function timeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  const intervals = {
    year: 31536000,
    month: 2592000,
    week: 604800,
    day: 86400,
    hour: 3600,
    minute: 60,
  };

  for (const [unit, secondsInUnit] of Object.entries(intervals)) {
    const interval = Math.floor(seconds / secondsInUnit);
    if (interval >= 1) {
      return `${interval} ${unit}${interval > 1 ? 's' : ''} ago`;
    }
  }

  return 'Just now';
}

/**
 * Truncates text to a specified maximum length, appending an ellipsis ('...') if trimmed.
 *
 * @param text - The input string to truncate.
 * @param maxLength - Maximum permitted character length including the ellipsis.
 * @returns Truncated string with ellipsis if length exceeded, or original text if within limit.
 *
 * @example
 * ```ts
 * truncateText('Luxury Manhattan Penthouse with Terrace', 20); // "Luxury Manhattan..."
 * truncateText('Short text', 20); // "Short text"
 * ```
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  if (maxLength <= 3) return text.substring(0, maxLength) + '...';
  return text.substring(0, maxLength - 3).trimEnd() + '...';
}

/**
 * Returns the hex brand color code associated with a supported blockchain network.
 *
 * @param blockchain - The blockchain identifier (e.g. 'ethereum', 'polygon', 'bsc').
 * @returns Hex color code string for the network, or fallback gray ('#666666') if unrecognized.
 *
 * @example
 * ```ts
 * getBlockchainColor('ethereum'); // "#627EEA"
 * getBlockchainColor('polygon');  // "#8247E5"
 * ```
 */
export function getBlockchainColor(blockchain: string): string {
  const colors: Record<string, string> = {
    ethereum: '#627EEA',
    polygon: '#8247E5',
    bsc: '#F3BA2F',
  };
  return colors[blockchain] || '#666666';
}

/**
 * Returns the property type identifier label for icon resolution.
 * UI components map this returned string to the appropriate Lucide or design icon.
 *
 * @param type - The property type string (e.g. 'residential', 'commercial', 'industrial').
 * @returns The normalized property type string.
 *
 * @example
 * ```ts
 * getPropertyTypeIcon('residential'); // "residential"
 * ```
 */
export function getPropertyTypeIcon(type: string): string {
  return type; // Components should map this to the appropriate lucide-react icon
}

/**
 * Validates whether a search query string satisfies the minimum search criteria (non-whitespace length >= 2).
 *
 * @param query - The user search input string to validate.
 * @returns True if the trimmed query has at least 2 characters, false otherwise.
 *
 * @example
 * ```ts
 * isValidSearchQuery('NY');  // true
 * isValidSearchQuery(' N '); // false
 * isValidSearchQuery('   '); // false
 * ```
 */
export function isValidSearchQuery(query: string): boolean {
  return query.trim().length >= 2;
}

/**
 * Creates a debounced version of a function that delays execution until after
 * the specified wait time has elapsed since the last time it was invoked.
 *
 * @typeParam TArgs - The argument types of the target function.
 * @typeParam TResult - The return type of the target function.
 * @param func - The target function to debounce.
 * @param wait - Milliseconds to delay invocation after the last call.
 * @returns Debounced wrapper function accepting the same arguments.
 *
 * @example
 * ```ts
 * const handleSearch = debounce((query: string) => fetchResults(query), 300);
 * handleSearch('prop');
 * ```
 */
export function debounce<TArgs extends unknown[], TResult>(
  func: (...args: TArgs) => TResult,
  wait: number
): (...args: TArgs) => void {
  let timeout: NodeJS.Timeout | null = null;

  return function executedFunction(...args: TArgs) {
    const later = () => {
      timeout = null;
      func(...args);
    };

    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}
