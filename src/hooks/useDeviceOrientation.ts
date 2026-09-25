"use client";

import { useState, useEffect, useRef, useCallback } from "react";
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

/**
 * Lifecycle of the iOS 13+ permission prompt, tracked so consumers can drive
 * UI copy/buttons off an explicit state instead of guessing (issue #1073).
 *   - "idle": supported but iOS permission is pending a user gesture
 *   - "requesting": the permission prompt is being shown
 *   - "granted"/"denied": resolved (or "unsupported" when the API is absent)
 */
type DeviceOrientationPermissionStatus =
  | "idle"
  | "requesting"
  | "granted"
  | "denied"
  | "unsupported";

interface UseDeviceOrientationReturn {
  orientation: DeviceOrientationData;
  isSupported: boolean;
  hasPermission: boolean;
  permissionStatus: DeviceOrientationPermissionStatus;
  requestPermission: () => Promise<boolean>;
  error: string | null;
  reset: () => void;
}

const INITIAL_ORIENTATION: DeviceOrientationData = {
  alpha: null,
  beta: null,
  gamma: null,
  absolute: false,
};

export const useDeviceOrientation = (): UseDeviceOrientationReturn => {
  const [orientation, setOrientation] =
    useState<DeviceOrientationData>(INITIAL_ORIENTATION);
  const [isSupported, setIsSupported] = useState(false);
  const [hasPermission, setHasPermission] = useState(false);
  const [permissionStatus, setPermissionStatus] =
    useState<DeviceOrientationPermissionStatus>("idle");
  const [error, setError] = useState<string | null>(null);

  // Live mirrors for async callbacks: `isMountedRef` guards setState calls in
  // the permission flow that can resolve after unmount (issue #1073), and
  // `isSupportedRef` avoids a stale closure in `requestPermission`.
  const isMountedRef = useRef(true);
  const isSupportedRef = useRef(false);

  const handleOrientationChange = useCallback(
    (event: DeviceOrientationEvent) => {
      setOrientation({
        alpha: event.alpha,
        beta: event.beta,
        gamma: event.gamma,
        absolute: event.absolute,
      });
    },
    [],
  );

  const startListening = useCallback(() => {
    if (typeof DeviceOrientationEvent !== "undefined") {
      window.addEventListener("deviceorientation", handleOrientationChange);
    }
  }, [handleOrientationChange]);

  const stopListening = useCallback(() => {
    if (typeof DeviceOrientationEvent !== "undefined") {
      window.removeEventListener("deviceorientation", handleOrientationChange);
    }
  }, [handleOrientationChange]);

  useEffect(() => {
    isMountedRef.current = true;

    // Check if DeviceOrientationEvent is supported
    if (typeof DeviceOrientationEvent === "undefined") {
      isSupportedRef.current = false;
      setIsSupported(false);
      setPermissionStatus("unsupported");
      setError("Device orientation is not supported on this device");
      return;
    }

    isSupportedRef.current = true;
    setIsSupported(true);
    setError(null);

    if (typeof getOrientationConstructor().requestPermission === "function") {
      // iOS 13+ — must be triggered from a user gesture. Do not start
      // listening until the user grants it, so the hook never silently
      // receives nothing (issue #1073).
      setPermissionStatus("idle");
      setHasPermission(false);
      stopListening();
    } else {
      // Android or older iOS — no permission required.
      setPermissionStatus("granted");
      setHasPermission(true);
      startListening();
    }

    return () => {
      isMountedRef.current = false;
      stopListening();
    };
  }, [startListening, stopListening]);

  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (!isSupportedRef.current) {
      setError("Device orientation is not supported");
      return false;
    }

    // Mark the prompt as in-flight so the UI can switch to a "requesting
    // permission…" state. Must be invoked from a user gesture (iOS).
    setPermissionStatus("requesting");

    try {
      const orientationConstructor = getOrientationConstructor();

      // For iOS 13+ devices
      if (typeof orientationConstructor.requestPermission === "function") {
        const permission = await orientationConstructor.requestPermission();

        if (!isMountedRef.current) return false;

        if (permission === "granted") {
          setPermissionStatus("granted");
          setHasPermission(true);
          setError(null);
          startListening();
          return true;
        }

        setPermissionStatus("denied");
        setHasPermission(false);
        stopListening();
        setError("Permission denied for device orientation");
        return false;
      }

      // For other devices, permission is not required.
      setPermissionStatus("granted");
      setHasPermission(true);
      startListening();
      return true;
    } catch (err) {
      if (!isMountedRef.current) return false;

      setPermissionStatus("denied");
      setHasPermission(false);
      stopListening();
      setError("Failed to request device orientation permission");
      logger.error("Device orientation permission error:", err);
      return false;
    }
  }, [startListening, stopListening]);

  const reset = useCallback(() => {
    stopListening();
    setOrientation(INITIAL_ORIENTATION);
    setHasPermission(false);
    setPermissionStatus(isSupported ? "idle" : "unsupported");
    setError(
      isSupported ? null : "Device orientation is not supported on this device",
    );
  }, [isSupported, stopListening]);

  return {
    orientation,
    isSupported,
    hasPermission,
    permissionStatus,
    requestPermission,
    error,
    reset,
  };
};