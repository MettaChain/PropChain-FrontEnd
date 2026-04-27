import {
  isBlockchainNetwork,
  isPropertyType,
  isSortOption,
} from '@/types/property';
import type { SearchFilters, SortOption } from '@/types/property';

/**
 * Search Utility Functions
 * Helper functions for search and filter operations
 */

/**
 * Convert search filters to URL parameters
 */
/**
 * Converts search filters and sort options to a URL query string.
 * 
 * @param filters - The search filters to convert.
 * @param sortBy - The current sort option.
 * @returns A URL-encoded query string.
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
 * Parses URL query parameters into search filters and sort options.
 * 
 * @param searchParams - The URL search parameters.
 * @returns An object containing partial filters and the sort option.
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
 * Formats a numeric price for display with currency.
 * 
 * @param price - The numeric price.
 * @param currency - The currency code (default: 'USD').
 * @returns The formatted price string.
 */
export function formatPrice(price: number, currency: string = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price);
}

/**
 * Formats a number with comma separators.
 * 
 * @param num - The number to format.
 * @returns The formatted number string.
 */
export function formatNumber(num: number): string {
  return new Intl.NumberFormat('en-US').format(num);
}

/**
 * Formats a return on investment (ROI) value as a percentage.
 * 
 * @param roi - The ROI value.
 * @returns The formatted ROI string.
 */
export function formatROI(roi: number): string {
  return `${roi.toFixed(1)}%`;
}

/**
 * Formats a date string for user-friendly display.
 * 
 * @param dateString - The ISO date string.
 * @returns The formatted date string.
 */
export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(date);
}

/**
 * Calculates and returns a relative "time ago" string from a date.
 * 
 * @param dateString - The ISO date string.
 * @returns A human-readable time ago string.
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
 * Truncates text to a maximum length and adds an ellipsis.
 * 
 * @param text - The text to truncate.
 * @param maxLength - The maximum allowed length.
 * @returns The truncated text.
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  if (maxLength <= 3) return text.substring(0, maxLength) + '...';
  return text.substring(0, maxLength - 3).trimEnd() + '...';
}

/**
 * Returns the hex color code associated with a blockchain.
 * 
 * @param blockchain - The name of the blockchain.
 * @returns The hex color code.
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
 * Returns an emoji icon associated with a property type.
 * 
 * @param type - The property type.
 * @returns An emoji icon.
 */
export function getPropertyTypeIcon(type: string): string {
  const icons: Record<string, string> = {
    residential: '🏠',
    commercial: '🏢',
    industrial: '🏭',
    'mixed-use': '🏗️',
  };
  return icons[type] || '🏘️';
}

/**
 * Validates whether a search query meets minimum length requirements.
 * 
 * @param query - The search query to validate.
 * @returns True if the query is valid, false otherwise.
 */
export function isValidSearchQuery(query: string): boolean {
  return query.trim().length >= 2;
}

/**
 * Creates a debounced version of a function.
 * 
 * @param func - The function to debounce.
 * @param wait - The debounce timeout in milliseconds.
 * @returns A debounced version of the function.
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
