/**
 * Property Types and Interfaces
 * Core data structures for the property search and filtering system
 */

export type PropertyType = 'residential' | 'commercial' | 'industrial' | 'mixed-use';
export type PropertyStatus = 'active' | 'sold' | 'pending';
export type BlockchainNetwork = 'ethereum' | 'polygon' | 'bsc';

export interface PropertyLocation {
  address: string;
  city: string;
  state: string;
  country: string;
  zipCode: string;
  coordinates: {
    lat: number;
    lng: number;
  };
}

export interface PropertyPrice {
  total: number;
  perToken: number;
  currency: string;
}

export interface TokenInfo {
  totalSupply: number;
  available: number;
  sold: number;
  contractAddress: string;
  tokenSymbol: string;
}

export interface PropertyMetrics {
  roi: number; // Annual ROI percentage
  annualReturn: number; // Expected annual return in currency
  transactionVolume: number; // Total transaction volume
  appreciationRate: number; // Historical appreciation rate
}

export interface PropertyDetails {
  bedrooms?: number;
  bathrooms?: number;
  squareFeet: number;
  lotSize?: number;
  yearBuilt: number;
  parking?: number;
  amenities: string[];
}

export interface Property {
  id: string;
  name: string;
  description: string;
  location: PropertyLocation;
  price: PropertyPrice;
  propertyType: PropertyType;
  blockchain: BlockchainNetwork;
  tokenInfo: TokenInfo;
  metrics: PropertyMetrics;
  details: PropertyDetails;
  images: string[];
  listedDate: string;
  status: PropertyStatus;
  featured?: boolean;
  verified?: boolean;
}

export interface SearchFilters {
  query: string;
  priceRange: [number, number];
  propertyTypes: PropertyType[];
  blockchains: BlockchainNetwork[];
  roiMin: number;
  roiMax: number;
  location: string;
  bedrooms: number[];
  bathrooms: number[];
  squareFeetRange: [number, number];
  status: PropertyStatus[];
}

export type SortOption = 
  | 'price-asc' 
  | 'price-desc' 
  | 'roi-desc' 
  | 'roi-asc'
  | 'newest' 
  | 'oldest'
  | 'volume-desc';

export type ViewMode = 'grid' | 'list' | 'map';

export interface SearchState {
  filters: SearchFilters;
  sortBy: SortOption;
  viewMode: ViewMode;
  page: number;
  resultsPerPage: number;
  totalResults: number;
  isLoading: boolean;
  error: string | null;
}

export interface SavedSearch {
  id: string;
  name: string;
  filters: SearchFilters;
  sortBy: SortOption;
  createdAt: string;
  userId: string; // Wallet address
}

export interface PropertySearchResult {
  properties: Property[];
  total: number;
  page: number;
  totalPages: number;
}

export interface AutocompleteResult {
  type: 'property' | 'location';
  value: string;
  label: string;
  id?: string;
}

// Default filter values
export const DEFAULT_FILTERS: SearchFilters = {
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

// Property type labels
export const PROPERTY_TYPE_LABELS: Record<PropertyType, string> = {
  residential: 'Residential',
  commercial: 'Commercial',
  industrial: 'Industrial',
  'mixed-use': 'Mixed Use',
};

// Blockchain labels
export const BLOCKCHAIN_LABELS: Record<BlockchainNetwork, string> = {
  ethereum: 'Ethereum',
  polygon: 'Polygon',
  bsc: 'Binance Smart Chain',
};

// Sort option labels
export const SORT_LABELS: Record<SortOption, string> = {
  'price-asc': 'Price: Low to High',
  'price-desc': 'Price: High to Low',
  'roi-desc': 'ROI: High to Low',
  'roi-asc': 'ROI: Low to High',
  'newest': 'Newest First',
  'oldest': 'Oldest First',
  'volume-desc': 'Transaction Volume',
};
