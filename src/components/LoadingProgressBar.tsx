'use client';

import { useEffect, useState, useRef } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

interface LoadingProgressBarProps {
  color?: string;
  height?: number;
  duration?: number;
}

export const LoadingProgressBar: React.FC<LoadingProgressBarProps> = ({
  color = '#2563eb', // Brand blue color
  height = 3,
  duration = 300,
}) => {
  const [progress, setProgress] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const animationRef = useRef<number | null>(null);

  useEffect(() => {
    // Check if user prefers reduced motion
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
      return;
    }

    // Start progress on route change
    setIsVisible(true);
    setProgress(0);

    // Simulate progress increase
    let currentProgress = 0;
    const increment = () => {
      currentProgress += Math.random() * 15;
      if (currentProgress > 90) {
        currentProgress = 90; // Cap at 90% until route change completes
      }
      setProgress(currentProgress);
    };

    timerRef.current = setInterval(increment, 100);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [pathname, searchParams]);

  useEffect(() => {
    if (progress > 0 && progress < 100) {
      // Complete the progress when route changes
      setProgress(100);

      const completeTimer = setTimeout(() => {
        setIsVisible(false);
        setProgress(0);
      }, duration);

      return () => clearTimeout(completeTimer);
    }
    
    // Return undefined explicitly when condition is not met
    return undefined;
  }, [pathname, searchParams, progress, duration]);

  if (!isVisible) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        height: `${height}px`,
        zIndex: 9999,
        backgroundColor: 'transparent',
      }}
    >
      <div
        style={{
          height: '100%',
          width: `${progress}%`,
          backgroundColor: color,
          transition: progress === 100 ? `width ${duration}ms ease-out` : 'width 0.1s linear',
          boxShadow: `0 0 10px ${color}40, 0 0 5px ${color}80`,
        }}
      />
    </div>
  );
};
