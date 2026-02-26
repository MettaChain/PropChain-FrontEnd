"use client";

import { useState, useEffect } from "react";
import { logger } from "@/utils/logger";

type DeviceOrientationEventWithPermission = DeviceOrientationEventConstructor & {
  requestPermission?: () => Promise<"granted" | "denied">;
};

const getOrientationConstructor = (): DeviceOrientationEventWithPermission =>
  DeviceOrientationEvent as DeviceOrientationEventWithPermission;

interface DeviceOrientationData {
  alpha: number | null; // Z-axis rotation (0-360 degrees)
  beta: number | null; // X-axis rotation (-180 to 180 degrees)
  gamma: number | null; // Y-axis rotation (-90 to 90 degrees)
  absolute: boolean;
}

interface UseDeviceOrientationReturn {
  orientation: DeviceOrientationData;
  isSupported: boolean;
  hasPermission: boolean;
  requestPermission: () => Promise<boolean>;
  error: string | null;
}

export const useDeviceOrientation = (): UseDeviceOrientationReturn => {
  const [orientation, setOrientation] = useState<DeviceOrientationData>({
    alpha: null,
    beta: null,
    gamma: null,
    absolute: false,
  });
  const [isSupported, setIsSupported] = useState(false);
  const [hasPermission, setHasPermission] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check if DeviceOrientationEvent is supported
    if (typeof DeviceOrientationEvent !== "undefined") {
      setIsSupported(true);

      // For iOS 13+ devices, permission is required
      if (typeof getOrientationConstructor().requestPermission === "function") {
        // iOS device - permission required
        setHasPermission(false);
      } else {
        // Android or older iOS - no permission required
        setHasPermission(true);
        startListening();
      }
    } else {
      setIsSupported(false);
      setError("Device orientation is not supported on this device");
    }
  }, []);

  const handleOrientationChange = (event: DeviceOrientationEvent) => {
    setOrientation({
      alpha: event.alpha,
      beta: event.beta,
      gamma: event.gamma,
      absolute: event.absolute,
    });
  };

  const startListening = () => {
    if (typeof DeviceOrientationEvent !== "undefined") {
      window.addEventListener("deviceorientation", handleOrientationChange);
    }
  };

  const stopListening = () => {
    if (typeof DeviceOrientationEvent !== "undefined") {
      window.removeEventListener("deviceorientation", handleOrientationChange);
    }
  };

  const requestPermission = async (): Promise<boolean> => {
    if (!isSupported) {
      setError("Device orientation is not supported");
      return false;
    }

    try {
      // For iOS 13+ devices
      const orientationConstructor = getOrientationConstructor();
      if (typeof orientationConstructor.requestPermission === "function") {
        const permission = await orientationConstructor.requestPermission();

        if (permission === "granted") {
          setHasPermission(true);
          setError(null);
          startListening();
          return true;
        } else {
          setError("Permission denied for device orientation");
          return false;
        }
      } else {
        // For other devices, permission is not required
        setHasPermission(true);
        startListening();
        return true;
      }
    } catch (err) {
      setError("Failed to request device orientation permission");
      logger.error("Device orientation permission error:", err);
      return false;
    }
  };

  useEffect(() => {
    return () => {
      stopListening();
    };
  }, []);

  return {
    orientation,
    isSupported,
    hasPermission,
    requestPermission,
    error,
  };
};
