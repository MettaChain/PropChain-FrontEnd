import {
  filtersToUrlParams,
  urlParamsToFilters,
  formatPrice,
  formatNumber,
  formatROI,
  formatDate,
  timeAgo,
  truncateText,
  getBlockchainColor,
  getPropertyTypeIcon,
  isValidSearchQuery,
  debounce,
} from '../searchUtils';
import type { SearchFilters, SortOption } from '@/types/property';

describe('searchUtils', () => {
  describe('filtersToUrlParams', () => {
    const mockFilters: SearchFilters = {
      query: 'test property',
      priceRange: [100000, 500000],
      propertyTypes: ['residential', 'commercial'],
      blockchains: ['ethereum', 'polygon'],
      roiMin: 5,
      roiMax: 15,
      location: 'New York',
      bedrooms: [2, 3],
      bathrooms: [2],
      squareFeetRange: [1000, 3000],
      status: ['active'],
    };

    it('should convert filters to URL parameters correctly', () => {
      const result = filtersToUrlParams(mockFilters, 'price-asc');
      
      expect(result).toContain('q=test+property');
      expect(result).toContain('minPrice=100000');
      expect(result).toContain('maxPrice=500000');
      expect(result).toContain('types=residential%2Ccommercial');
      expect(result).toContain('chains=ethereum%2Cpolygon');
      expect(result).toContain('minRoi=5');
      expect(result).toContain('maxRoi=15');
      expect(result).toContain('location=New+York');
      expect(result).toContain('bedrooms=2%2C3');
      expect(result).toContain('bathrooms=2');
      expect(result).toContain('minSqft=1000');
      expect(result).toContain('maxSqft=3000');
      expect(result).toContain('sort=price-asc');
    });

    it('should handle empty filters', () => {
      const emptyFilters: SearchFilters = {
        query: '',
        priceRange: [0, 10000000],
        propertyTypes: [],
        blockchains: [],
        roiMin: 0,
        roiMax: 100,
        location: '',
        bedrooms: [],
        bathrooms: [],
        squareFeetRange: [0, 50000],
        status: ['active'],
      };

      const result = filtersToUrlParams(emptyFilters, 'newest');
      expect(result).toBe('');
    });

    it('should not include default values', () => {
      const defaultFilters: SearchFilters = {
        query: '',
        priceRange: [0, 10000000],
        propertyTypes: [],
        blockchains: [],
        roiMin: 0,
        roiMax: 100,
        location: '',
        bedrooms: [],
        bathrooms: [],
        squareFeetRange: [0, 50000],
        status: ['active'],
      };

      const result = filtersToUrlParams(defaultFilters, 'newest');
      expect(result).toBe('');
    });
  });

  describe('urlParamsToFilters', () => {
    it('should parse URL parameters to filters correctly', () => {
      const params = new URLSearchParams({
        q: 'test property',
        minPrice: '100000',
        maxPrice: '500000',
        types: 'residential,commercial',
        chains: 'ethereum,polygon',
        minRoi: '5',
        maxRoi: '15',
        location: 'New York',
        bedrooms: '2,3',
        bathrooms: '2',
        minSqft: '1000',
        maxSqft: '3000',
        sort: 'price-asc',
      });

      const result = urlParamsToFilters(params);

      expect(result.filters.query).toBe('test property');
      expect(result.filters.priceRange).toEqual([100000, 500000]);
      expect(result.filters.propertyTypes).toEqual(['residential', 'commercial']);
      expect(result.filters.blockchains).toEqual(['ethereum', 'polygon']);
      expect(result.filters.roiMin).toBe(5);
      expect(result.filters.roiMax).toBe(15);
      expect(result.filters.location).toBe('New York');
      expect(result.filters.bedrooms).toEqual([2, 3]);
      expect(result.filters.bathrooms).toEqual([2]);
      expect(result.filters.squareFeetRange).toEqual([1000, 3000]);
      expect(result.sortBy).toBe('price-asc');
    });

    it('should handle empty URL parameters', () => {
      const params = new URLSearchParams();
      const result = urlParamsToFilters(params);

      expect(result.sortBy).toBe('newest');
      expect(Object.keys(result.filters)).toHaveLength(0);
    });

    it('should use default values for missing parameters', () => {
      const params = new URLSearchParams({
        minPrice: '100000',
        maxRoi: '15',
      });

      const result = urlParamsToFilters(params);

      expect(result.filters.priceRange).toEqual([100000, 10000000]);
      expect(result.filters.roiMax).toBe(15);
    });
  });

  describe('formatPrice', () => {
    it('should format price with USD currency by default', () => {
      expect(formatPrice(100000)).toBe('$100,000');
      expect(formatPrice(1500000)).toBe('$1,500,000');
    });

    it('should format price with custom currency', () => {
      expect(formatPrice(100000, 'EUR')).toBe('€100,000');
      expect(formatPrice(100000, 'GBP')).toBe('£100,000');
    });

    it('should handle decimal prices', () => {
      expect(formatPrice(100000.50)).toBe('$100,001');
    });
  });

  describe('formatNumber', () => {
    it('should format numbers with commas', () => {
      expect(formatNumber(1000)).toBe('1,000');
      expect(formatNumber(1000000)).toBe('1,000,000');
      expect(formatNumber(1234567)).toBe('1,234,567');
    });

    it('should handle small numbers', () => {
      expect(formatNumber(0)).toBe('0');
      expect(formatNumber(999)).toBe('999');
    });
  });

  describe('formatROI', () => {
    it('should format ROI percentage correctly', () => {
      expect(formatROI(5.25)).toBe('5.3%');
      expect(formatROI(10)).toBe('10.0%');
      expect(formatROI(0.5)).toBe('0.5%');
    });

    it('should round to one decimal place', () => {
      expect(formatROI(5.267)).toBe('5.3%');
      expect(formatROI(5.234)).toBe('5.2%');
    });
  });

  describe('formatDate', () => {
    it('should format date string correctly', () => {
      const dateString = '2024-01-15T10:30:00Z';
      const result = formatDate(dateString);
      expect(result).toMatch(/Jan 15, 2024/);
    });

    it('should handle different date formats', () => {
      const dateString = '2024-12-31';
      const result = formatDate(dateString);
      expect(result).toMatch(/Dec 31, 2024/);
    });
  });

  describe('timeAgo', () => {
    beforeEach(() => {
      jest.useFakeTimers();
      jest.setSystemTime(new Date('2024-01-15T12:00:00Z'));
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should show time ago for different intervals', () => {
      expect(timeAgo('2024-01-15T11:30:00Z')).toBe('30 minutes ago');
      expect(timeAgo('2024-01-15T10:00:00Z')).toBe('2 hours ago');
      expect(timeAgo('2024-01-14T12:00:00Z')).toBe('1 day ago');
      expect(timeAgo('2024-01-08T12:00:00Z')).toBe('1 week ago');
      expect(timeAgo('2023-12-15T12:00:00Z')).toBe('1 month ago');
      expect(timeAgo('2023-01-15T12:00:00Z')).toBe('1 year ago');
    });

    it('should show "Just now" for very recent times', () => {
      expect(timeAgo('2024-01-15T11:59:30Z')).toBe('Just now');
    });

    it('should handle pluralization correctly', () => {
      expect(timeAgo('2024-01-13T12:00:00Z')).toBe('2 days ago');
      expect(timeAgo('2024-01-01T12:00:00Z')).toBe('2 weeks ago');
      expect(timeAgo('2022-01-15T12:00:00Z')).toBe('2 years ago');
    });
  });

  describe('truncateText', () => {
    it('should truncate text longer than maxLength', () => {
      const text = 'This is a very long text that should be truncated';
      expect(truncateText(text, 20)).toBe('This is a very lo...');
    });

    it('should not truncate text shorter than maxLength', () => {
      const text = 'Short text';
      expect(truncateText(text, 20)).toBe('Short text');
    });

    it('should handle exact length match', () => {
      const text = 'Exact length';
      expect(truncateText(text, 12)).toBe('Exact length');
    });
  });

  describe('getBlockchainColor', () => {
    it('should return correct colors for known blockchains', () => {
      expect(getBlockchainColor('ethereum')).toBe('#627EEA');
      expect(getBlockchainColor('polygon')).toBe('#8247E5');
      expect(getBlockchainColor('bsc')).toBe('#F3BA2F');
    });

    it('should return default color for unknown blockchains', () => {
      expect(getBlockchainColor('unknown')).toBe('#666666');
      expect(getBlockchainColor('')).toBe('#666666');
    });
  });

  describe('getPropertyTypeIcon', () => {
    it('should return correct icons for known property types', () => {
      expect(getPropertyTypeIcon('residential')).toBe('🏠');
      expect(getPropertyTypeIcon('commercial')).toBe('🏢');
      expect(getPropertyTypeIcon('industrial')).toBe('🏭');
      expect(getPropertyTypeIcon('mixed-use')).toBe('🏗️');
    });

    it('should return default icon for unknown property types', () => {
      expect(getPropertyTypeIcon('unknown')).toBe('🏘️');
      expect(getPropertyTypeIcon('')).toBe('🏘️');
    });
  });

  describe('isValidSearchQuery', () => {
    it('should validate search queries correctly', () => {
      expect(isValidSearchQuery('test')).toBe(true);
      expect(isValidSearchQuery('test query')).toBe(true);
      expect(isValidSearchQuery('t')).toBe(false);
      expect(isValidSearchQuery('')).toBe(false);
      expect(isValidSearchQuery('  ')).toBe(false);
      expect(isValidSearchQuery('  test  ')).toBe(true);
    });
  });

  describe('debounce', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should debounce function calls', () => {
      const mockFn = jest.fn();
      const debouncedFn = debounce(mockFn, 100);

      debouncedFn('arg1');
      debouncedFn('arg2');
      debouncedFn('arg3');

      expect(mockFn).not.toHaveBeenCalled();

      jest.advanceTimersByTime(100);

      expect(mockFn).toHaveBeenCalledTimes(1);
      expect(mockFn).toHaveBeenCalledWith('arg3');
    });

    it('should call function after specified delay', () => {
      const mockFn = jest.fn();
      const debouncedFn = debounce(mockFn, 200);

      debouncedFn('test');

      jest.advanceTimersByTime(199);
      expect(mockFn).not.toHaveBeenCalled();

      jest.advanceTimersByTime(1);
      expect(mockFn).toHaveBeenCalledTimes(1);
      expect(mockFn).toHaveBeenCalledWith('test');
    });

    it('should reset timer on subsequent calls', () => {
      const mockFn = jest.fn();
      const debouncedFn = debounce(mockFn, 100);

      debouncedFn('first');
      jest.advanceTimersByTime(50);

      debouncedFn('second');
      jest.advanceTimersByTime(50);

      debouncedFn('third');
      jest.advanceTimersByTime(100);

      expect(mockFn).toHaveBeenCalledTimes(1);
      expect(mockFn).toHaveBeenCalledWith('third');
    });
  });
});
