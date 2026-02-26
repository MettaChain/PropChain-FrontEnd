"use client";

import React from 'react';
import { ImagePlaceholder, SkeletonImage, Skeleton } from './ImagePlaceholder';
import { setupLazyLoading, preloadCriticalResources } from '@/lib/mobile-optimizer';

/**
 * Lazy Loading System Examples
 * 
 * This file demonstrates how to use the lazy loading system with:
 * - setupLazyLoading() for manual lazy loading
 * - preloadCriticalResources() for above-fold images
 * - SkeletonImage component for automatic lazy loading with placeholders
 * - ImagePlaceholder for custom loading states
 * - Skeleton for content loading states
 * 
 * Requirements: 5.2, 5.5
 */

/**
 * Example 1: Manual lazy loading with setupLazyLoading()
 * Use this approach when you have a container with multiple images
 */
export const ManualLazyLoadingExample: React.FC = () => {
  const containerRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (containerRef.current) {
      // Set up lazy loading for all images in the container
      setupLazyLoading(containerRef.current);
    }
  }, []);

  return (
    <div ref={containerRef} className="image-gallery">
      {/* Images with data-src will be lazy loaded */}
      <img
        data-src="/images/property-1.jpg"
        alt="Property 1"
        style={{ width: '100%', height: 'auto' }}
      />
      <img
        data-src="/images/property-2.jpg"
        alt="Property 2"
        style={{ width: '100%', height: 'auto' }}
      />
      <img
        data-src="/images/property-3.jpg"
        alt="Property 3"
        style={{ width: '100%', height: 'auto' }}
      />
    </div>
  );
};

/**
 * Example 2: Preloading critical above-fold images
 * Use this for images that should load immediately (hero images, first visible content)
 */
export const PreloadCriticalImagesExample: React.FC = () => {
  React.useEffect(() => {
    // Preload critical images that are above the fold
    preloadCriticalResources([
      '/images/hero-banner.jpg',
      '/images/featured-property.jpg',
    ]);
  }, []);

  return (
    <div>
      {/* These images will load immediately */}
      <img
        src="/images/hero-banner.jpg"
        alt="Hero Banner"
        style={{ width: '100%', height: 'auto' }}
      />
      <img
        src="/images/featured-property.jpg"
        alt="Featured Property"
        style={{ width: '100%', height: 'auto' }}
      />
    </div>
  );
};

/**
 * Example 3: Using SkeletonImage component (recommended)
 * This component handles lazy loading and placeholders automatically
 */
export const SkeletonImageExample: React.FC = () => {
  return (
    <div className="property-grid">
      {/* Skeleton placeholder while loading */}
      <SkeletonImage
        src="/images/property-1.jpg"
        alt="Property 1"
        width="100%"
        aspectRatio="16/9"
        placeholderVariant="skeleton"
        lazy={true}
      />

      {/* Blur placeholder */}
      <SkeletonImage
        src="/images/property-2.jpg"
        alt="Property 2"
        width="100%"
        aspectRatio="16/9"
        placeholderVariant="blur"
        lazy={true}
      />

      {/* Color placeholder */}
      <SkeletonImage
        src="/images/property-3.jpg"
        alt="Property 3"
        width="100%"
        aspectRatio="16/9"
        placeholderVariant="color"
        lazy={true}
      />

      {/* No lazy loading (above-fold image) */}
      <SkeletonImage
        src="/images/hero.jpg"
        alt="Hero Image"
        width="100%"
        aspectRatio="21/9"
        lazy={false}
      />
    </div>
  );
};

/**
 * Example 4: Using ImagePlaceholder for custom loading states
 */
export const CustomPlaceholderExample: React.FC = () => {
  const [isLoading, setIsLoading] = React.useState(true);

  return (
    <div style={{ position: 'relative', width: '100%', aspectRatio: '16/9' }}>
      {isLoading && (
        <ImagePlaceholder
          width="100%"
          aspectRatio="16/9"
          variant="skeleton"
          ariaLabel="Loading property image"
        />
      )}
      <img
        src="/images/property.jpg"
        alt="Property"
        onLoad={() => setIsLoading(false)}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          opacity: isLoading ? 0 : 1,
          transition: 'opacity 0.3s ease-in-out',
        }}
      />
    </div>
  );
};

/**
 * Example 5: Using Skeleton for content loading
 */
export const ContentSkeletonExample: React.FC = () => {
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    // Simulate data loading
    setTimeout(() => setIsLoading(false), 2000);
  }, []);

  if (isLoading) {
    return (
      <div className="property-card">
        {/* Image skeleton */}
        <Skeleton width="100%" height="200px" borderRadius="8px" />
        
        {/* Title skeleton */}
        <Skeleton width="80%" height="24px" borderRadius="4px" />
        
        {/* Description skeleton (3 lines) */}
        <Skeleton width="100%" height="16px" lines={3} />
        
        {/* Price skeleton */}
        <Skeleton width="40%" height="20px" borderRadius="4px" />
      </div>
    );
  }

  return (
    <div className="property-card">
      <img src="/images/property.jpg" alt="Property" />
      <h3>Beautiful Modern Home</h3>
      <p>This stunning property features 4 bedrooms, 3 bathrooms, and a spacious backyard.</p>
      <span className="price">$750,000</span>
    </div>
  );
};

/**
 * Example 6: Property listing with lazy loading and skeletons
 * Complete example showing best practices
 */
export const PropertyListingExample: React.FC = () => {
  const [properties, setProperties] = React.useState<any[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    // Preload hero image
    preloadCriticalResources(['/images/hero-property.jpg']);

    // Simulate API call
    setTimeout(() => {
      setProperties([
        { id: 1, image: '/images/property-1.jpg', title: 'Modern Villa', price: '$850,000' },
        { id: 2, image: '/images/property-2.jpg', title: 'Cozy Cottage', price: '$450,000' },
        { id: 3, image: '/images/property-3.jpg', title: 'Luxury Apartment', price: '$1,200,000' },
      ]);
      setIsLoading(false);
    }, 1500);
  }, []);

  return (
    <div className="property-listing">
      {/* Hero image - preloaded, no lazy loading */}
      <div className="hero">
        <SkeletonImage
          src="/images/hero-property.jpg"
          alt="Featured Property"
          width="100%"
          aspectRatio="21/9"
          lazy={false}
          placeholderVariant="skeleton"
        />
      </div>

      {/* Property grid - lazy loaded */}
      <div className="property-grid">
        {isLoading ? (
          // Show skeleton cards while loading
          Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="property-card">
              <Skeleton width="100%" height="200px" borderRadius="8px" />
              <Skeleton width="80%" height="24px" />
              <Skeleton width="100%" height="16px" lines={2} />
              <Skeleton width="40%" height="20px" />
            </div>
          ))
        ) : (
          // Show actual properties with lazy-loaded images
          properties.map((property) => (
            <div key={property.id} className="property-card">
              <SkeletonImage
                src={property.image}
                alt={property.title}
                width="100%"
                aspectRatio="4/3"
                lazy={true}
                placeholderVariant="skeleton"
              />
              <h3>{property.title}</h3>
              <p className="price">{property.price}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

/**
 * Usage Guidelines:
 * 
 * 1. Above-fold images (hero, featured content):
 *    - Use preloadCriticalResources() to load immediately
 *    - Set lazy={false} on SkeletonImage
 *    - These should be the first visible images
 * 
 * 2. Below-fold images (galleries, listings):
 *    - Use SkeletonImage with lazy={true}
 *    - Or use setupLazyLoading() for manual control
 *    - Choose appropriate placeholder variant
 * 
 * 3. Content loading states:
 *    - Use Skeleton component for text and UI elements
 *    - Match skeleton dimensions to actual content
 *    - Show skeletons during data fetching
 * 
 * 4. Performance tips:
 *    - Limit preloaded images to 1-2 critical images
 *    - Use appropriate aspect ratios to prevent layout shift
 *    - Consider using 'blur' variant for better perceived performance
 *    - Always provide alt text for accessibility
 */

export default PropertyListingExample;
