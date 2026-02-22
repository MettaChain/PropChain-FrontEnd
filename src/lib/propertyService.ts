import type {
  BlockchainNetwork,
  Property,
  PropertyStatus,
  PropertyType,
  SearchFilters,
  PropertySearchResult,
  SortOption,
  AutocompleteResult,
  SavedSearch,
} from '@/types/property';
import { MOCK_PROPERTIES, getUniqueLocations } from './mockData';
import {
  isBlockchainNetwork,
  isPropertyStatus,
  isPropertyType,
  isSortOption,
} from '@/types/property';
import { isRecord } from '@/utils/typeGuards';

/**
 * Property Service
 * Handles property search, filtering, and data operations
 */

class PropertyService {
  /**
   * Search properties with filters and sorting
   */
  async searchProperties(
    filters: SearchFilters,
    sortBy: SortOption = 'newest',
    page: number = 1,
    resultsPerPage: number = 12
  ): Promise<PropertySearchResult> {
    // Simulate API delay
    await this.delay(300);

    let results = [...MOCK_PROPERTIES];

    // Apply filters
    results = this.applyFilters(results, filters);

    // Apply sorting
    results = this.applySorting(results, sortBy);

    // Calculate pagination
    const total = results.length;
    const totalPages = Math.ceil(total / resultsPerPage);
    const startIndex = (page - 1) * resultsPerPage;
    const endIndex = startIndex + resultsPerPage;
    const paginatedResults = results.slice(startIndex, endIndex);

    return {
      properties: paginatedResults,
      total,
      page,
      totalPages,
    };
  }

  /**
   * Get a single property by ID
   */
  async getPropertyById(id: string): Promise<Property | null> {
    await this.delay(200);
    return MOCK_PROPERTIES.find(p => p.id === id) || null;
  }

  /**
   * Get autocomplete suggestions
   */
  async getAutocompleteSuggestions(query: string): Promise<AutocompleteResult[]> {
    if (!query || query.length < 2) return [];

    await this.delay(150);

    const results: AutocompleteResult[] = [];
    const lowerQuery = query.toLowerCase();

    // Search property names
    MOCK_PROPERTIES.forEach(property => {
      if (property.name.toLowerCase().includes(lowerQuery)) {
        results.push({
          type: 'property',
          value: property.name,
          label: property.name,
          id: property.id,
        });
      }
    });

    // Search locations
    const locations = getUniqueLocations();
    locations.forEach(location => {
      if (location.toLowerCase().includes(lowerQuery)) {
        results.push({
          type: 'location',
          value: location,
          label: location,
        });
      }
    });

    return results.slice(0, 8); // Limit to 8 suggestions
  }

  /**
   * Get saved searches for a user
   */
  async getSavedSearches(userId: string): Promise<SavedSearch[]> {
    await this.delay(200);
    
    // Get from localStorage
    const saved = localStorage.getItem(`propchain-saved-searches-${userId}`);
    return parseSavedSearches(saved);
  }

  /**
   * Save a search for a user
   */
  async saveSearch(
    userId: string,
    name: string,
    filters: SearchFilters,
    sortBy: SortOption
  ): Promise<SavedSearch> {
    await this.delay(200);

    const savedSearch: SavedSearch = {
      id: this.generateId(),
      name,
      filters,
      sortBy,
      createdAt: new Date().toISOString(),
      userId,
    };

    const existing = await this.getSavedSearches(userId);
    const updated = [...existing, savedSearch];
    localStorage.setItem(`propchain-saved-searches-${userId}`, JSON.stringify(updated));

    return savedSearch;
  }

  /**
   * Delete a saved search
   */
  async deleteSavedSearch(userId: string, searchId: string): Promise<void> {
    await this.delay(200);

    const existing = await this.getSavedSearches(userId);
    const updated = existing.filter(s => s.id !== searchId);
    localStorage.setItem(`propchain-saved-searches-${userId}`, JSON.stringify(updated));
  }

  /**
   * Apply filters to properties
   */
  private applyFilters(properties: Property[], filters: SearchFilters): Property[] {
    return properties.filter(property => {
      // Query filter (search in name, description, location)
      if (filters.query) {
        const query = filters.query.toLowerCase();
        const searchableText = `
          ${property.name} 
          ${property.description} 
          ${property.location.city} 
          ${property.location.state}
          ${property.location.address}
        `.toLowerCase();
        
        if (!searchableText.includes(query)) return false;
      }

      // Price range filter
      if (property.price.total < filters.priceRange[0] || 
          property.price.total > filters.priceRange[1]) {
        return false;
      }

      // Property type filter
      if (filters.propertyTypes.length > 0 && 
          !filters.propertyTypes.includes(property.propertyType)) {
        return false;
      }

      // Blockchain filter
      if (filters.blockchains.length > 0 && 
          !filters.blockchains.includes(property.blockchain)) {
        return false;
      }

      // ROI filter
      if (property.metrics.roi < filters.roiMin || 
          property.metrics.roi > filters.roiMax) {
        return false;
      }

      // Location filter
      if (filters.location) {
        const locationQuery = filters.location.toLowerCase();
        const propertyLocation = `${property.location.city}, ${property.location.state}`.toLowerCase();
        if (!propertyLocation.includes(locationQuery)) return false;
      }

      // Bedrooms filter
      if (filters.bedrooms.length > 0 && property.details.bedrooms) {
        if (!filters.bedrooms.includes(property.details.bedrooms)) return false;
      }

      // Bathrooms filter
      if (filters.bathrooms.length > 0 && property.details.bathrooms) {
        if (!filters.bathrooms.includes(property.details.bathrooms)) return false;
      }

      // Square feet filter
      if (property.details.squareFeet < filters.squareFeetRange[0] || 
          property.details.squareFeet > filters.squareFeetRange[1]) {
        return false;
      }

      // Status filter
      if (filters.status.length > 0 && !filters.status.includes(property.status)) {
        return false;
      }

      return true;
    });
  }

  /**
   * Apply sorting to properties
   */
  private applySorting(properties: Property[], sortBy: SortOption): Property[] {
    const sorted = [...properties];

    switch (sortBy) {
      case 'price-asc':
        return sorted.sort((a, b) => a.price.total - b.price.total);
      
      case 'price-desc':
        return sorted.sort((a, b) => b.price.total - a.price.total);
      
      case 'roi-desc':
        return sorted.sort((a, b) => b.metrics.roi - a.metrics.roi);
      
      case 'roi-asc':
        return sorted.sort((a, b) => a.metrics.roi - b.metrics.roi);
      
      case 'newest':
        return sorted.sort((a, b) => 
          new Date(b.listedDate).getTime() - new Date(a.listedDate).getTime()
        );
      
      case 'oldest':
        return sorted.sort((a, b) => 
          new Date(a.listedDate).getTime() - new Date(b.listedDate).getTime()
        );
      
      case 'volume-desc':
        return sorted.sort((a, b) => 
          b.metrics.transactionVolume - a.metrics.transactionVolume
        );
      
      default:
        return sorted;
    }
  }

  /**
   * Simulate API delay
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Generate unique ID
   */
  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Export singleton instance
export const propertyService = new PropertyService();

const toNumberArray = (value: unknown): number[] =>
  Array.isArray(value) ? value.filter((item): item is number => typeof item === 'number') : [];

const toTuple = (value: unknown, fallback: [number, number]): [number, number] => {
  if (
    Array.isArray(value) &&
    value.length === 2 &&
    typeof value[0] === 'number' &&
    typeof value[1] === 'number'
  ) {
    return [value[0], value[1]];
  }

  return fallback;
};

const isSearchFilters = (value: unknown): value is SearchFilters => {
  if (!isRecord(value)) return false;

  const propertyTypes = Array.isArray(value.propertyTypes)
    ? value.propertyTypes.filter(
        (item): item is PropertyType => typeof item === 'string' && isPropertyType(item)
      )
    : [];

  const blockchains = Array.isArray(value.blockchains)
    ? value.blockchains.filter(
        (item): item is BlockchainNetwork =>
          typeof item === 'string' && isBlockchainNetwork(item)
      )
    : [];

  const status = Array.isArray(value.status)
    ? value.status.filter(
        (item): item is PropertyStatus => typeof item === 'string' && isPropertyStatus(item)
      )
    : [];

  return (
    typeof value.query === 'string' &&
    typeof value.roiMin === 'number' &&
    typeof value.roiMax === 'number' &&
    typeof value.location === 'string' &&
    propertyTypes.length === (Array.isArray(value.propertyTypes) ? value.propertyTypes.length : 0) &&
    blockchains.length === (Array.isArray(value.blockchains) ? value.blockchains.length : 0) &&
    status.length === (Array.isArray(value.status) ? value.status.length : 0) &&
    Array.isArray(value.priceRange) &&
    Array.isArray(value.squareFeetRange) &&
    Array.isArray(value.bedrooms) &&
    Array.isArray(value.bathrooms)
  );
};

const normalizeFilters = (value: SearchFilters): SearchFilters => ({
  query: value.query,
  priceRange: toTuple(value.priceRange, [0, 10000000]),
  propertyTypes: value.propertyTypes.filter(isPropertyType),
  blockchains: value.blockchains.filter(isBlockchainNetwork),
  roiMin: value.roiMin,
  roiMax: value.roiMax,
  location: value.location,
  bedrooms: toNumberArray(value.bedrooms),
  bathrooms: toNumberArray(value.bathrooms),
  squareFeetRange: toTuple(value.squareFeetRange, [0, 50000]),
  status: value.status.filter(isPropertyStatus),
});

const toSavedSearch = (value: unknown): SavedSearch | null => {
  if (!isRecord(value) || !isSearchFilters(value.filters)) {
    return null;
  }

  if (
    typeof value.id !== 'string' ||
    typeof value.name !== 'string' ||
    typeof value.createdAt !== 'string' ||
    typeof value.userId !== 'string' ||
    typeof value.sortBy !== 'string' ||
    !isSortOption(value.sortBy)
  ) {
    return null;
  }

  return {
    id: value.id,
    name: value.name,
    filters: normalizeFilters(value.filters),
    sortBy: value.sortBy,
    createdAt: value.createdAt,
    userId: value.userId,
  };
};

const parseSavedSearches = (raw: string | null): SavedSearch[] => {
  if (!raw) return [];

  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    return parsed
      .map((item) => toSavedSearch(item))
      .filter((item): item is SavedSearch => item !== null);
  } catch {
    return [];
  }
};
