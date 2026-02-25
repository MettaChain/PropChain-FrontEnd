"use client";

import React, { useState, useRef, useEffect } from "react";

import Image from "next/image";
import { motion, AnimatePresence, type PanInfo } from "framer-motion";

import {
  X,
  Heart,
  Share2,
  Phone,
  MapPin,
  Camera,
  Play,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Info,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { MobileProperty } from "@/types/mobileProperty";

interface MobilePropertyViewerProps {
  property: MobileProperty;
  isOpen: boolean;
  onClose: () => void;
}

export const MobilePropertyViewer = ({
  property,
  isOpen,
  onClose,
}: MobilePropertyViewerProps) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isSaved, setIsSaved] = useState(false);
  const [showInfo, setShowInfo] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);

  // Reset state when property changes
  useEffect(() => {
    setCurrentImageIndex(0);
    setScale(1);
    setPosition({ x: 0, y: 0 });
    setIsFullscreen(false);
    setShowInfo(false);
  }, [property.id]);

  const handleSwipe = (_event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const threshold = 50;

    if (Math.abs(info.offset.x) > threshold) {
      if (info.offset.x > 0 && currentImageIndex > 0) {
        setCurrentImageIndex((prev) => prev - 1);
      } else if (
        info.offset.x < 0 &&
        currentImageIndex < property.images.length - 1
      ) {
        setCurrentImageIndex((prev) => prev + 1);
      }
    }
  };

  const handlePinchZoom = (scale: number) => {
    setScale(Math.max(1, Math.min(3, scale)));
  };

  const handleDoubleTap = () => {
    if (scale === 1) {
      setScale(2);
    } else {
      setScale(1);
      setPosition({ x: 0, y: 0 });
    }
  };

  const handleShare = async () => {
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
      // Fallback for browsers that don't support Web Share API
      navigator.clipboard.writeText(window.location.href);
    }
  };

  const handleContact = () => {
    // In a real app, this would open the phone dialer or contact form
    window.location.href = "tel:+1234567890";
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black"
      >
        {/* Header */}
        <motion.div
          initial={{ y: -100 }}
          animate={{ y: 0 }}
          className="absolute top-0 left-0 right-0 z-10 bg-gradient-to-b from-black/80 to-transparent p-4"
        >
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-white hover:bg-white/20"
            >
              <X className="w-5 h-5" />
            </Button>

            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsSaved(!isSaved)}
                className="text-white hover:bg-white/20"
              >
                <Heart
                  className={`w-5 h-5 ${isSaved ? "fill-red-500 text-red-500" : ""}`}
                />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleShare}
                className="text-white hover:bg-white/20"
              >
                <Share2 className="w-5 h-5" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowInfo(!showInfo)}
                className="text-white hover:bg-white/20"
              >
                <Info className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </motion.div>

        {/* Image Gallery */}
        <div
          ref={containerRef}
          className="relative w-full h-full overflow-hidden"
        >
          <motion.div
            drag={scale > 1 ? true : false}
            dragConstraints={containerRef}
            onPan={scale === 1 ? handleSwipe : undefined}
            onDoubleClick={handleDoubleTap}
            className="w-full h-full flex items-center justify-center"
            animate={{
              scale,
              x: position.x,
              y: position.y,
            }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          >
            <Image
              src={property.images[currentImageIndex]}
              alt={`${property.name} - Image ${currentImageIndex + 1}`}
              width={1200}
              height={900}
              sizes="100vw"
              className="max-w-full max-h-full object-contain"
            />
          </motion.div>

          {/* Navigation Arrows */}
          {property.images.length > 1 && scale === 1 && (
            <>
              {currentImageIndex > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setCurrentImageIndex((prev) => prev - 1)}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-white hover:bg-white/20"
                >
                  <ChevronLeft className="w-6 h-6" />
                </Button>
              )}

              {currentImageIndex < property.images.length - 1 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setCurrentImageIndex((prev) => prev + 1)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-white hover:bg-white/20"
                >
                  <ChevronRight className="w-6 h-6" />
                </Button>
              )}
            </>
          )}

          {/* Zoom Controls */}
          <div className="absolute bottom-20 right-4 flex flex-col gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handlePinchZoom(scale + 0.5)}
              className="text-white hover:bg-white/20"
            >
              <ZoomIn className="w-5 h-5" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handlePinchZoom(scale - 0.5)}
              className="text-white hover:bg-white/20"
            >
              <ZoomOut className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Image Counter */}
        <div className="absolute top-20 left-1/2 -translate-x-1/2 bg-black/50 text-white px-3 py-1 rounded-full text-sm">
          {currentImageIndex + 1} / {property.images.length}
        </div>

        {/* Thumbnail Strip */}
        <motion.div
          initial={{ y: 100 }}
          animate={{ y: 0 }}
          className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4"
        >
          <div className="flex gap-2 overflow-x-auto pb-2 mb-4">
            {property.images.map((image, index) => (
              <button
                key={index}
                onClick={() => setCurrentImageIndex(index)}
                className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 ${
                  index === currentImageIndex
                    ? "border-white"
                    : "border-transparent"
                }`}
              >
                  <Image
                    src={image}
                    alt={`Thumbnail ${index + 1}`}
                    width={64}
                    height={64}
                    sizes="64px"
                    className="w-full h-full object-cover"
                  />
              </button>
            ))}
          </div>

          {/* Property Info Overlay */}
          <AnimatePresence>
            {showInfo && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                className="bg-black/90 rounded-lg p-4 mb-4 text-white"
              >
                <h3 className="text-lg font-semibold mb-2">{property.name}</h3>
                <div className="flex items-center gap-2 mb-3">
                  <MapPin className="w-4 h-4" />
                  <span className="text-sm">{property.location}</span>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-3">
                  <div>
                    <p className="text-xs text-gray-300">Value</p>
                    <p className="font-semibold">
                      ${property.value.toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-300">ROI</p>
                    <p
                      className={`font-semibold ${property.roi >= 0 ? "text-green-400" : "text-red-400"}`}
                    >
                      {property.roi >= 0 ? "+" : ""}
                      {property.roi}%
                    </p>
                  </div>
                </div>

                {property.bedrooms && property.bathrooms && (
                  <div className="flex gap-4 mb-3 text-sm">
                    <span>{property.bedrooms} bed</span>
                    <span>{property.bathrooms} bath</span>
                    {property.sqft && (
                      <span>{property.sqft.toLocaleString()} sqft</span>
                    )}
                  </div>
                )}

                <p className="text-sm text-gray-300 mb-3">
                  {property.description}
                </p>

                {property.amenities && (
                  <div className="flex flex-wrap gap-2">
                    {property.amenities.slice(0, 3).map((amenity, index) => (
                      <Badge
                        key={index}
                        variant="secondary"
                        className="text-xs"
                      >
                        {amenity}
                      </Badge>
                    ))}
                    {property.amenities.length > 3 && (
                      <Badge variant="secondary" className="text-xs">
                        +{property.amenities.length - 3} more
                      </Badge>
                    )}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button
              onClick={handleContact}
              className="flex-1 bg-blue-600 hover:bg-blue-700"
            >
              <Phone className="w-4 h-4 mr-2" />
              Contact
            </Button>
            <Button
              variant="outline"
              className="flex-1 border-white text-white hover:bg-white hover:text-black"
            >
              <Camera className="w-4 h-4 mr-2" />
              Schedule Tour
            </Button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
