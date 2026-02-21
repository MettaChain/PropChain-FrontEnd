import { isRecord } from "@/utils/typeGuards";

export interface MobileProperty {
  id: string;
  name: string;
  location: string;
  type: string;
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
    typeof value.type === "string" &&
    typeof value.value === "number" &&
    typeof value.tokens === "number" &&
    typeof value.roi === "number" &&
    typeof value.monthlyIncome === "number" &&
    isStringArray(value.images) &&
    typeof value.description === "string"
  );
};
