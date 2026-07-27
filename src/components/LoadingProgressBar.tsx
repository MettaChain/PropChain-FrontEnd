'use client';

import { useEffect, useState, useRef } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

/**
 * Security Audit Note:
 * 
 * This component has been audited for web3 security concerns (Issue #309).
 * 
 * **Finding:** This component does NOT contain any web3 integrations.
 * - No wallet connection logic
 * - No transaction signing functionality
 * - No network selection code
 * - No blockchain interaction
 * 
 * This is a pure UI component that displays a loading progress bar during route changes.
 * It only uses React hooks and Next.js navigation hooks for route change detection.
 * 
 * **Security Considerations:**
 * - User input: Only accepts controlled props (color, height, duration) with safe defaults
 * - No external API calls or data fetching
 * - No sensitive data handling
 * - No XSS vulnerabilities (props are used in style attributes with proper escaping)
 * 
 * **Recommendation:** No additional web3 security checks are needed for this component.
 */

interface LoadingProgressBarProps {
  /** Progress bar color (hex, rgb, or CSS color name). Default: '#2563eb' */
  color?: string;
  /** Height of the progress bar in pixels. Default: 3 */
  height?: number;
  /** Duration in milliseconds for the completion animation. Default: 300 */
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
