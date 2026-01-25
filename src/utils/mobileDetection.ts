"use client";

export interface DeviceInfo {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  isIOS: boolean;
  isAndroid: boolean;
  isSafari: boolean;
  isChrome: boolean;
  hasTouch: boolean;
  screenSize: "small" | "medium" | "large";
  orientation: "portrait" | "landscape";
  pixelRatio: number;
}

export const getDeviceInfo = (): DeviceInfo => {
  if (typeof window === "undefined") {
    // Server-side fallback
    return {
      isMobile: false,
      isTablet: false,
      isDesktop: true,
      isIOS: false,
      isAndroid: false,
      isSafari: false,
      isChrome: false,
      hasTouch: false,
      screenSize: "large",
      orientation: "landscape",
      pixelRatio: 1,
    };
  }

  const userAgent = navigator.userAgent.toLowerCase();
  const width = window.innerWidth;
  const height = window.innerHeight;

  // Device type detection
  const isMobile =
    /android|webos|iphone|ipod|blackberry|iemobile|opera mini/i.test(
      userAgent,
    ) || width < 768;
  const isTablet =
    /ipad|android(?!.*mobile)|tablet/i.test(userAgent) ||
    (width >= 768 && width < 1024);
  const isDesktop = !isMobile && !isTablet;

  // OS detection
  const isIOS = /iphone|ipad|ipod/i.test(userAgent);
  const isAndroid = /android/i.test(userAgent);

  // Browser detection
  const isSafari = /safari/i.test(userAgent) && !/chrome/i.test(userAgent);
  const isChrome = /chrome/i.test(userAgent);

  // Touch support
  const hasTouch = "ontouchstart" in window || navigator.maxTouchPoints > 0;

  // Screen size categories
  let screenSize: "small" | "medium" | "large" = "large";
  if (width < 640) {
    screenSize = "small";
  } else if (width < 1024) {
    screenSize = "medium";
  }

  // Orientation
  const orientation = height > width ? "portrait" : "landscape";

  // Pixel ratio
  const pixelRatio = window.devicePixelRatio || 1;

  return {
    isMobile,
    isTablet,
    isDesktop,
    isIOS,
    isAndroid,
    isSafari,
    isChrome,
    hasTouch,
    screenSize,
    orientation,
    pixelRatio,
  };
};

export const isMobileDevice = (): boolean => {
  return getDeviceInfo().isMobile;
};

export const isTabletDevice = (): boolean => {
  return getDeviceInfo().isTablet;
};

export const isTouchDevice = (): boolean => {
  return getDeviceInfo().hasTouch;
};

export const getViewportSize = () => {
  if (typeof window === "undefined") {
    return { width: 1024, height: 768 };
  }

  return {
    width: window.innerWidth,
    height: window.innerHeight,
  };
};

export const getSafeAreaInsets = () => {
  if (typeof window === "undefined") {
    return { top: 0, right: 0, bottom: 0, left: 0 };
  }

  const style = getComputedStyle(document.documentElement);

  return {
    top: parseInt(style.getPropertyValue("--safe-area-inset-top") || "0"),
    right: parseInt(style.getPropertyValue("--safe-area-inset-right") || "0"),
    bottom: parseInt(style.getPropertyValue("--safe-area-inset-bottom") || "0"),
    left: parseInt(style.getPropertyValue("--safe-area-inset-left") || "0"),
  };
};

// Utility to detect if device supports AR
export const supportsAR = (): boolean => {
  if (typeof window === "undefined") return false;

  // Check for WebXR support
  if ("xr" in navigator) {
    return true;
  }

  // Check for WebRTC (used by some AR libraries)
  if ("mediaDevices" in navigator && "getUserMedia" in navigator.mediaDevices) {
    const deviceInfo = getDeviceInfo();
    // AR is generally better supported on mobile devices
    return deviceInfo.isMobile || deviceInfo.isTablet;
  }

  return false;
};

// Utility to detect if device supports geolocation
export const supportsGeolocation = (): boolean => {
  return typeof navigator !== "undefined" && "geolocation" in navigator;
};

// Utility to detect if device supports device orientation
export const supportsDeviceOrientation = (): boolean => {
  return typeof window !== "undefined" && "DeviceOrientationEvent" in window;
};

// Utility to detect if device supports vibration
export const supportsVibration = (): boolean => {
  return typeof navigator !== "undefined" && "vibrate" in navigator;
};

// Utility to detect if device supports Web Share API
export const supportsWebShare = (): boolean => {
  return typeof navigator !== "undefined" && "share" in navigator;
};

// Utility to detect if device supports Service Workers (for offline functionality)
export const supportsServiceWorker = (): boolean => {
  return typeof navigator !== "undefined" && "serviceWorker" in navigator;
};

// Utility to detect if device supports Push Notifications
export const supportsPushNotifications = (): boolean => {
  return (
    typeof window !== "undefined" &&
    "Notification" in window &&
    "serviceWorker" in navigator
  );
};
