"use client";

import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { logger } from "@/utils/logger";
import {
  Camera,
  X,
  RotateCcw,
  ZoomIn,
  ZoomOut,
  Move3D,
  Info,
  Share2,
  Download,
  Loader2,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import type { MobileProperty } from "@/types/mobileProperty";

interface ARPropertyPreviewProps {
  property: MobileProperty;
  isOpen: boolean;
  onClose: () => void;
}

export const ARPropertyPreview = ({
  property,
  isOpen,
  onClose,
}: ARPropertyPreviewProps) => {
  const [isARSupported, setIsARSupported] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [isModelLoaded, setIsModelLoaded] = useState(false);
  const [showInfo, setShowInfo] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (isOpen) {
      checkARSupport();
      startCamera();
    } else {
      stopCamera();
    }

    return () => {
      stopCamera();
    };
  }, [isOpen]);

  const checkARSupport = () => {
    // Check for WebXR AR support
    if (navigator.xr) {
      navigator.xr
        .isSessionSupported("immersive-ar")
        .then((supported: boolean) => {
          setIsARSupported(supported);
          if (!supported) {
            setError("AR is not supported on this device");
          }
          setIsLoading(false);
        })
        .catch(() => {
          setIsARSupported(false);
          setError("Unable to check AR support");
          setIsLoading(false);
        });
    } else {
      setIsARSupported(false);
      setError("WebXR is not supported on this browser");
      setIsLoading(false);
    }
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "environment", // Use back camera
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      });

      setCameraStream(stream);

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    } catch (error) {
      logger.error("Error accessing camera:", error);
      setError("Unable to access camera");
    }
  };

  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach((track) => track.stop());
      setCameraStream(null);
    }
  };

  const handleARSession = async () => {
    if (!isARSupported || !navigator.xr) return;

    try {
      // This is a simplified AR implementation
      // In a real app, you would use WebXR or a library like AR.js or 8th Wall
      const session = await navigator.xr.requestSession(
        "immersive-ar",
        {
          requiredFeatures: ["local", "hit-test"],
        },
      );

      // Handle AR session
      logger.debug("AR session started:", session);
    } catch (error) {
      logger.error("Error starting AR session:", error);
      setError("Failed to start AR session");
    }
  };

  const handleCapture = () => {
    if (!canvasRef.current || !videoRef.current) return;

    const canvas = canvasRef.current;
    const video = videoRef.current;
    const ctx = canvas.getContext("2d");

    if (ctx) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      ctx.drawImage(video, 0, 0);

      // Convert to blob and trigger download
      canvas.toBlob((blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = `${property.name}-ar-preview.png`;
          a.click();
          URL.revokeObjectURL(url);
        }
      });
    }
  };

  const handleShare = async () => {
    if (!canvasRef.current || !videoRef.current) return;

    const canvas = canvasRef.current;
    const video = videoRef.current;
    const ctx = canvas.getContext("2d");

    if (ctx) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      ctx.drawImage(video, 0, 0);

      canvas.toBlob(async (blob) => {
        if (blob && navigator.share) {
          try {
            const file = new File([blob], `${property.name}-ar-preview.png`, {
              type: "image/png",
            });
            await navigator.share({
              title: `AR Preview: ${property.name}`,
              text: `Check out this AR preview of ${property.name}`,
              files: [file],
            });
          } catch (error) {
            logger.debug("Error sharing:", error);
          }
        }
      });
    }
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
              <Badge variant="secondary" className="bg-blue-600 text-white">
                AR Preview
              </Badge>
            </div>

            <div className="flex items-center gap-2">
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

        {/* Camera View */}
        <div className="relative w-full h-full">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center text-white">
                <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
                <p>Initializing AR...</p>
              </div>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center text-white max-w-sm mx-auto p-6">
                <AlertTriangle className="w-12 h-12 mx-auto mb-4 text-yellow-500" />
                <h3 className="text-lg font-semibold mb-2">AR Not Available</h3>
                <p className="text-sm text-gray-300 mb-4">{error}</p>
                <p className="text-xs text-gray-400">
                  AR features require a compatible device and browser. Try using
                  Chrome on Android or Safari on iOS.
                </p>
              </div>
            </div>
          ) : (
            <>
              {/* Video Stream */}
              <video
                ref={videoRef}
                className="w-full h-full object-cover"
                playsInline
                muted
              />

              {/* Hidden canvas for capture */}
              <canvas ref={canvasRef} className="hidden" />

              {/* AR Overlay Elements */}
              <div className="absolute inset-0 pointer-events-none">
                {/* Property Information Overlay */}
                <div className="absolute bottom-1/3 left-1/2 -translate-x-1/2 bg-black/80 text-white p-4 rounded-lg backdrop-blur-sm pointer-events-auto">
                  <h3 className="font-semibold text-lg mb-2">
                    {property.name}
                  </h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-300">Value</p>
                      <p className="font-semibold">
                        ${property.value.toLocaleString()}
                      </p>
                    </div>
                    {property.sqft && (
                      <div>
                        <p className="text-gray-300">Size</p>
                        <p className="font-semibold">
                          {property.sqft.toLocaleString()} sqft
                        </p>
                      </div>
                    )}
                  </div>

                  {property.bedrooms && property.bathrooms && (
                    <div className="flex gap-4 mt-2 text-sm">
                      <span>{property.bedrooms} bed</span>
                      <span>{property.bathrooms} bath</span>
                    </div>
                  )}
                </div>

                {/* AR Placement Indicator */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                  <div className="w-8 h-8 border-2 border-white rounded-full animate-pulse">
                    <div className="w-2 h-2 bg-white rounded-full absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                  </div>
                </div>

                {/* Instructions */}
                <div className="absolute top-20 left-1/2 -translate-x-1/2 text-center text-white">
                  <p className="text-sm bg-black/50 px-3 py-1 rounded-full">
                    Point camera at a flat surface
                  </p>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Property Info Panel */}
        <AnimatePresence>
          {showInfo && (
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              className="absolute top-0 right-0 w-80 h-full bg-black/90 text-white p-6 overflow-y-auto"
            >
              <div className="space-y-4">
                <div>
                  <h3 className="text-xl font-semibold mb-2">
                    {property.name}
                  </h3>
                  <p className="text-gray-300 text-sm">{property.location}</p>
                </div>

                <div className="space-y-3">
                  <div>
                    <p className="text-gray-400 text-sm">Property Type</p>
                    <p className="font-semibold">{property.type}</p>
                  </div>

                  <div>
                    <p className="text-gray-400 text-sm">Value</p>
                    <p className="font-semibold text-lg">
                      ${property.value.toLocaleString()}
                    </p>
                  </div>

                  {property.sqft && (
                    <div>
                      <p className="text-gray-400 text-sm">Square Footage</p>
                      <p className="font-semibold">
                        {property.sqft.toLocaleString()} sqft
                      </p>
                    </div>
                  )}

                  {property.bedrooms && property.bathrooms && (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-gray-400 text-sm">Bedrooms</p>
                        <p className="font-semibold">{property.bedrooms}</p>
                      </div>
                      <div>
                        <p className="text-gray-400 text-sm">Bathrooms</p>
                        <p className="font-semibold">{property.bathrooms}</p>
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <p className="text-gray-400 text-sm mb-2">Description</p>
                  <p className="text-sm leading-relaxed">
                    {property.description}
                  </p>
                </div>

                <div className="space-y-2">
                  <h4 className="font-semibold">AR Features</h4>
                  <ul className="text-sm text-gray-300 space-y-1">
                    <li>• 3D property visualization</li>
                    <li>• Real-time measurements</li>
                    <li>• Virtual furniture placement</li>
                    <li>• Interactive floor plans</li>
                  </ul>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Bottom Controls */}
        <motion.div
          initial={{ y: 100 }}
          animate={{ y: 0 }}
          className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4"
        >
          <div className="flex items-center justify-center gap-4">
            {isARSupported && !error && (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleARSession}
                  className="text-white hover:bg-white/20"
                >
                  <Move3D className="w-5 h-5" />
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  className="text-white hover:bg-white/20"
                >
                  <ZoomIn className="w-5 h-5" />
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  className="text-white hover:bg-white/20"
                >
                  <ZoomOut className="w-5 h-5" />
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  className="text-white hover:bg-white/20"
                >
                  <RotateCcw className="w-5 h-5" />
                </Button>
              </>
            )}

            <Button
              variant="ghost"
              size="sm"
              onClick={handleCapture}
              className="text-white hover:bg-white/20"
            >
              <Camera className="w-5 h-5" />
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={handleShare}
              className="text-white hover:bg-white/20"
            >
              <Share2 className="w-5 h-5" />
            </Button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
