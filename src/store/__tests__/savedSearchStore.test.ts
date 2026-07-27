import { act, renderHook, waitFor } from '@testing-library/react';
import { useSavedSearchStore } from '../savedSearchStore';
import type { SavedSearch } from '@/types/property';

// Mock the propertyService
jest.mock('@/lib/propertyService', () => ({
  propertyService: {
    getSavedSearches: jest.fn(),
    deleteSavedSearch: jest.fn(),
  },
}));

// Mock the utils
jest.mock('@/utils/typeGuards', () => ({
  getErrorMessage: jest.fn((error) => error?.message || 'Unknown error'),
}));

const mockPropertyService = require('@/lib/propertyService').propertyService;

describe('savedSearchStore', () => {
  const mockSavedSearch: SavedSearch = {
    id: 'search-1',
    name: 'Test Search',
    userId: 'user-123',
    filters: {
      priceRange: [100000, 500000],
      propertyTypes: ['house'],
      blockchains: ['ethereum'],
      bedrooms: [2, 4],
      bathrooms: [1, 3],
      squareFeetRange: [1000, 3000],
      status: ['active'],
    },
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };

  beforeEach(() => {
    // Reset the store and clear persisted state before each test
    const { clearAllPersistedState } = require('@/store/base');
    clearAllPersistedState();
    useSavedSearchStore.getState().reset();
    jest.clearAllMocks();
  });

  describe('initial state', () => {
    it('should have correct initial state', () => {
      const { result } = renderHook(() => useSavedSearchStore());
      
      expect(result.current.searches).toEqual([]);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
      expect(result.current.lastUpdated).toBeNull();
    });
  });

  describe('loadSearches', () => {
    it('should load searches successfully', async () => {
      const mockSearches = [mockSavedSearch];
      mockPropertyService.getSavedSearches.mockResolvedValue(mockSearches);
      
      const { result } = renderHook(() => useSavedSearchStore());
      
      await act(async () => {
        await result.current.loadSearches('user-123');
      });
      
      expect(mockPropertyService.getSavedSearches).toHaveBeenCalledWith('user-123');
      expect(result.current.searches).toEqual(mockSearches);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
      expect(result.current.lastUpdated).toBeGreaterThan(0);
    });

    it('should handle loading errors', async () => {
      const errorMessage = 'Failed to load searches';
      mockPropertyService.getSavedSearches.mockRejectedValue(new Error(errorMessage));
      
      const { result } = renderHook(() => useSavedSearchStore());
      
      await act(async () => {
        await result.current.loadSearches('user-123');
      });
      
      expect(result.current.searches).toEqual([]);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBe(errorMessage);
    });

    it('should set loading state during fetch', async () => {
      mockPropertyService.getSavedSearches.mockImplementation(() => new Promise(resolve => {
        setTimeout(() => resolve([mockSavedSearch]), 100);
      }));
      
      const { result } = renderHook(() => useSavedSearchStore());

      // Start the async operation inside act so updates are captured.
      await act(async () => {
        const promise = result.current.loadSearches('user-123');
        // Check loading state while the operation is in-flight
        await waitFor(() => expect(result.current.isLoading).toBe(true));
        await promise;
      });

      expect(result.current.isLoading).toBe(false);
    });
  });

  describe('addSearch', () => {
    it('should add a new search', () => {
      const { result } = renderHook(() => useSavedSearchStore());
      
      act(() => {
        result.current.addSearch(mockSavedSearch);
      });
      
      expect(result.current.searches).toHaveLength(1);
      expect(result.current.searches[0]).toEqual(mockSavedSearch);
      expect(result.current.lastUpdated).toBeGreaterThan(0);
    });

    it('should add multiple searches', () => {
      const { result } = renderHook(() => useSavedSearchStore());
      
      const mockSearch2 = { ...mockSavedSearch, id: 'search-2', name: 'Search 2' };
      
      act(() => {
        result.current.addSearch(mockSavedSearch);
        result.current.addSearch(mockSearch2);
      });
      
      expect(result.current.searches).toHaveLength(2);
      expect(result.current.searches[0]).toEqual(mockSavedSearch);
      expect(result.current.searches[1]).toEqual(mockSearch2);
    });
  });

  describe('removeSearch', () => {
    it('should remove a search successfully', async () => {
      mockPropertyService.deleteSavedSearch.mockResolvedValue(undefined);
      
      const { result } = renderHook(() => useSavedSearchStore());
      
      // Add a search first
      act(() => {
        result.current.addSearch(mockSavedSearch);
      });
      
      expect(result.current.searches).toHaveLength(1);
      
      await act(async () => {
        await result.current.removeSearch('search-1', 'user-123');
      });
      
      expect(mockPropertyService.deleteSavedSearch).toHaveBeenCalledWith('user-123', 'search-1');
      expect(result.current.searches).toHaveLength(0);
      expect(result.current.lastUpdated).toBeGreaterThan(0);
    });

    it('should handle removal errors', async () => {
      const errorMessage = 'Failed to delete search';
      mockPropertyService.deleteSavedSearch.mockRejectedValue(new Error(errorMessage));
      
      const { result } = renderHook(() => useSavedSearchStore());
      
      // Add a search first
      act(() => {
        result.current.addSearch(mockSavedSearch);
      });
      
      await act(async () => {
        await result.current.removeSearch('search-1', 'user-123');
      });
      
      expect(result.current.searches).toHaveLength(1); // Should not be removed
      expect(result.current.error).toBe(errorMessage);
      expect(result.current.isLoading).toBe(false);
    });

    it('should set loading state during removal', async () => {
      mockPropertyService.deleteSavedSearch.mockImplementation(() => new Promise(resolve => {
        setTimeout(() => resolve(undefined), 100);
      }));
      
      const { result } = renderHook(() => useSavedSearchStore());
      
      // Add a search first
      act(() => {
        result.current.addSearch(mockSavedSearch);
      });
      
      // Start the async operation inside act so updates are captured.
      await act(async () => {
        const promise = result.current.removeSearch('search-1', 'user-123');
        // Check loading state while the operation is in-flight
        await waitFor(() => expect(result.current.isLoading).toBe(true));
        await promise;
      });

      expect(result.current.isLoading).toBe(false);
    });

    it('should handle removing non-existent search', async () => {
      mockPropertyService.deleteSavedSearch.mockResolvedValue(undefined);
      
      const { result } = renderHook(() => useSavedSearchStore());
      
      await act(async () => {
        await result.current.removeSearch('non-existent', 'user-123');
      });
      
      expect(result.current.searches).toHaveLength(0);
      expect(mockPropertyService.deleteSavedSearch).toHaveBeenCalledWith('user-123', 'non-existent');
    });
  });

  describe('clearSearches', () => {
    it('should clear all searches', () => {
      const { result } = renderHook(() => useSavedSearchStore());
      
      // Add some searches
      act(() => {
        result.current.addSearch(mockSavedSearch);
        result.current.addSearch({ ...mockSavedSearch, id: 'search-2' });
      });
      
      expect(result.current.searches).toHaveLength(2);
      
      act(() => {
        result.current.clearSearches();
      });
      
      expect(result.current.searches).toEqual([]);
      expect(result.current.lastUpdated).toBeGreaterThan(0);
    });
  });

  describe('setLoading', () => {
    it('should update loading state', () => {
      const { result } = renderHook(() => useSavedSearchStore());
      
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
    it('should set error', () => {
      const { result } = renderHook(() => useSavedSearchStore());
      
      act(() => {
        result.current.setError('Search failed');
      });
      
      expect(result.current.error).toBe('Search failed');
    });

    it('should clear error when set to null', () => {
      const { result } = renderHook(() => useSavedSearchStore());
      
      act(() => {
        result.current.setError('Some error');
        result.current.setError(null);
      });
      
      expect(result.current.error).toBeNull();
    });
  });

  describe('setLastUpdated', () => {
    it('should update last updated timestamp', () => {
      const { result } = renderHook(() => useSavedSearchStore());
      
      const timestamp = Date.now();
      
      act(() => {
        result.current.setLastUpdated(timestamp);
      });
      
      expect(result.current.lastUpdated).toBe(timestamp);
    });
  });

  describe('reset', () => {
    it('should reset store to initial state', () => {
      const { result } = renderHook(() => useSavedSearchStore());
      
      // Set some state
      act(() => {
        result.current.addSearch(mockSavedSearch);
        result.current.setLoading(true);
        result.current.setError('Some error');
      });
      
      // Reset
      act(() => {
        result.current.reset();
      });
      
      expect(result.current.searches).toEqual([]);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
      expect(result.current.lastUpdated).toBeNull();
    });
  });

  describe('persistence', () => {
    it('should persist searches', () => {
      const { result } = renderHook(() => useSavedSearchStore());
      
      act(() => {
        result.current.addSearch(mockSavedSearch);
      });
      
      // Inspect localStorage directly to validate persisted searches
      const raw = localStorage.getItem('propchain-saved-searches');
      expect(raw).not.toBeNull();
      const parsed = JSON.parse(raw as string);
      expect(parsed.state.searches).toHaveLength(1);
      expect(parsed.state.searches[0]).toEqual(mockSavedSearch);
    });

    it('should not persist transient data', async () => {
      const { result } = renderHook(() => useSavedSearchStore());
      
      act(() => {
        result.current.addSearch(mockSavedSearch);
        result.current.setLoading(true);
        result.current.setError('Some error');
      });
      
      // Inspect localStorage directly to ensure transient fields were not persisted
      const raw = localStorage.getItem('propchain-saved-searches');
      expect(raw).not.toBeNull();
      const parsed = JSON.parse(raw as string);
      // partialize ensures only `searches` are persisted
      expect(parsed.state.isLoading).toBeUndefined();
      expect(parsed.state.error).toBeUndefined();
    });
  });

  describe('error handling', () => {
    it('should handle API errors gracefully', async () => {
      const error = new Error('Network error');
      mockPropertyService.getSavedSearches.mockRejectedValue(error);
      
      const { result } = renderHook(() => useSavedSearchStore());
      
      await act(async () => {
        await result.current.loadSearches('user-123');
      });
      
      expect(result.current.error).toBe('Network error');
      expect(result.current.isLoading).toBe(false);
    });

    it('should handle non-Error objects', async () => {
      mockPropertyService.getSavedSearches.mockRejectedValue('String error');
      
      const { result } = renderHook(() => useSavedSearchStore());
      
      await act(async () => {
        await result.current.loadSearches('user-123');
      });
      
      expect(result.current.error).toBe('String error');
    });
  });
});
