# Lazy Loading System Documentation

## Overview

The lazy loading system provides comprehensive image and content loading optimization for mobile devices. It includes:

- **Intersection Observer-based lazy loading** for below-fold images
- **Resource preloading** for above-fold critical images
- **Loading placeholders and skeleton screens** for better perceived performance
- **Automatic loading state management** with error handling
- **Smooth fade-in animations** for loaded content

**Requirements**: 5.2, 5.5

## Core Components

### 1. Mobile Optimizer (`src/lib/mobile-optimizer.ts`)

The core module providing lazy loading functionality:

#### `setupLazyLoading(container: HTMLElement)`

Sets up lazy loading for all images with `data-src` attribute within a container.

**Features**:
- Uses Intersection Observer for efficient viewport detection
- 50px root margin for early loading (better UX)
- Automatic fade-in animation when images load
- Error handling for failed image loads
- Cleanup mechanism to prevent memory leaks

**Usage**:
```typescript
import { setupLazyLoading } from '@/lib/mobile-optimizer';

const containerRef = useRef<HTMLDivElement>(null);

useEffect(() => {
  if (containerRef.current) {
    setupLazyLoading(containerRef.current);
  }
}, []);

return (
  <div ref={containerRef}>
    <img data-src="/images/property-1.jpg" alt="Property 1" />
    <img data-src="/images/property-2.jpg" alt="Property 2" />
  </div>
);
```

#### `preloadCriticalResources(urls: string[])`

Preloads critical above-fold images for immediate display.

**Features**:
- Uses `<link rel="preload">` for browser-level preloading
- Prevents duplicate preload tags
- Optimizes First Contentful Paint (FCP)

**Usage**:
```typescript
import { preloadCriticalResources } from '@/lib/mobile-optimizer';

useEffect(() => {
  preloadCriticalResources([
    '/images/hero-banner.jpg',
    '/images/featured-property.jpg',
  ]);
}, []);
```

### 2. Image Placeholder Components (`src/components/responsive/ImagePlaceholder.tsx`)

React components for loading states and skeleton screens.

#### `ImagePlaceholder`

Displays a loading placeholder while images are loading.

**Props**:
- `width`: Width of the placeholder (string or number)
- `height`: Height of the placeholder (string or number)
- `aspectRatio`: Aspect ratio (e.g., "16/9", "4/3", "1/1")
- `variant`: Placeholder type - 'skeleton' (animated), 'blur', or 'color'
- `backgroundColor`: Background color for 'color' variant
- `className`: Additional CSS classes
- `ariaLabel`: Accessible label for screen readers

**Usage**:
```tsx
<ImagePlaceholder
  width="100%"
  aspectRatio="16/9"
  variant="skeleton"
  ariaLabel="Loading property image"
/>
```

#### `SkeletonImage`

Complete image component with automatic lazy loading and placeholder.

**Props**:
- `src`: Image source URL
- `alt`: Alt text for the image
- `width`: Width of the image
- `height`: Height of the image
- `aspectRatio`: Aspect ratio
- `placeholderVariant`: Placeholder type ('skeleton', 'blur', 'color')
- `lazy`: Whether to use lazy loading (default: true)
- `onLoad`: Callback when image loads
- `onError`: Callback when image fails to load

**Usage**:
```tsx
<SkeletonImage
  src="/images/property.jpg"
  alt="Beautiful Property"
  width="100%"
  aspectRatio="16/9"
  placeholderVariant="skeleton"
  lazy={true}
/>
```

#### `Skeleton`

Generic skeleton component for content loading states.

**Props**:
- `width`: Width of the skeleton
- `height`: Height of the skeleton
- `borderRadius`: Border radius
- `lines`: Number of lines (for text skeletons)
- `className`: Additional CSS classes

**Usage**:
```tsx
{/* Single line */}
<Skeleton width="80%" height="24px" />

{/* Multiple lines */}
<Skeleton width="100%" height="16px" lines={3} />
```

### 3. Lazy Loading Styles (`src/styles/lazy-loading.css`)

CSS styles for lazy loading states and animations.

**Features**:
- Shimmer animation for skeleton screens
- Fade-in transition for loaded images
- Error state styling
- Responsive skeleton sizes
- Reduced motion support for accessibility
- Print-friendly styles

**Import in your layout or global styles**:
```tsx
import '@/styles/lazy-loading.css';
```

## Usage Patterns

### Pattern 1: Above-Fold Images (Hero, Featured Content)

For images that should load immediately:

```tsx
import { preloadCriticalResources } from '@/lib/mobile-optimizer';
import { SkeletonImage } from '@/components/responsive/ImagePlaceholder';

export const HeroSection = () => {
  useEffect(() => {
    // Preload critical images
    preloadCriticalResources(['/images/hero.jpg']);
  }, []);

  return (
    <SkeletonImage
      src="/images/hero.jpg"
      alt="Hero Banner"
      width="100%"
      aspectRatio="21/9"
      lazy={false} // Don't lazy load above-fold images
      placeholderVariant="skeleton"
    />
  );
};
```

### Pattern 2: Below-Fold Images (Galleries, Listings)

For images that should lazy load:

```tsx
import { SkeletonImage } from '@/components/responsive/ImagePlaceholder';

export const PropertyGallery = ({ images }) => {
  return (
    <div className="gallery">
      {images.map((image) => (
        <SkeletonImage
          key={image.id}
          src={image.url}
          alt={image.alt}
          width="100%"
          aspectRatio="4/3"
          lazy={true} // Lazy load below-fold images
          placeholderVariant="skeleton"
        />
      ))}
    </div>
  );
};
```

### Pattern 3: Content Loading States

For loading states during data fetching:

```tsx
import { Skeleton } from '@/components/responsive/ImagePlaceholder';

export const PropertyCard = ({ isLoading, property }) => {
  if (isLoading) {
    return (
      <div className="property-card">
        <Skeleton width="100%" height="200px" borderRadius="8px" />
        <Skeleton width="80%" height="24px" />
        <Skeleton width="100%" height="16px" lines={3} />
        <Skeleton width="40%" height="20px" />
      </div>
    );
  }

  return (
    <div className="property-card">
      <img src={property.image} alt={property.title} />
      <h3>{property.title}</h3>
      <p>{property.description}</p>
      <span>{property.price}</span>
    </div>
  );
};
```

### Pattern 4: Manual Lazy Loading

For custom implementations:

```tsx
import { setupLazyLoading, cleanupLazyLoading } from '@/lib/mobile-optimizer';

export const ImageGallery = () => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current) {
      setupLazyLoading(containerRef.current);
    }

    return () => {
      if (containerRef.current) {
        cleanupLazyLoading(containerRef.current);
      }
    };
  }, []);

  return (
    <div ref={containerRef}>
      <img data-src="/images/1.jpg" alt="Image 1" />
      <img data-src="/images/2.jpg" alt="Image 2" />
      <img data-src="/images/3.jpg" alt="Image 3" />
    </div>
  );
};
```

## Best Practices

### 1. Prioritize Critical Images

- **Preload** 1-2 critical above-fold images using `preloadCriticalResources()`
- **Don't lazy load** hero images, featured content, or first visible images
- **Lazy load** everything else below the fold

### 2. Use Appropriate Placeholders

- **Skeleton**: Best for most use cases, provides visual feedback
- **Blur**: Good for perceived performance, creates anticipation
- **Color**: Simplest option, use for decorative images

### 3. Maintain Layout Stability

- Always specify `aspectRatio` or both `width` and `height`
- This prevents Cumulative Layout Shift (CLS)
- Improves Core Web Vitals scores

### 4. Optimize Loading Experience

- Use 50px root margin (already configured) for early loading
- Implement smooth fade-in transitions (already included)
- Show error states for failed loads
- Provide meaningful alt text for accessibility

### 5. Performance Considerations

- Limit preloaded images to 1-2 critical images
- Use lazy loading for all below-fold images
- Consider connection speed when setting image quality
- Monitor image payload size (target: <500KB initial load)

## Accessibility

The lazy loading system includes built-in accessibility features:

- **ARIA labels**: All placeholders have appropriate `aria-label` attributes
- **Loading states**: Images have `aria-busy="true"` while loading
- **Reduced motion**: Respects `prefers-reduced-motion` user preference
- **Screen reader support**: Proper semantic HTML and ARIA attributes
- **Keyboard navigation**: All interactive elements are keyboard accessible

## Browser Support

- **Intersection Observer**: Supported in all modern browsers
- **Fallback**: Images load normally if Intersection Observer is unavailable
- **SSR Safe**: All functions handle server-side rendering gracefully

## Performance Metrics

The lazy loading system helps achieve:

- **FCP < 1.8s**: By preloading critical images and deferring below-fold images
- **LCP < 2.5s**: By optimizing largest contentful paint element
- **CLS < 0.1**: By maintaining consistent layout with aspect ratios
- **Image payload < 500KB**: By lazy loading non-critical images

## Testing

See `src/components/responsive/LazyLoadingExample.tsx` for comprehensive examples and test cases.

## Troubleshooting

### Images not lazy loading

- Ensure images have `data-src` attribute (not `src`)
- Verify `setupLazyLoading()` is called after DOM is ready
- Check browser console for Intersection Observer support

### Placeholders not showing

- Import `@/styles/lazy-loading.css` in your layout
- Verify component props are correct
- Check for CSS conflicts

### Performance issues

- Limit number of preloaded images
- Use appropriate image sizes and quality
- Monitor network tab for image requests
- Check Core Web Vitals in Lighthouse

## Related Documentation

- [Mobile Optimizer](./mobile-optimizer.md)
- [Responsive Images](./responsive-images.md)
- [Performance Optimization](./performance-optimization.md)
