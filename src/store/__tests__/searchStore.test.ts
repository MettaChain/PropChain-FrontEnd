import { act, renderHook } from '@testing-library/react';
import { useSearchStore } from '../searchStore';
import type { Property, SearchFilters, SortOption, ViewMode } from '@/types/property';

// Mock the DEFAULT_FILTERS
jest.mock('@/types/property', () => ({
  ...jest.requireActual('@/types/property'),
  DEFAULT_FILTERS: {
    priceRange: [0, 1000000],
    squareFeetRange: [0, 10000],
    propertyTypes: [],
    blockchains: [],
    bedrooms: [0, 10],
    bathrooms: [0, 10],
    status: [],
  },
}));

describe('searchStore', () => {
  const mockProperty: Property = {
    id: '1',
    title: 'Test Property',
    description: 'A test property',
    price: '100000',
    address: '123 Test St',
    images: [],
    propertyType: 'house',
    bedrooms: 3,
    bathrooms: 2,
    squareFeet: 1500,
    yearBuilt: 2020,
    blockchain: 'ethereum',
    tokenId: '1',
    owner: '0x123...',
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };

  beforeEach(() => {
    // Reset the store before each test
    useSearchStore.getState().reset();
  });

  describe('initial state', () => {
    it('should have correct initial state', () => {
      const { result } = renderHook(() => useSearchStore());
      
      expect(result.current.filters.priceRange).toEqual([0, 1000000]);
      expect(result.current.filters.squareFeetRange).toEqual([0, 10000]);
      expect(result.current.filters.propertyTypes).toEqual([]);
      expect(result.current.filters.blockchains).toEqual([]);
      expect(result.current.filters.bedrooms).toEqual([0, 10]);
      expect(result.current.filters.bathrooms).toEqual([0, 10]);
      expect(result.current.filters.status).toEqual([]);
      expect(result.current.sortBy).toBe('newest');
      expect(result.current.viewMode).toBe('grid');
      expect(result.current.page).toBe(1);
      expect(result.current.resultsPerPage).toBe(12);
      expect(result.current.totalResults).toBe(0);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
      expect(result.current.lastUpdated).toBeNull();
      expect(result.current.properties).toEqual([]);
    });
  });

  describe('setFilters', () => {
    it('should update filters and reset page', () => {
      const { result } = renderHook(() => useSearchStore());
      
      act(() => {
        result.current.setFilters({
          priceRange: [100000, 500000],
          propertyTypes: ['house'],
        });
      });
      
      expect(result.current.filters.priceRange).toEqual([100000, 500000]);
      expect(result.current.filters.propertyTypes).toEqual(['house']);
      expect(result.current.page).toBe(1);
      expect(result.current.lastUpdated).toBeGreaterThan(0);
    });

    it('should merge filters with existing ones', () => {
      const { result } = renderHook(() => useSearchStore());
      
      act(() => {
        result.current.setFilters({ propertyTypes: ['house'] });
        result.current.setFilters({ blockchains: ['ethereum'] });
      });
      
      expect(result.current.filters.propertyTypes).toEqual(['house']);
      expect(result.current.filters.blockchains).toEqual(['ethereum']);
      expect(result.current.filters.priceRange).toEqual([0, 1000000]); // Should remain unchanged
    });
  });

  describe('setFilter', () => {
    it('should update a single filter and reset page', () => {
      const { result } = renderHook(() => useSearchStore());
      
      act(() => {
        result.current.setFilter('propertyTypes', ['apartment']);
      });
      
      expect(result.current.filters.propertyTypes).toEqual(['apartment']);
      expect(result.current.page).toBe(1);
      expect(result.current.lastUpdated).toBeGreaterThan(0);
    });

    it('should update price range filter', () => {
      const { result } = renderHook(() => useSearchStore());
      
      act(() => {
        result.current.setFilter('priceRange', [200000, 800000]);
      });
      
      expect(result.current.filters.priceRange).toEqual([200000, 800000]);
    });
  });

  describe('clearFilters', () => {
    it('should reset all filters to default values', () => {
      const { result } = renderHook(() => useSearchStore());
      
      // Set some filters
      act(() => {
        result.current.setFilters({
          priceRange: [100000, 500000],
          propertyTypes: ['house'],
          blockchains: ['ethereum'],
        });
        result.current.setPage(5);
      });
      
      // Clear filters
      act(() => {
        result.current.clearFilters();
      });
      
      expect(result.current.filters.priceRange).toEqual([0, 1000000]);
      expect(result.current.filters.propertyTypes).toEqual([]);
      expect(result.current.filters.blockchains).toEqual([]);
      expect(result.current.page).toBe(1);
      expect(result.current.lastUpdated).toBeGreaterThan(0);
    });
  });

  describe('setSortBy', () => {
    it('should update sort option and reset page', () => {
      const { result } = renderHook(() => useSearchStore());
      
      act(() => {
        result.current.setSortBy('price_low_high');
      });
      
      expect(result.current.sortBy).toBe('price_low_high');
      expect(result.current.page).toBe(1);
      expect(result.current.lastUpdated).toBeGreaterThan(0);
    });
  });

  describe('setViewMode', () => {
    it('should update view mode', () => {
      const { result } = renderHook(() => useSearchStore());
      
      act(() => {
        result.current.setViewMode('list');
      });
      
      expect(result.current.viewMode).toBe('list');
      expect(result.current.lastUpdated).toBeGreaterThan(0);
    });
  });

  describe('setPage', () => {
    it('should update current page', () => {
      const { result } = renderHook(() => useSearchStore());
      
      act(() => {
        result.current.setPage(3);
      });
      
      expect(result.current.page).toBe(3);
      expect(result.current.lastUpdated).toBeGreaterThan(0);
    });
  });

  describe('setResultsPerPage', () => {
    it('should update results per page and reset page', () => {
      const { result } = renderHook(() => useSearchStore());
      
      act(() => {
        result.current.setPage(5);
        result.current.setResultsPerPage(24);
      });
      
      expect(result.current.resultsPerPage).toBe(24);
      expect(result.current.page).toBe(1); // Should reset to 1
      expect(result.current.lastUpdated).toBeGreaterThan(0);
    });
  });

  describe('setProperties', () => {
    it('should set properties and total results', () => {
      const { result } = renderHook(() => useSearchStore());
      
      act(() => {
        result.current.setProperties([mockProperty], 50);
      });
      
      expect(result.current.properties).toEqual([mockProperty]);
      expect(result.current.totalResults).toBe(50);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
      expect(result.current.lastUpdated).toBeGreaterThan(0);
    });
  });

  describe('setLoading', () => {
    it('should update loading state', () => {
      const { result } = renderHook(() => useSearchStore());
      
      act(() => {
        result.current.setLoading(true);
      });
      
      expect(result.current.isLoading).toBe(true);
      
      act(() => {
        result.current.setLoading(false);
      });
      
      expect(result.current.isLoading).toBe(false);
    });
  });

  describe('setError', () => {
    it('should set error and stop loading', () => {
      const { result } = renderHook(() => useSearchStore());
      
      act(() => {
        result.current.setLoading(true);
        result.current.setError('Search failed');
      });
      
      expect(result.current.error).toBe('Search failed');
      expect(result.current.isLoading).toBe(false);
    });

    it('should clear error when set to null', () => {
      const { result } = renderHook(() => useSearchStore());
      
      act(() => {
        result.current.setError('Some error');
        result.current.setError(null);
      });
      
      expect(result.current.error).toBeNull();
    });
  });

  describe('setLastUpdated', () => {
    it('should update last updated timestamp', () => {
      const { result } = renderHook(() => useSearchStore());
      
      const timestamp = Date.now();
      
      act(() => {
        result.current.setLastUpdated(timestamp);
      });
      
      expect(result.current.lastUpdated).toBe(timestamp);
    });
  });

  describe('reset', () => {
    it('should reset store to initial state', () => {
      const { result } = renderHook(() => useSearchStore());
      
      // Set some state
      act(() => {
        result.current.setFilters({ propertyTypes: ['house'] });
        result.current.setSortBy('price_low_high');
        result.current.setViewMode('list');
        result.current.setPage(3);
        result.current.setResultsPerPage(24);
        result.current.setProperties([mockProperty], 50);
        result.current.setLoading(true);
        result.current.setError('Some error');
      });
      
      // Reset
      act(() => {
        result.current.reset();
      });
      
      expect(result.current.filters.priceRange).toEqual([0, 1000000]);
      expect(result.current.filters.propertyTypes).toEqual([]);
      expect(result.current.sortBy).toBe('newest');
      expect(result.current.viewMode).toBe('grid');
      expect(result.current.page).toBe(1);
      expect(result.current.resultsPerPage).toBe(12);
      expect(result.current.totalResults).toBe(0);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
      expect(result.current.properties).toEqual([]);
      expect(result.current.lastUpdated).toBeGreaterThan(0);
    });
  });

  describe('persistence', () => {
    it('should persist search preferences', () => {
      const { result } = renderHook(() => useSearchStore());
      
      act(() => {
        result.current.setFilters({ propertyTypes: ['house'] });
        result.current.setSortBy('price_low_high');
        result.current.setViewMode('list');
        result.current.setResultsPerPage(24);
      });
      
      // Create a new hook instance to test persistence
      const { result: result2 } = renderHook(() => useSearchStore());
      
      expect(result2.current.filters.propertyTypes).toEqual(['house']);
      expect(result2.current.sortBy).toBe('price_low_high');
      expect(result2.current.viewMode).toBe('list');
      expect(result2.current.resultsPerPage).toBe(24);
    });

    it('should not persist transient data', () => {
      const { result } = renderHook(() => useSearchStore());
      
      act(() => {
        result.current.setProperties([mockProperty], 50);
        result.current.setLoading(true);
        result.current.setError('Some error');
        result.current.setPage(5);
      });
      
      // Create a new hook instance
      const { result: result2 } = renderHook(() => useSearchStore());
      
      expect(result2.current.properties).toEqual([]);
      expect(result2.current.totalResults).toBe(0);
      expect(result2.current.isLoading).toBe(false);
      expect(result2.current.error).toBeNull();
      expect(result2.current.page).toBe(1); // Should reset to default
    });
  });
});
