export enum ValuationTrend {
  Up = 'up',
  Down = 'down',
  Stable = 'stable',
}

export type ValuationConfidence = 'low' | 'medium' | 'high';

export interface ValuationHistoryEntry {
  date: string; // ISO 8601
  value: number;
  currency: string;
}

export interface ComparableSale {
  id: string;
  address: string;
  salePrice: number;
  saleDate: string; // ISO 8601
  areaSqm?: number;
  distanceKm?: number;
}

export interface PropertyValuation {
  propertyId: string;
  estimatedValue: number;
  currency: string;
  valuedAt: string; // ISO 8601
  confidence: ValuationConfidence;
  confidenceScore: number; // 0-1
  trend: ValuationTrend;
  history: ValuationHistoryEntry[];
  comparables: ComparableSale[];
}
