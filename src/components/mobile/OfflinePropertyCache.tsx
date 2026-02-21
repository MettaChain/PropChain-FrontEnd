"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Download,
  Trash2,
  Wifi,
  WifiOff,
  HardDrive,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Card } from "@/components/ui/card";
import { isMobileProperty } from "@/types/mobileProperty";
import type { MobileProperty } from "@/types/mobileProperty";

interface CachedProperty {
  id: string;
  name: string;
  location: string;
  images: string[];
  data: MobileProperty;
  cachedAt: Date;
  size: number; // in bytes
  lastAccessed: Date;
}

interface OfflinePropertyCacheProps {
  properties: MobileProperty[];
  onPropertySelect?: (property: MobileProperty) => void;
}

export const OfflinePropertyCache = ({
  properties,
  onPropertySelect,
}: OfflinePropertyCacheProps) => {
  const [isOnline, setIsOnline] = useState(true);
  const [cachedProperties, setCachedProperties] = useState<CachedProperty[]>(
    [],
  );
  const [downloadProgress, setDownloadProgress] = useState<{
    [key: string]: number;
  }>({});
  const [storageUsed, setStorageUsed] = useState(0);
  const [storageQuota, setStorageQuota] = useState(0);
  const [isDownloading, setIsDownloading] = useState<{
    [key: string]: boolean;
  }>({});

  useEffect(() => {
    // Set initial online status after component mounts
    setIsOnline(navigator.onLine);

    // Listen for online/offline events
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Load cached properties from IndexedDB
    loadCachedProperties();

    // Check storage quota
    checkStorageQuota();

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const loadCachedProperties = async () => {
    try {
      // In a real app, this would load from IndexedDB
      const cached = localStorage.getItem("cachedProperties");
      if (cached) {
        const parsed: unknown = JSON.parse(cached);
        const parsedCached = Array.isArray(parsed)
          ? parsed
              .map((item): CachedProperty | null => {
                if (
                  typeof item !== "object" ||
                  item === null ||
                  !("data" in item) ||
                  !isMobileProperty(item.data)
                ) {
                  return null;
                }

                const cachedItem = item as {
                  id: string;
                  name: string;
                  location: string;
                  images: string[];
                  data: MobileProperty;
                  cachedAt: string | Date;
                  lastAccessed: string | Date;
                  size: number;
                };

                return {
                  ...cachedItem,
                  cachedAt: new Date(cachedItem.cachedAt),
                  lastAccessed: new Date(cachedItem.lastAccessed),
                };
              })
              .filter((item): item is CachedProperty => item !== null)
          : [];

        setCachedProperties(parsedCached);

        // Calculate total storage used
        const totalSize = parsedCached.reduce(
          (sum: number, prop: CachedProperty) => sum + prop.size,
          0,
        );
        setStorageUsed(totalSize);
      }
    } catch (error) {
      console.error("Error loading cached properties:", error);
    }
  };

  const checkStorageQuota = async () => {
    if ("storage" in navigator && "estimate" in navigator.storage) {
      try {
        const estimate = await navigator.storage.estimate();
        setStorageQuota(estimate.quota || 0);
        setStorageUsed(estimate.usage || 0);
      } catch (error) {
        console.error("Error checking storage quota:", error);
      }
    }
  };

  const downloadProperty = async (property: MobileProperty) => {
    if (isDownloading[property.id]) return;

    setIsDownloading((prev) => ({ ...prev, [property.id]: true }));
    setDownloadProgress((prev) => ({ ...prev, [property.id]: 0 }));

    try {
      // Simulate downloading property data and images
      const totalSteps = property.images.length + 1; // +1 for property data
      let completedSteps = 0;

      // Download property data
      await new Promise((resolve) => setTimeout(resolve, 500));
      completedSteps++;
      setDownloadProgress((prev) => ({
        ...prev,
        [property.id]: (completedSteps / totalSteps) * 100,
      }));

      // Download images
      for (const _image of property.images) {
        await new Promise((resolve) => setTimeout(resolve, 300));
        completedSteps++;
        setDownloadProgress((prev) => ({
          ...prev,
          [property.id]: (completedSteps / totalSteps) * 100,
        }));
      }

      // Calculate estimated size (in a real app, this would be actual file sizes)
      const estimatedSize = property.images.length * 500000 + 50000; // ~500KB per image + 50KB for data

      const cachedProperty: CachedProperty = {
        id: property.id,
        name: property.name,
        location: property.location,
        images: property.images,
        data: property,
        cachedAt: new Date(),
        lastAccessed: new Date(),
        size: estimatedSize,
      };

      // Save to cache
      const updatedCache = [...cachedProperties, cachedProperty];
      setCachedProperties(updatedCache);

      // Save to localStorage (in a real app, use IndexedDB)
      localStorage.setItem("cachedProperties", JSON.stringify(updatedCache));

      setStorageUsed((prev) => prev + estimatedSize);
    } catch (error) {
      console.error("Error downloading property:", error);
    } finally {
      setIsDownloading((prev) => ({ ...prev, [property.id]: false }));
      setDownloadProgress((prev) => ({ ...prev, [property.id]: 100 }));

      // Clear progress after a delay
      setTimeout(() => {
        setDownloadProgress((prev) => {
          const newProgress = { ...prev };
          delete newProgress[property.id];
          return newProgress;
        });
      }, 2000);
    }
  };

  const removeCachedProperty = async (propertyId: string) => {
    const propertyToRemove = cachedProperties.find((p) => p.id === propertyId);
    if (!propertyToRemove) return;

    const updatedCache = cachedProperties.filter((p) => p.id !== propertyId);
    setCachedProperties(updatedCache);

    localStorage.setItem("cachedProperties", JSON.stringify(updatedCache));
    setStorageUsed((prev) => prev - propertyToRemove.size);
  };

  const clearAllCache = async () => {
    setCachedProperties([]);
    localStorage.removeItem("cachedProperties");
    setStorageUsed(0);
  };

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const formatDate = (date: Date): string => {
    return (
      date.toLocaleDateString() +
      " " +
      date.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      })
    );
  };

  const isPropertyCached = (propertyId: string): boolean => {
    return cachedProperties.some((p) => p.id === propertyId);
  };

  const storagePercentage =
    storageQuota > 0 ? (storageUsed / storageQuota) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* Connection Status */}
      <Card className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {isOnline ? (
              <Wifi className="w-5 h-5 text-green-600" />
            ) : (
              <WifiOff className="w-5 h-5 text-red-600" />
            )}
            <div>
              <h3 className="font-semibold">
                {isOnline ? "Online" : "Offline"}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {isOnline
                  ? "Download properties for offline viewing"
                  : "Viewing cached properties only"}
              </p>
            </div>
          </div>

          <Badge variant={isOnline ? "default" : "secondary"}>
            {cachedProperties.length} cached
          </Badge>
        </div>
      </Card>

      {/* Storage Usage */}
      <Card className="p-4">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <HardDrive className="w-4 h-4" />
              <span className="font-medium">Storage Usage</span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={clearAllCache}
              disabled={cachedProperties.length === 0}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Clear All
            </Button>
          </div>

          <div className="space-y-2">
            <Progress value={storagePercentage} className="h-2" />
            <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
              <span>{formatBytes(storageUsed)} used</span>
              <span>{formatBytes(storageQuota)} total</span>
            </div>
          </div>
        </div>
      </Card>

      {/* Available Properties */}
      {isOnline && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Available Properties</h3>
          <div className="grid grid-cols-1 gap-4">
            {properties.map((property) => (
              <Card key={property.id} className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h4 className="font-medium">{property.name}</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {property.location}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                      ~
                      {formatBytes(
                        (property.images?.length || 0) * 500000 + 50000,
                      )}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    {isPropertyCached(property.id) ? (
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-600" />
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => removeCachedProperty(property.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => downloadProperty(property)}
                        disabled={isDownloading[property.id]}
                      >
                        {isDownloading[property.id] ? (
                          <RefreshCw className="w-4 h-4 animate-spin" />
                        ) : (
                          <Download className="w-4 h-4" />
                        )}
                      </Button>
                    )}
                  </div>
                </div>

                {/* Download Progress */}
                {downloadProgress[property.id] !== undefined && (
                  <div className="mt-3 space-y-2">
                    <Progress
                      value={downloadProgress[property.id]}
                      className="h-1"
                    />
                    <p className="text-xs text-gray-500">
                      Downloading... {Math.round(downloadProgress[property.id])}
                      %
                    </p>
                  </div>
                )}
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Cached Properties */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Cached Properties</h3>
          {!isOnline && (
            <Badge variant="secondary" className="flex items-center gap-1">
              <WifiOff className="w-3 h-3" />
              Offline Mode
            </Badge>
          )}
        </div>

        {cachedProperties.length === 0 ? (
          <Card className="p-8 text-center">
            <HardDrive className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h4 className="font-medium text-gray-900 dark:text-white mb-2">
              No cached properties
            </h4>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {isOnline
                ? "Download properties to view them offline"
                : "Connect to internet to download properties"}
            </p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {cachedProperties.map((property) => (
              <Card
                key={property.id}
                className="p-4 cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => onPropertySelect?.(property.data)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="font-medium">{property.name}</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {property.location}
                    </p>

                    <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        <span>Cached {formatDate(property.cachedAt)}</span>
                      </div>
                      <span>{formatBytes(property.size)}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      {property.images.length} images
                    </Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
                        e.stopPropagation();
                        removeCachedProperty(property.id);
                      }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Offline Notice */}
      {!isOnline && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="fixed bottom-4 left-4 right-4 bg-orange-100 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-3"
        >
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-orange-600 dark:text-orange-400" />
            <p className="text-sm text-orange-800 dark:text-orange-200">
              You're offline. Only cached properties are available.
            </p>
          </div>
        </motion.div>
      )}
    </div>
  );
};
