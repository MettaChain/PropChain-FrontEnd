/**
 * Property Runtime Schemas
 *
 * Zod schemas mirroring the `Property` domain types. These exist so data that
 * crosses an untrusted boundary (Redis cache payloads, persisted JSON) can be
 * validated before it is trusted as `Property` / `PropertySearchResult`.
 *
 * Keep these in sync with the interfaces in `./property`.
 */

import { z } from 'zod';
import {
  BLOCKCHAIN_NETWORKS,
  PROPERTY_STATUSES,
  PROPERTY_TYPES,
} from './property';

export const propertyLocationSchema = z.object({
  address: z.string(),
  city: z.string(),
  state: z.string(),
  country: z.string(),
  zipCode: z.string(),
  coordinates: z.object({
    lat: z.number(),
    lng: z.number(),
  }),
});

export const propertyPriceSchema = z.object({
  total: z.number(),
  perToken: z.number(),
  currency: z.string(),
});

export const tokenInfoSchema = z.object({
  totalSupply: z.number(),
  available: z.number(),
  sold: z.number(),
  contractAddress: z.string(),
  tokenSymbol: z.string(),
});

export const propertyMetricsSchema = z.object({
  roi: z.number(),
  annualReturn: z.number(),
  transactionVolume: z.number(),
  appreciationRate: z.number(),
});

export const propertyDetailsSchema = z.object({
  bedrooms: z.number().optional(),
  bathrooms: z.number().optional(),
  squareFeet: z.number(),
  lotSize: z.number().optional(),
  yearBuilt: z.number(),
  parking: z.number().optional(),
  amenities: z.array(z.string()),
});

export const propertySchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  location: propertyLocationSchema,
  price: propertyPriceSchema,
  propertyType: z.enum(PROPERTY_TYPES),
  blockchain: z.enum(BLOCKCHAIN_NETWORKS),
  tokenInfo: tokenInfoSchema,
  metrics: propertyMetricsSchema,
  details: propertyDetailsSchema,
  images: z.array(z.string()),
  listedDate: z.string(),
  status: z.enum(PROPERTY_STATUSES),
  featured: z.boolean().optional(),
  verified: z.boolean().optional(),
});

export const propertySearchResultSchema = z.object({
  properties: z.array(propertySchema),
  total: z.number(),
  page: z.number(),
  totalPages: z.number(),
});

export const autocompleteResultSchema = z.object({
  type: z.enum(['property', 'location']),
  value: z.string(),
  label: z.string(),
  id: z.string().optional(),
});

export const autocompleteResultsSchema = z.array(autocompleteResultSchema);

export const cacheStatsSchema = z.object({
  hits: z.number(),
  misses: z.number(),
  total: z.number(),
  hitRate: z.number(),
  lastUpdated: z.number(),
  invalid: z.number().optional(),
});
