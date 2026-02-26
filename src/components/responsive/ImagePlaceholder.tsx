"use client";

import React from 'react';

/**
 * Image Placeholder Component
 * 
 * Provides loading placeholders and skeleton screens for lazy-loaded images.
 * Displays while images are loading to improve perceived performance.
 * 
 * Requirements: 5.2, 5.5
 */

export interface ImagePlaceholderProps {
  /**
   * Width of the placeholder (in pixels or CSS value)
   */
  width?: string | number;
  
  /**
   * Height of the placeholder (in pixels or CSS value)
   */
  height?: string | number;
  
  /**
   * Aspect ratio of the placeholder (e.g., "16/9", "4/3", "1/1")
   * If provided, height will be calculated automatically
   */
  aspectRatio?: string;
  
  /**
   * Type of placeholder to display
   * - 'skeleton': Animated skeleton screen (default)
   * - 'blur': Blurred placeholder
   * - 'color': Solid color background
   */
  variant?: 'skeleton' | 'blur' | 'color';
  
  /**
   * Background color for 'color' variant
   */
  backgroundColor?: string;
  
  /**
   * Additional CSS classes
   */
  className?: string;
  
  /**
   * Accessible label for screen readers
   */
  ariaLabel?: string;
}

/**
 * ImagePlaceholder component
 * Displays a loading placeholder while images are being lazy loaded
 */
export const ImagePlaceholder: React.FC<ImagePlaceholderProps> = ({
  width = '100%',
  height,
  aspectRatio,
  variant = 'skeleton',
  backgroundColor = '#e5e7eb',
  className = '',
  ariaLabel = 'Loading image',
}) => {
  // Convert numeric values to pixels
  const widthStyle = typeof width === 'number' ? `${width}px` : width;
  const heightStyle = height ? (typeof height === 'number' ? `${height}px` : height) : undefined;

  // Base styles
  const baseStyles: React.CSSProperties = {
    width: widthStyle,
    height: heightStyle,
    aspectRatio: aspectRatio,
    position: 'relative',
    overflow: 'hidden',
  };

  // Variant-specific styles
  const variantStyles: React.CSSProperties = (() => {
    switch (variant) {
      case 'skeleton':
        return {
          backgroundColor: '#e5e7eb',
          backgroundImage: 'linear-gradient(90deg, #e5e7eb 0%, #f3f4f6 50%, #e5e7eb 100%)',
          backgroundSize: '200% 100%',
          animation: 'shimmer 1.5s ease-in-out infinite',
        };
      case 'blur':
        return {
          backgroundColor: '#e5e7eb',
          filter: 'blur(10px)',
        };
      case 'color':
        return {
          backgroundColor: backgroundColor,
        };
      default:
        return {};
    }
  })();

  return (
    <>
      {/* Inject keyframes for skeleton animation */}
      {variant === 'skeleton' && (
        <style jsx>{`
          @keyframes shimmer {
            0% {
              background-position: -200% 0;
            }
            100% {
              background-position: 200% 0;
            }
          }
        `}</style>
      )}
      
      <div
        className={`image-placeholder ${className}`}
        style={{ ...baseStyles, ...variantStyles }}
        role="img"
        aria-label={ariaLabel}
        aria-busy="true"
      >
        {/* Optional: Add icon or text */}
      </div>
    </>
  );
};

/**
 * SkeletonImage component
 * Combines ImagePlaceholder with lazy loading functionality
 */
export interface SkeletonImageProps extends Omit<React.ImgHTMLAttributes<HTMLImageElement>, 'width' | 'height'> {
  /**
   * Image source URL
   */
  src: string;
  
  /**
   * Alt text for the image
   */
  alt: string;
  
  /**
   * Width of the image
   */
  width?: string | number;
  
  /**
   * Height of the image
   */
  height?: string | number;
  
  /**
   * Aspect ratio (e.g., "16/9", "4/3", "1/1")
   */
  aspectRatio?: string;
  
  /**
   * Placeholder variant
   */
  placeholderVariant?: 'skeleton' | 'blur' | 'color';
  
  /**
   * Whether to use lazy loading
   */
  lazy?: boolean;
  
  /**
   * Callback when image loads
   */
  onLoad?: () => void;
  
  /**
   * Callback when image fails to load
   */
  onError?: () => void;
}

export const SkeletonImage: React.FC<SkeletonImageProps> = ({
  src,
  alt,
  width = '100%',
  height,
  aspectRatio,
  placeholderVariant = 'skeleton',
  lazy = true,
  onLoad,
  onError,
  className = '',
  ...imgProps
}) => {
  const [isLoaded, setIsLoaded] = React.useState(false);
  const [hasError, setHasError] = React.useState(false);
  const imgRef = React.useRef<HTMLImageElement>(null);

  React.useEffect(() => {
    if (!lazy || !imgRef.current) {
      return;
    }

    // Set up Intersection Observer for lazy loading
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && imgRef.current) {
            const img = imgRef.current;
            const dataSrc = img.getAttribute('data-src');
            
            if (dataSrc) {
              img.src = dataSrc;
              img.removeAttribute('data-src');
              observer.unobserve(img);
            }
          }
        });
      },
      {
        rootMargin: '50px',
        threshold: 0.01,
      }
    );

    observer.observe(imgRef.current);

    return () => {
      observer.disconnect();
    };
  }, [lazy]);

  const handleLoad = () => {
    setIsLoaded(true);
    onLoad?.();
  };

  const handleError = () => {
    setHasError(true);
    onError?.();
  };

  const widthStyle = typeof width === 'number' ? `${width}px` : width;
  const heightStyle = height ? (typeof height === 'number' ? `${height}px` : height) : undefined;

  return (
    <div
      style={{
        position: 'relative',
        width: widthStyle,
        height: heightStyle,
        aspectRatio: aspectRatio,
      }}
      className={className}
    >
      {/* Show placeholder while loading */}
      {!isLoaded && !hasError && (
        <ImagePlaceholder
          width={width}
          height={height}
          aspectRatio={aspectRatio}
          variant={placeholderVariant}
          ariaLabel={`Loading ${alt}`}
        />
      )}

      {/* Show error state if image fails to load */}
      {hasError && (
        <div
          style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#f3f4f6',
            color: '#6b7280',
            fontSize: '14px',
          }}
          role="img"
          aria-label={`Failed to load ${alt}`}
        >
          <span>Image failed to load</span>
        </div>
      )}

      {/* Actual image */}
      <img
        ref={imgRef}
        {...(lazy ? { 'data-src': src } : { src })}
        alt={alt}
        onLoad={handleLoad}
        onError={handleError}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          opacity: isLoaded ? 1 : 0,
          transition: 'opacity 0.3s ease-in-out',
        }}
        {...imgProps}
      />
    </div>
  );
};

/**
 * Skeleton screen component for content loading
 * Can be used for text, cards, and other content types
 */
export interface SkeletonProps {
  /**
   * Width of the skeleton
   */
  width?: string | number;
  
  /**
   * Height of the skeleton
   */
  height?: string | number;
  
  /**
   * Border radius
   */
  borderRadius?: string | number;
  
  /**
   * Number of lines (for text skeletons)
   */
  lines?: number;
  
  /**
   * Additional CSS classes
   */
  className?: string;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  width = '100%',
  height = '20px',
  borderRadius = '4px',
  lines = 1,
  className = '',
}) => {
  const widthStyle = typeof width === 'number' ? `${width}px` : width;
  const heightStyle = typeof height === 'number' ? `${height}px` : height;
  const radiusStyle = typeof borderRadius === 'number' ? `${borderRadius}px` : borderRadius;

  if (lines === 1) {
    return (
      <>
        <style jsx>{`
          @keyframes shimmer {
            0% {
              background-position: -200% 0;
            }
            100% {
              background-position: 200% 0;
            }
          }
        `}</style>
        <div
          className={`skeleton ${className}`}
          style={{
            width: widthStyle,
            height: heightStyle,
            borderRadius: radiusStyle,
            backgroundColor: '#e5e7eb',
            backgroundImage: 'linear-gradient(90deg, #e5e7eb 0%, #f3f4f6 50%, #e5e7eb 100%)',
            backgroundSize: '200% 100%',
            animation: 'shimmer 1.5s ease-in-out infinite',
          }}
          role="status"
          aria-label="Loading content"
        />
      </>
    );
  }

  // Multiple lines
  return (
    <div className={className} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      {Array.from({ length: lines }).map((_, index) => (
        <Skeleton
          key={index}
          width={index === lines - 1 ? '80%' : width}
          height={height}
          borderRadius={borderRadius}
        />
      ))}
    </div>
  );
};

export default ImagePlaceholder;
