"use client";

import { useEffect, useRef, useState } from "react";

interface GestureHandlers {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
  onPinch?: (scale: number) => void;
  onDoubleTap?: () => void;
  onLongPress?: () => void;
}

interface GestureOptions {
  threshold?: number;
  longPressDelay?: number;
  doubleTapDelay?: number;
}

export const useGestures = (
  handlers: GestureHandlers,
  options: GestureOptions = {},
) => {
  const {
    threshold = 50,
    longPressDelay = 500,
    doubleTapDelay = 300,
  } = options;

  const elementRef = useRef<HTMLElement>(null);
  const [touchStart, setTouchStart] = useState<{ x: number; y: number } | null>(
    null,
  );
  const [touchEnd, setTouchEnd] = useState<{ x: number; y: number } | null>(
    null,
  );
  const [lastTap, setLastTap] = useState<number>(0);
  const [longPressTimer, setLongPressTimer] = useState<NodeJS.Timeout | null>(
    null,
  );
  const [initialDistance, setInitialDistance] = useState<number>(0);

  const getDistance = (touch1: Touch, touch2: Touch): number => {
    const dx = touch1.clientX - touch2.clientX;
    const dy = touch1.clientY - touch2.clientY;
    return Math.sqrt(dx * dx + dy * dy);
  };

  const handleTouchStart = (e: TouchEvent) => {
    if (e.touches.length === 1) {
      const touch = e.touches[0];
      setTouchStart({ x: touch.clientX, y: touch.clientY });
      setTouchEnd(null);

      // Start long press timer
      const timer = setTimeout(() => {
        handlers.onLongPress?.();
      }, longPressDelay);
      setLongPressTimer(timer);
    } else if (e.touches.length === 2) {
      // Pinch gesture
      const distance = getDistance(e.touches[0], e.touches[1]);
      setInitialDistance(distance);

      // Clear long press timer for multi-touch
      if (longPressTimer) {
        clearTimeout(longPressTimer);
        setLongPressTimer(null);
      }
    }
  };

  const handleTouchMove = (e: TouchEvent) => {
    if (e.touches.length === 1) {
      const touch = e.touches[0];
      setTouchEnd({ x: touch.clientX, y: touch.clientY });

      // Clear long press timer on move
      if (longPressTimer) {
        clearTimeout(longPressTimer);
        setLongPressTimer(null);
      }
    } else if (e.touches.length === 2 && initialDistance > 0) {
      // Handle pinch
      const currentDistance = getDistance(e.touches[0], e.touches[1]);
      const scale = currentDistance / initialDistance;
      handlers.onPinch?.(scale);
    }
  };

  const handleTouchEnd = (e: TouchEvent) => {
    // Clear long press timer
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      setLongPressTimer(null);
    }

    if (!touchStart || !touchEnd) return;

    const deltaX = touchEnd.x - touchStart.x;
    const deltaY = touchEnd.y - touchStart.y;
    const absDeltaX = Math.abs(deltaX);
    const absDeltaY = Math.abs(deltaY);

    // Check for swipe gestures
    if (Math.max(absDeltaX, absDeltaY) > threshold) {
      if (absDeltaX > absDeltaY) {
        // Horizontal swipe
        if (deltaX > 0) {
          handlers.onSwipeRight?.();
        } else {
          handlers.onSwipeLeft?.();
        }
      } else {
        // Vertical swipe
        if (deltaY > 0) {
          handlers.onSwipeDown?.();
        } else {
          handlers.onSwipeUp?.();
        }
      }
    } else {
      // Check for double tap
      const now = Date.now();
      if (now - lastTap < doubleTapDelay) {
        handlers.onDoubleTap?.();
        setLastTap(0); // Reset to prevent triple tap
      } else {
        setLastTap(now);
      }
    }

    // Reset touch positions
    setTouchStart(null);
    setTouchEnd(null);
    setInitialDistance(0);
  };

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    element.addEventListener("touchstart", handleTouchStart, {
      passive: false,
    });
    element.addEventListener("touchmove", handleTouchMove, { passive: false });
    element.addEventListener("touchend", handleTouchEnd, { passive: false });

    return () => {
      element.removeEventListener("touchstart", handleTouchStart);
      element.removeEventListener("touchmove", handleTouchMove);
      element.removeEventListener("touchend", handleTouchEnd);

      if (longPressTimer) {
        clearTimeout(longPressTimer);
      }
    };
  }, [touchStart, touchEnd, lastTap, longPressTimer, initialDistance]);

  return elementRef;
};
