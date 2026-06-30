"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MapPin,
  Navigation,
  Search,
  Loader2,
  AlertCircle,
  Crosshair,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { MobilePropertyCard } from "./MobilePropertyCard";
import type { MobileProperty } from "@/types/mobileProperty";

interface LocationData {
  latitude: number;
  longitude: number;
  accuracy: number;
}

type SortKey = "distance" | "price" | "roi";

// --- Pure helpers (no component coupling, easy to unit-test) ---

function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const R = 3959; // Earth's radius in miles
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function getGeolocationErrorMessage(error: GeolocationPositionError): string {
  switch (error.code) {
    case error.PERMISSION_DENIED:
      return "Location access denied by user";
    case error.POSITION_UNAVAILABLE:
      return "Location information unavailable";
    case error.TIMEOUT:
      return "Location request timed out";
    default:
      return "Unable to retrieve location";
  }
}

function applyDistances(
  properties: MobileProperty[],
  location: LocationData,
): MobileProperty[] {
  return properties.map((p) => ({
    ...p,
    distance: calculateDistance(
      location.latitude,
      location.longitude,
      p.coordinates?.lat ?? 0,
      p.coordinates?.lng ?? 0,
    ),
  }));
}

function filterProperties(
  properties: MobileProperty[],
  searchQuery: string,
  selectedFilters: string[],
): MobileProperty[] {
  const query = searchQuery.toLowerCase();
  return properties.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(query) ||
      p.location.toLowerCase().includes(query);
    const matchesFilter =
      selectedFilters.length === 0 || selectedFilters.includes(p.type);
    return matchesSearch && matchesFilter;
  });
}

function sortProperties(
  properties: MobileProperty[],
  sortBy: SortKey,
): MobileProperty[] {
  return [...properties].sort((a, b) => {
    switch (sortBy) {
      case "distance":
        return (a.distance ?? 0) - (b.distance ?? 0);
      case "price":
        return a.value - b.value;
      case "roi":
        return b.roi - a.roi;
    }
  });
}

// --- Data ---

const MOCK_PROPERTIES: MobileProperty[] = [
  {
    id: "1",
    name: "Manhattan Tower Suite",
    location: "New York, NY",
    type: "Commercial",
    value: 524000,
    tokens: 1048,
    roi: 14.2,
    monthlyIncome: 3280,
    images: [
      "https://images.unsplash.com/photo-1486325212027-8081e485255e?w=800&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800&auto=format&fit=crop&q=80",
    ],
    description:
      "Premium commercial space in the heart of Manhattan with excellent foot traffic and modern amenities.",
    sqft: 2500,
    yearBuilt: 2018,
    amenities: ["Parking", "Security", "Elevator", "AC", "High-speed Internet"],
    distance: 0.3,
    coordinates: { lat: 40.7589, lng: -73.9851 },
  },
  {
    id: "2",
    name: "Sunset Beach Villa",
    location: "Miami, FL",
    type: "Residential",
    value: 389000,
    tokens: 778,
    roi: 11.8,
    monthlyIncome: 2450,
    images: [
      "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=800&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&auto=format&fit=crop&q=80",
    ],
    description:
      "Beautiful beachfront villa with stunning ocean views and private beach access.",
    bedrooms: 4,
    bathrooms: 3,
    sqft: 3200,
    yearBuilt: 2020,
    amenities: ["Pool", "Beach Access", "Garage", "Garden", "Ocean View"],
    distance: 1.2,
    coordinates: { lat: 25.7617, lng: -80.1918 },
  },
  {
    id: "3",
    name: "Tech Hub Office Complex",
    location: "San Francisco, CA",
    type: "Commercial",
    value: 892000,
    tokens: 1784,
    roi: 9.5,
    monthlyIncome: 5620,
    images: [
      "https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1497366811353-6870744d04b2?w=800&auto=format&fit=crop&q=80",
    ],
    description:
      "Modern office complex in the heart of Silicon Valley, perfect for tech companies.",
    sqft: 5000,
    yearBuilt: 2019,
    amenities: [
      "Parking",
      "Cafeteria",
      "Gym",
      "Conference Rooms",
      "Rooftop Terrace",
    ],
    distance: 2.8,
    coordinates: { lat: 37.7749, lng: -122.4194 },
  },
];

const FILTER_OPTIONS = ["Residential", "Commercial", "Industrial", "Mixed-Use"] as const;

const SORT_OPTIONS: Array<{ key: SortKey; label: string }> = [
  { key: "distance", label: "Distance" },
  { key: "price", label: "Price" },
  { key: "roi", label: "ROI" },
];

// --- Custom hooks ---

function useLocationDiscovery() {
  const [location, setLocation] = useState<LocationData | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);

  const requestLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setLocationError("Geolocation is not supported by this browser");
      return;
    }

    setIsLoadingLocation(true);
    setLocationError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
        });
        setIsLoadingLocation(false);
      },
      (error) => {
        setLocationError(getGeolocationErrorMessage(error));
        setIsLoadingLocation(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 300000 },
    );
  }, []);

  useEffect(() => {
    requestLocation();
  }, [requestLocation]);

  return { location, locationError, isLoadingLocation, requestLocation };
}

function useFilteredProperties(
  baseProperties: MobileProperty[],
  location: LocationData | null,
  searchQuery: string,
  selectedFilters: string[],
  sortBy: SortKey,
): MobileProperty[] {
  return useMemo(() => {
    const withDistances = location
      ? applyDistances(baseProperties, location)
      : baseProperties;
    const filtered = filterProperties(withDistances, searchQuery, selectedFilters);
    return sortProperties(filtered, sortBy);
  }, [baseProperties, location, searchQuery, selectedFilters, sortBy]);
}

// --- Component ---

export const LocationBasedDiscovery = () => {
  const { location, locationError, isLoadingLocation, requestLocation } =
    useLocationDiscovery();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilters, setSelectedFilters] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<SortKey>("distance");

  const properties = useFilteredProperties(
    MOCK_PROPERTIES,
    location,
    searchQuery,
    selectedFilters,
    sortBy,
  );

  const toggleFilter = useCallback((filter: string) => {
    setSelectedFilters((prev) =>
      prev.includes(filter) ? prev.filter((f) => f !== filter) : [...prev, filter],
    );
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10">
        <div className="p-4 space-y-4">
          {/* Location Status */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MapPin className="w-5 h-5 text-blue-600" />
              <div>
                <h2 className="font-semibold text-gray-900 dark:text-white">
                  Nearby Properties
                </h2>
                {location && (
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Within {Math.round(location.accuracy)}m accuracy
                  </p>
                )}
              </div>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={requestLocation}
              disabled={isLoadingLocation}
              className="flex items-center gap-2"
            >
              {isLoadingLocation ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Crosshair className="w-4 h-4" />
              )}
              {isLoadingLocation ? "Locating..." : "Update Location"}
            </Button>
          </div>

          {/* Location Error */}
          {locationError && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-2 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg"
            >
              <AlertCircle className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />
              <p className="text-sm text-yellow-800 dark:text-yellow-200">
                {locationError}
              </p>
            </motion.div>
          )}

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search properties or locations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Filters */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 overflow-x-auto pb-2">
              {FILTER_OPTIONS.map((filter) => (
                <Badge
                  key={filter}
                  variant={selectedFilters.includes(filter) ? "default" : "outline"}
                  className="cursor-pointer whitespace-nowrap"
                  onClick={() => toggleFilter(filter)}
                >
                  {filter}
                </Badge>
              ))}
            </div>

            {/* Sort Options */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Sort by:
              </span>
              <div className="flex gap-1">
                {SORT_OPTIONS.map(({ key, label }) => (
                  <Button
                    key={key}
                    variant={sortBy === key ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setSortBy(key)}
                    className="text-xs"
                  >
                    {label}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Properties List */}
      <div className="p-4">
        {properties.length === 0 ? (
          <div className="text-center py-12">
            <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              No properties found
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Try adjusting your search or filters
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Found {properties.length} properties
              {location && " nearby"}
            </p>

            {/* #488 fix: explicit list/article semantics for near-by property cards */}
            <ul
              role="list"
              aria-label={`Nearby properties, ${properties.length} ${properties.length === 1 ? 'item' : 'items'}`}
              className="grid grid-cols-1 gap-4 list-none p-0 m-0"
            >
              {properties.map((property, index) => (
                <li
                  key={property.id}
                  role="article"
                  aria-label={property.name}
                  className="relative list-none"
                >
                  <MobilePropertyCard property={property} index={index} />

                  {/* Distance Badge */}
                  {property.distance !== undefined && (
                    <div className="absolute top-3 right-3 z-10">
                      <Badge
                        variant="secondary"
                        className="bg-blue-600 text-white"
                      >
                        <Navigation className="w-3 h-3 mr-1" />
                        {property.distance.toFixed(1)}mi
                      </Badge>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};
