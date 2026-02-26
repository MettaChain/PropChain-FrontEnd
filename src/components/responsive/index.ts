/**
 * Responsive Components Export
 * 
 * Centralized exports for all responsive design components including:
 * - Image placeholders and skeleton screens
 * - Lazy loading components
 * - Responsive layout components (to be added)
 */

export {
  ImagePlaceholder,
  SkeletonImage,
  Skeleton,
  type ImagePlaceholderProps,
  type SkeletonImageProps,
  type SkeletonProps,
} from './ImagePlaceholder';

export {
  ManualLazyLoadingExample,
  PreloadCriticalImagesExample,
  SkeletonImageExample,
  CustomPlaceholderExample,
  ContentSkeletonExample,
  PropertyListingExample,
} from './LazyLoadingExample';

export {
  ResponsiveContainer,
  ResponsiveContainerFluid,
  type ResponsiveContainerProps,
} from './ResponsiveContainer';
