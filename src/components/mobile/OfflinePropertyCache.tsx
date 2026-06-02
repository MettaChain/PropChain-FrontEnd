"use client";

import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { logger } from "@/utils/logger";
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
  Settings,
  RotateCcw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import type { MobileProperty } from "@/types/mobileProperty";
import type { CacheStats, CacheEvent } from "@/types/cache";
import {
  getCachedMobileProperty,
  setCachedMobileProperty,
  deleteCachedMobileProperty,
  getAllCachedMobileProperties,
  clearAllCachedProperties,
  addCacheEventListener,
  updateCacheStats,
  getCacheStats,
  isCacheAvailable,
} from "@/lib/propertyCache";
import {
  initCacheManager,
  isNetworkOnline,
  addNetworkStateListener,
  performBackgroundSync,
  getSyncQueueLength,
  getCacheHealth,
  optimizeCache,
} from "@/lib/cacheManager";

interface CachedPropertyDisplay {
  id: string;
  name: string;
  location: string;
  images: string[];
  data: MobileProperty;
  cachedAt: Date;
  size: number;
  lastAccessed: Date;
  accessCount: number;
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
  const [isCacheReady, setIsCacheReady] = useState(false);
  const [cachedProperties, setCachedProperties] = useState<CachedPropertyDisplay[]>([]);
  const [downloadProgress, setDownloadProgress] = useState<{
    [key: string]: number;
  }>({});
  const [cacheStats, setCacheStats] = useState<CacheStats>({
    totalEntries: 0,
    totalSize: 0,
    storageQuota: 0,
    storageUsed: 0,
    hitRate: 0,
    missRate: 0,
    oldestEntry: null,
    newestEntry: null,
  });
  const [isDownloading, setIsDownloading] = useState<{
    [key: string]: boolean;
  }>({});
  const [syncQueueLength, setSyncQueueLength] = useState(0);
  const [showSettings, setShowSettings] = useState(false);
  const [autoSync, setAutoSync] = useState(true);
  const [healthIssues, setHealthIssues] = useState<string[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);

  // Initialize cache system
  useEffect(() => {
    const init = async () => {
      try {
        await initCacheManager();
        setIsCacheReady(true);
        await loadCachedProperties();
        await updateStats();
      } catch (error) {
        logger.error("Error initializing cache:", error);
      }
    };

    init();
  }, []);

  // Set up network state listener
  useEffect(() => {
    setIsOnline(isNetworkOnline());
    
    const unsubscribe = addNetworkStateListener((online) => {
      setIsOnline(online);
      if (online && autoSync) {
        performBackgroundSync();
      }
    });

    return unsubscribe;
  }, [autoSync]);

  // Set up cache event listener
  useEffect(() => {
    if (!isCacheReady) return;

    const unsubscribe = addCacheEventListener((event: CacheEvent) => {
      if (event.type === 'set' || event.type === 'delete' || event.type === 'clear') {
        loadCachedProperties();
        updateStats();
      }
    });

    return unsubscribe;
  }, [isCacheReady]);

  // Periodic stats update
  useEffect(() => {
    if (!isCacheReady) return;

    const interval = setInterval(() => {
      updateStats();
    }, 30000); // Update every 30 seconds

    return () => clearInterval(interval);
  }, [isCacheReady]);

  const loadCachedProperties = useCallback(async () => {
    try {
      const entries = await getAllCachedMobileProperties();
      const displayData: CachedPropertyDisplay[] = entries.map((entry) => ({
        id: entry.data.id,
        name: entry.data.name,
        location: entry.data.location,
        images: entry.data.images,
        data: entry.data,
        cachedAt: new Date(entry.metadata.cachedAt),
        size: entry.metadata.size,
        lastAccessed: new Date(entry.metadata.lastAccessed),
        accessCount: entry.metadata.accessCount,
      }));

      setCachedProperties(displayData);
    } catch (error) {
      logger.error("Error loading cached properties:", error);
    }
  }, []);

  const updateStats = useCallback(async () => {
    try {
      const stats = await updateCacheStats();
      setCacheStats(stats);
      setSyncQueueLength(getSyncQueueLength());
      
      // Check health
      const health = await getCacheHealth();
      setHealthIssues(health.issues);
    } catch (error) {
      logger.error("Error updating stats:", error);
    }
  }, []);

  const downloadProperty = async (property: MobileProperty) => {
    if (isDownloading[property.id]) return;

    setIsDownloading((prev) => ({ ...prev, [property.id]: true }));
    setDownloadProgress((prev) => ({ ...prev, [property.id]: 0 }));

    try {
      // Simulate downloading property data and images
      const totalSteps = property.images.length + 1;
      let completedSteps = 0;

      // Download property data
      await new Promise((resolve) => setTimeout(resolve, 300));
      completedSteps++;
      setDownloadProgress((prev) => ({
        ...prev,
        [property.id]: (completedSteps / totalSteps) * 100,
      }));

      // Download images
      for (const _image of property.images) {
        await new Promise((resolve) => setTimeout(resolve, 200));
        completedSteps++;
        setDownloadProgress((prev) => ({
          ...prev,
          [property.id]: (completedSteps / totalSteps) * 100,
        }));
      }

      // Cache the property
      await setCachedMobileProperty(property);
      
      logger.info(`Property ${property.id} cached successfully`);
    } catch (error) {
      logger.error("Error downloading property:", error);
    } finally {
      setIsDownloading((prev) => ({ ...prev, [property.id]: false }));
      setDownloadProgress((prev) => ({ ...prev, [property.id]: 100 }));

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
    try {
      await deleteCachedMobileProperty(propertyId);
      logger.info(`Property ${propertyId} removed from cache`);
    } catch (error) {
      logger.error("Error removing cached property:", error);
    }
  };

  const clearAllCache = async () => {
    try {
      await clearAllCachedProperties();
      logger.info("All cache cleared");
    } catch (error) {
      logger.error("Error clearing cache:", error);
    }
  };

  const handleOptimize = async () => {
    try {
      const result = await optimizeCache();
      logger.info(`Cache optimized: ${result.cleaned} entries cleaned`);
      await updateStats();
    } catch (error) {
      logger.error("Error optimizing cache:", error);
    }
  };

  const handleSync = async () => {
    setIsSyncing(true);
    try {
      await performBackgroundSync();
      await updateStats();
    } catch (error) {
      logger.error("Error during sync:", error);
    } finally {
      setIsSyncing(false);
    }
  };

  const isPropertyCached = (propertyId: string): boolean => {
    return cachedProperties.some((p) => p.id === propertyId);
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

  const storagePercentage =
    cacheStats.storageQuota > 0 ? (cacheStats.storageUsed / cacheStats.storageQuota) * 100 : 0;

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

          <div className="flex items-center gap-2">
            {!isCacheReady && (
              <Badge variant="outline">Initializing...</Badge>
            )}
            <Badge variant={isOnline ? "default" : "secondary"}>
              {cachedProperties.length} cached
            </Badge>
          </div>
        </div>
      </Card>

      {/* Cache Health Warnings */}
      {healthIssues.length > 0 && (
        <Card className="p-4 border-orange-200 dark:border-orange-800 bg-orange-50 dark:bg-orange-900/10">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-orange-600 dark:text-orange-400 mt-0.5" />
            <div className="flex-1">
              <h4 className="font-medium text-orange-800 dark:text-orange-200">
                Cache Health Issues
              </h4>
              <ul className="mt-1 space-y-1">
                {healthIssues.map((issue, index) => (
                  <li
                    key={index}
                    className="text-sm text-orange-700 dark:text-orange-300"
                  >
                    {issue}
                  </li>
                ))}
              </ul>
              <Button
                variant="outline"
                size="sm"
                className="mt-2"
                onClick={handleOptimize}
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Optimize Cache
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Storage Usage */}
      <Card className="p-4">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <HardDrive className="w-4 h-4" />
              <span className="font-medium">Storage Usage</span>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowSettings(!showSettings)}
              >
                <Settings className="w-4 h-4" />
              </Button>
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
          </div>

          <div className="space-y-2">
            <Progress value={storagePercentage} className="h-2" />
            <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
              <span>{formatBytes(cacheStats.storageUsed)} used</span>
              <span>{formatBytes(cacheStats.storageQuota)} total</span>
            </div>
          </div>

          {/* Cache Stats */}
          <div className="grid grid-cols-3 gap-2 pt-2 border-t border-gray-200 dark:border-gray-700">
            <div className="text-center">
              <div className="text-lg font-semibold">{cacheStats.totalEntries}</div>
              <div className="text-xs text-gray-500">Entries</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-semibold">
                {Math.round(cacheStats.hitRate * 100)}%
              </div>
              <div className="text-xs text-gray-500">Hit Rate</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-semibold">{syncQueueLength}</div>
              <div className="text-xs text-gray-500">Sync Queue</div>
            </div>
          </div>
        </div>
      </Card>

      {/* Settings Panel */}
      {showSettings && (
        <Card className="p-4">
          <h4 className="font-medium mb-4">Cache Settings</h4>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="auto-sync">Auto Sync</Label>
                <p className="text-sm text-gray-500">
                  Automatically sync when connection is restored
                </p>
              </div>
              <Switch
                id="auto-sync"
                checked={autoSync}
                onCheckedChange={setAutoSync}
              />
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleSync}
                disabled={!isOnline || isSyncing}
                className="flex-1"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${isSyncing ? 'animate-spin' : ''}`} />
                Sync Now
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleOptimize}
                className="flex-1"
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Optimize
              </Button>
            </div>
          </div>
        </Card>
      )}

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
