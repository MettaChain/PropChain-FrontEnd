import { isRecord } from "@/utils/typeGuards";

export const PROPERTY_TYPES = [
  "Residential",
  "Commercial",
  "Industrial",
  "Mixed-Use",
] as const;

export type PropertyType = (typeof PROPERTY_TYPES)[number];

export const isPropertyType = (value: unknown): value is PropertyType =>
  PROPERTY_TYPES.includes(value as PropertyType);

export interface MobileProperty {
  id: string;
  name: string;
  location: string;
  type: PropertyType;
  value: number;
  tokens: number;
  roi: number;
  monthlyIncome: number;
  images: string[];
  videos?: string[];
  description: string;
  bedrooms?: number;
  bathrooms?: number;
  sqft?: number;
  yearBuilt?: number;
  amenities?: string[];
  distance?: number;
  coordinates?: {
    lat: number;
    lng: number;
  };
  arModel?: string;
}

const isStringArray = (value: unknown): value is string[] => {
  return Array.isArray(value) && value.every((item) => typeof item === "string");
};

export const isMobileProperty = (value: unknown): value is MobileProperty => {
  if (!isRecord(value)) return false;

  return (
    typeof value.id === "string" &&
    typeof value.name === "string" &&
    typeof value.location === "string" &&
    isPropertyType(value.type) &&
    typeof value.value === "number" &&
    typeof value.tokens === "number" &&
    typeof value.roi === "number" &&
    typeof value.monthlyIncome === "number" &&
    isStringArray(value.images) &&
    typeof value.description === "string"
  );
};
