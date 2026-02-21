"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Filter,
  MapPin,
  Camera,
  Download,
  Grid3X3,
  List,
  ScanLine,
  Wifi,
  WifiOff,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MobilePropertyCard } from "@/components/mobile/MobilePropertyCard";
import { LocationBasedDiscovery } from "@/components/mobile/LocationBasedDiscovery";
import { ARPropertyPreview } from "@/components/mobile/ARPropertyPreview";
import { OfflinePropertyCache } from "@/components/mobile/OfflinePropertyCache";
import type { MobileProperty } from "@/types/mobileProperty";

// Enhanced property data with mobile-specific features
const properties: MobileProperty[] = [
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
      "https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&auto=format&fit=crop&q=80",
    ],
    description:
      "Premium commercial space in the heart of Manhattan with excellent foot traffic and modern amenities. Perfect for retail or office use.",
    sqft: 2500,
    yearBuilt: 2018,
    amenities: [
      "Parking",
      "Security",
      "Elevator",
      "AC",
      "High-speed Internet",
      "Conference Room",
    ],
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
      "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800&auto=format&fit=crop&q=80",
    ],
    description:
      "Beautiful beachfront villa with stunning ocean views and private beach access. Fully furnished with modern amenities.",
    bedrooms: 4,
    bathrooms: 3,
    sqft: 3200,
    yearBuilt: 2020,
    amenities: [
      "Pool",
      "Beach Access",
      "Garage",
      "Garden",
      "Ocean View",
      "Smart Home",
    ],
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
      "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800&auto=format&fit=crop&q=80",
    ],
    description:
      "Modern office complex in the heart of Silicon Valley, perfect for tech companies. Features state-of-the-art facilities.",
    sqft: 5000,
    yearBuilt: 2019,
    amenities: [
      "Parking",
      "Cafeteria",
      "Gym",
      "Conference Rooms",
      "Rooftop Terrace",
      "EV Charging",
    ],
    coordinates: { lat: 37.7749, lng: -122.4194 },
  },
  {
    id: "4",
    name: "Industrial Logistics Park",
    location: "Dallas, TX",
    type: "Industrial",
    value: 456000,
    tokens: 912,
    roi: 8.3,
    monthlyIncome: 2890,
    images: [
      "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=800&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1565008447742-97f6f38c985c?w=800&auto=format&fit=crop&q=80",
    ],
    description:
      "Strategic industrial facility with excellent logistics access and modern warehouse capabilities.",
    sqft: 15000,
    yearBuilt: 2017,
    amenities: [
      "Loading Docks",
      "Security",
      "Rail Access",
      "Truck Parking",
      "Office Space",
    ],
    coordinates: { lat: 32.7767, lng: -96.797 },
  },
  {
    id: "5",
    name: "Downtown Luxury Lofts",
    location: "Chicago, IL",
    type: "Residential",
    value: 312000,
    tokens: 624,
    roi: -2.1,
    monthlyIncome: 1980,
    images: [
      "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&auto=format&fit=crop&q=80",
    ],
    description:
      "Stylish urban lofts in downtown Chicago with exposed brick and modern finishes. Great city views.",
    bedrooms: 2,
    bathrooms: 2,
    sqft: 1800,
    yearBuilt: 2015,
    amenities: [
      "Gym",
      "Rooftop Deck",
      "Concierge",
      "Pet Friendly",
      "City Views",
    ],
    coordinates: { lat: 41.8781, lng: -87.6298 },
  },
  {
    id: "6",
    name: "Mixed-Use Development",
    location: "Austin, TX",
    type: "Mixed-Use",
    value: 274520,
    tokens: 549,
    roi: 16.7,
    monthlyIncome: 2020,
    images: [
      "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800&auto=format&fit=crop&q=80",
    ],
    description:
      "Innovative mixed-use development combining residential and commercial spaces in vibrant Austin.",
    bedrooms: 3,
    bathrooms: 2,
    sqft: 2200,
    yearBuilt: 2021,
    amenities: [
      "Retail Space",
      "Parking",
      "Community Garden",
      "Co-working Space",
      "Event Space",
    ],
    coordinates: { lat: 30.2672, lng: -97.7431 },
  },
];

export default function MobilePropertiesPage() {
  const [activeTab, setActiveTab] = useState("browse");
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [selectedProperty, setSelectedProperty] = useState<MobileProperty | null>(null);
  const [showARPreview, setShowARPreview] = useState(false);
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    // Set initial online status after component mounts
    setIsOnline(navigator.onLine);

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const filteredProperties = properties.filter(
    (property) =>
      property.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      property.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
      property.type.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const handlePropertyView = (property: MobileProperty) => {
    setSelectedProperty(property);
  };

  const handleARPreview = (property: MobileProperty) => {
    setSelectedProperty(property);
    setShowARPreview(true);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700 sticky top-0 z-40">
        <div className="p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">PC</span>
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                  Mobile Properties
                </h1>
                <div className="flex items-center gap-2">
                  {isOnline ? (
                    <Wifi className="w-4 h-4 text-green-600" />
                  ) : (
                    <WifiOff className="w-4 h-4 text-red-600" />
                  )}
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {isOnline ? "Online" : "Offline"}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() =>
                  setViewMode(viewMode === "grid" ? "list" : "grid")
                }
              >
                {viewMode === "grid" ? (
                  <List className="w-4 h-4" />
                ) : (
                  <Grid3X3 className="w-4 h-4" />
                )}
              </Button>
            </div>
          </div>

          {/* Search */}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search properties..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Tabs */}
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="w-full"
          >
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="browse" className="text-xs">
                <Grid3X3 className="w-4 h-4 mr-1" />
                Browse
              </TabsTrigger>
              <TabsTrigger value="nearby" className="text-xs">
                <MapPin className="w-4 h-4 mr-1" />
                Nearby
              </TabsTrigger>
              <TabsTrigger value="ar" className="text-xs">
                <Camera className="w-4 h-4 mr-1" />
                AR View
              </TabsTrigger>
              <TabsTrigger value="offline" className="text-xs">
                <Download className="w-4 h-4 mr-1" />
                Offline
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      {/* Content */}
      <div className="pb-20">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          {/* Browse Properties */}
          <TabsContent value="browse" className="p-4 space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {filteredProperties.length} properties found
              </p>
              <div className="flex gap-2">
                <Badge variant="outline">All Types</Badge>
                <Badge variant="outline">All Locations</Badge>
              </div>
            </div>

            <div
              className={`grid gap-4 ${
                viewMode === "grid"
                  ? "grid-cols-1 sm:grid-cols-2"
                  : "grid-cols-1"
              }`}
            >
              {filteredProperties.map((property, index) => (
                <div key={property.id} className="relative">
                  <MobilePropertyCard
                    property={property}
                    index={index}
                    onView={handlePropertyView}
                  />

                  {/* AR Button Overlay */}
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => handleARPreview(property)}
                    className="absolute top-3 right-14 bg-black/50 hover:bg-black/70 text-white border-none"
                  >
                    <ScanLine className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          </TabsContent>

          {/* Location-Based Discovery */}
          <TabsContent value="nearby" className="p-0">
            <LocationBasedDiscovery />
          </TabsContent>

          {/* AR Preview */}
          <TabsContent value="ar" className="p-4">
            <div className="space-y-4">
              <div className="text-center py-8">
                <Camera className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  AR Property Preview
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  Select a property to view in augmented reality
                </p>
              </div>

              <div className="grid grid-cols-1 gap-4">
                {properties.slice(0, 3).map((property) => (
                  <div
                    key={property.id}
                    onClick={() => handleARPreview(property)}
                    className="bg-white dark:bg-gray-800 rounded-lg p-4 cursor-pointer hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-center gap-4">
                      <img
                        src={property.images[0]}
                        alt={property.name}
                        className="w-16 h-16 rounded-lg object-cover"
                      />
                      <div className="flex-1">
                        <h4 className="font-medium">{property.name}</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {property.location}
                        </p>
                      </div>
                      <ScanLine className="w-5 h-5 text-blue-600" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>

          {/* Offline Cache */}
          <TabsContent value="offline" className="p-4">
            <OfflinePropertyCache
              properties={properties}
              onPropertySelect={handlePropertyView}
            />
          </TabsContent>
        </Tabs>
      </div>

      {/* AR Property Preview Modal */}
      {selectedProperty && showARPreview && (
        <ARPropertyPreview
          property={selectedProperty}
          isOpen={showARPreview}
          onClose={() => {
            setShowARPreview(false);
            setSelectedProperty(null);
          }}
        />
      )}

      {/* Bottom Navigation Hint */}
      <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-4">
        <div className="flex items-center justify-center gap-6">
          <div className="text-center">
            <div className="w-2 h-2 bg-blue-600 rounded-full mx-auto mb-1" />
            <span className="text-xs text-gray-600 dark:text-gray-400">
              Swipe for more
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
