import type {
  Property,
  PropertyDetails,
  PropertyLocation,
  PropertyMetrics,
  PropertyPrice,
  TokenInfo,
} from './property';

export interface PropertyDetailServerProps {
  readonly property: Property;
}

export interface PropertyLocationDisplay {
  readonly fullAddress: string;
  readonly cityState: string;
}

export interface PropertyTokenAvailability {
  readonly available: number;
  readonly totalSupply: number;
  readonly formattedAvailability: string;
}

export interface PropertyCalculatorDefaults {
  readonly propertyPrice: number;
  readonly defaultYield: number;
}

export type PropertyDetailsWithBedrooms = PropertyDetails & { readonly bedrooms: number };
export type PropertyDetailsWithBathrooms = PropertyDetails & { readonly bathrooms: number };

export function formatPropertyLocation(location: PropertyLocation): PropertyLocationDisplay {
  return {
    fullAddress: `${location.address}, ${location.city}, ${location.state}`,
    cityState: `${location.city}, ${location.state}`,
  };
}

export function formatTokenAvailability(tokenInfo: TokenInfo): PropertyTokenAvailability {
  return {
    available: tokenInfo.available,
    totalSupply: tokenInfo.totalSupply,
    formattedAvailability: `${tokenInfo.available.toLocaleString()} / ${tokenInfo.totalSupply.toLocaleString()}`,
  };
}

export function hasBedrooms(details: PropertyDetails): details is PropertyDetailsWithBedrooms {
  return typeof details.bedrooms === 'number' && details.bedrooms > 0;
}

export function hasBathrooms(details: PropertyDetails): details is PropertyDetailsWithBathrooms {
  return typeof details.bathrooms === 'number' && details.bathrooms > 0;
}

export function getCalculatorDefaults(property: Property): PropertyCalculatorDefaults {
  return {
    propertyPrice: property.price.perToken,
    defaultYield: property.metrics.roi,
  };
}

export function getPropertyPriceValues(price: PropertyPrice): Pick<PropertyPrice, 'total' | 'perToken'> {
  return {
    total: price.total,
    perToken: price.perToken,
  };
}

export function getPropertyMetricsSummary(metrics: PropertyMetrics): Pick<PropertyMetrics, 'roi' | 'transactionVolume'> {
  return {
    roi: metrics.roi,
    transactionVolume: metrics.transactionVolume,
  };
}
