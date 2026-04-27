/**
 * Property Types and Interfaces
 * Core data structures for the property search and filtering system
 */

export const PROPERTY_TYPES = ['residential', 'commercial', 'industrial', 'mixed-use'] as const;
export const PROPERTY_STATUSES = ['active', 'sold', 'pending'] as const;
export const BLOCKCHAIN_NETWORKS = ['ethereum', 'polygon', 'bsc'] as const;

export type PropertyType = (typeof PROPERTY_TYPES)[number];
export type PropertyStatus = (typeof PROPERTY_STATUSES)[number];
export type BlockchainNetwork = (typeof BLOCKCHAIN_NETWORKS)[number];

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

export interface SecondaryMarketListing {
  id: string;
  propertyId: string;
  propertyName: string;
  sellerAddress: string;
  tokenCount: number;
  pricePerToken: number;
  currency: string;
  listedDate: string;
  blockchain: BlockchainNetwork;
  propertyImage?: string;
}

export interface OrderBookEntry {
  price: number;
  amount: number;
  total: number;
  type: 'buy' | 'sell';
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

export const SORT_OPTIONS = [
  'price-asc',
  'price-desc',
  'roi-desc',
  'roi-asc',
  'newest',
  'oldest',
  'volume-desc',
] as const;

export type SortOption = (typeof SORT_OPTIONS)[number];

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

export const NOTIFICATION_FREQUENCIES = ['instant', 'daily', 'weekly'] as const;
export type NotificationFrequency = (typeof NOTIFICATION_FREQUENCIES)[number];

export interface SavedSearch {
  id: string;
  name: string;
  filters: SearchFilters;
  sortBy: SortOption;
  createdAt: string;
  userId: string; // Wallet address
  notificationFrequency: NotificationFrequency;
  emailNotifications: boolean;
  inAppNotifications: boolean;
  isActive: boolean;
  lastNotified?: string;
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

export interface PropertyAlert {
  id: string;
  savedSearchId: string;
  savedSearchName: string;
  matchingProperties: Property[];
  newPropertiesCount: number;
  createdAt: string;
  isRead: boolean;
  userId: string;
}

export interface NotificationSettings {
  email: string;
  inAppEnabled: boolean;
  emailEnabled: boolean;
  defaultFrequency: NotificationFrequency;
}

// Price Alert Types
export const PRICE_ALERT_TYPES = ['above', 'below', 'change'] as const;
export type PriceAlertType = (typeof PRICE_ALERT_TYPES)[number];

export interface PriceAlert {
  id: string;
  propertyId: string;
  propertyName: string;
  propertyImage?: string;
  alertType: PriceAlertType;
  targetPrice: number;
  currentPrice: number;
  changePercentage?: number; // For 'change' type alerts
  createdAt: string;
  isActive: boolean;
  isTriggered: boolean;
  triggeredAt?: string;
  userId: string;
  emailNotification: boolean;
}

export interface PriceAlertNotification {
  id: string;
  alertId: string;
  propertyId: string;
  propertyName: string;
  propertyImage?: string;
  alertType: PriceAlertType;
  targetPrice: number;
  triggeredPrice: number;
  message: string;
  createdAt: string;
  isRead: boolean;
  userId: string;
}

// Price alert labels
export const PRICE_ALERT_TYPE_LABELS: Record<PriceAlertType, string> = {
  above: 'Price Above',
  below: 'Price Below',
  change: 'Price Change',
};

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

// Notification frequency labels
export const NOTIFICATION_FREQUENCY_LABELS: Record<NotificationFrequency, string> = {
  instant: 'Instant',
  daily: 'Daily',
  weekly: 'Weekly',
};

export const isPropertyType = (value: string): value is PropertyType =>
  PROPERTY_TYPES.includes(value as PropertyType);

export const isPropertyStatus = (value: string): value is PropertyStatus =>
  PROPERTY_STATUSES.includes(value as PropertyStatus);

export const isBlockchainNetwork = (value: string): value is BlockchainNetwork =>
  BLOCKCHAIN_NETWORKS.includes(value as BlockchainNetwork);

export const isSortOption = (value: string): value is SortOption =>
  SORT_OPTIONS.includes(value as SortOption);

export const isNotificationFrequency = (value: string): value is NotificationFrequency =>
  NOTIFICATION_FREQUENCIES.includes(value as NotificationFrequency);
