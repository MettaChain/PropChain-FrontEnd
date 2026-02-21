"use client";

import React, { useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import {
  MapPin,
  TrendingUp,
  TrendingDown,
  Heart,
  Share2,
  Eye,
  Bed,
  Bath,
  Square,
  Calendar,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MobilePropertyViewer } from "./MobilePropertyViewer";

interface Property {
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
}

interface MobilePropertyCardProps {
  property: Property;
  index: number;
  onView?: (property: Property) => void;
}

export const MobilePropertyCard = ({
  property,
  index,
  onView,
}: MobilePropertyCardProps) => {
  const [isSaved, setIsSaved] = useState(false);
  const [showViewer, setShowViewer] = useState(false);
  const isPositiveROI = property.roi >= 0;

  const handleShare = async (e: React.MouseEvent) => {
    e.stopPropagation();

    if (navigator.share) {
      try {
        await navigator.share({
          title: property.name,
          text: `Check out this property: ${property.name} in ${property.location}`,
          url: window.location.href,
        });
      } catch (error) {
        console.log("Error sharing:", error);
      }
    } else {
      navigator.clipboard.writeText(window.location.href);
    }
  };

  const handleSave = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsSaved(!isSaved);
  };

  const handleCardClick = () => {
    setShowViewer(true);
    onView?.(property);
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 * index }}
        onClick={handleCardClick}
        className="bg-white dark:bg-gray-800 rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer"
      >
        {/* Image Container */}
        <div className="relative h-48 overflow-hidden">
          <Image
            src={property.images[0]}
            alt={property.name}
            fill
            sizes="(max-width: 768px) 100vw, 50vw"
            className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
          />

          {/* Overlay Gradient */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />

          {/* Top Actions */}
          <div className="absolute top-3 left-3 right-3 flex justify-between items-start">
            <Badge
              variant="secondary"
              className="bg-black/50 text-white border-none"
            >
              {property.type}
            </Badge>

            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSave}
                className="w-8 h-8 p-0 bg-black/50 hover:bg-black/70 text-white"
              >
                <Heart
                  className={`w-4 h-4 ${isSaved ? "fill-red-500 text-red-500" : ""}`}
                />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleShare}
                className="w-8 h-8 p-0 bg-black/50 hover:bg-black/70 text-white"
              >
                <Share2 className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Image Counter */}
          {property.images.length > 1 && (
            <div className="absolute bottom-3 right-3 bg-black/50 text-white px-2 py-1 rounded-full text-xs flex items-center gap-1">
              <Eye className="w-3 h-3" />
              {property.images.length}
            </div>
          )}

          {/* ROI Badge */}
          <div className="absolute bottom-3 left-3">
            <Badge
              variant={isPositiveROI ? "default" : "destructive"}
              className={`${isPositiveROI ? "bg-green-600" : "bg-red-600"} text-white`}
            >
              {isPositiveROI ? (
                <TrendingUp className="w-3 h-3 mr-1" />
              ) : (
                <TrendingDown className="w-3 h-3 mr-1" />
              )}
              {isPositiveROI ? "+" : ""}
              {property.roi}%
            </Badge>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 space-y-3">
          {/* Title and Location */}
          <div>
            <h3 className="font-semibold text-lg text-gray-900 dark:text-white line-clamp-1">
              {property.name}
            </h3>
            <div className="flex items-center gap-1 text-gray-600 dark:text-gray-400 mt-1">
              <MapPin className="w-4 h-4" />
              <span className="text-sm line-clamp-1">{property.location}</span>
            </div>
          </div>

          {/* Property Details */}
          {property.bedrooms && property.bathrooms && (
            <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
              <div className="flex items-center gap-1">
                <Bed className="w-4 h-4" />
                <span>{property.bedrooms}</span>
              </div>
              <div className="flex items-center gap-1">
                <Bath className="w-4 h-4" />
                <span>{property.bathrooms}</span>
              </div>
              {property.sqft && (
                <div className="flex items-center gap-1">
                  <Square className="w-4 h-4" />
                  <span>{property.sqft.toLocaleString()}</span>
                </div>
              )}
            </div>
          )}

          {/* Financial Info */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Property Value
              </p>
              <p className="font-bold text-lg text-gray-900 dark:text-white">
                ${property.value.toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Monthly Income
              </p>
              <p className="font-bold text-lg text-green-600">
                ${property.monthlyIncome.toLocaleString()}
              </p>
            </div>
          </div>

          {/* Tokens Info */}
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Tokens Available
                </p>
                <p className="font-semibold text-gray-900 dark:text-white">
                  {property.tokens.toLocaleString()}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Min. Investment
                </p>
                <p className="font-semibold text-gray-900 dark:text-white">
                  $
                  {Math.round(
                    property.value / property.tokens,
                  ).toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          {/* Year Built */}
          {property.yearBuilt && (
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
              <Calendar className="w-4 h-4" />
              <span>Built in {property.yearBuilt}</span>
            </div>
          )}

          {/* Amenities Preview */}
          {property.amenities && property.amenities.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {property.amenities.slice(0, 2).map((amenity, index) => (
                <Badge key={index} variant="outline" className="text-xs">
                  {amenity}
                </Badge>
              ))}
              {property.amenities.length > 2 && (
                <Badge variant="outline" className="text-xs">
                  +{property.amenities.length - 2}
                </Badge>
              )}
            </div>
          )}
        </div>
      </motion.div>

      {/* Mobile Property Viewer */}
      <MobilePropertyViewer
        property={property}
        isOpen={showViewer}
        onClose={() => setShowViewer(false)}
      />
    </>
  );
};
