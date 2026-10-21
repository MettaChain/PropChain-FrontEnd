import type { GalleryProps } from './Gallery';
import type { ImageGalleryProps } from '../property/ImageGallery';

// Compile-time regression checks included in the project's strict typecheck.
export function checkGalleryTypes(props: GalleryProps): void {
  // @ts-expect-error Image collections must not be mutated by consumers.
  props.images.push('/extra.jpg');
  // @ts-expect-error Image URLs must be strings.
  const invalidImages: GalleryProps = { images: [123], label: 'Artwork' };
  // @ts-expect-error A collection must have an accessible label.
  const missingLabel: GalleryProps = { images: [] };
  // @ts-expect-error Empty-state copy must be text.
  const invalidCopy: GalleryProps = { images: [], label: 'Artwork', emptyTitle: 42 };
  const readonlyImages = ['/one.jpg'] as const;
  const reusable: GalleryProps = { images: readonlyImages, label: 'Artwork' };
  const property: ImageGalleryProps = { images: readonlyImages, propertyName: 'Villa' };
  void [invalidImages, missingLabel, invalidCopy, reusable, property];
}
