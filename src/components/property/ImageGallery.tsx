'use client';

import { Gallery } from '@/components/gallery/Gallery';

export interface ImageGalleryProps {
  readonly images: readonly string[];
  readonly propertyName: string;
}

/** Property-specific copy for the shared Gallery. */
export function ImageGallery({ images, propertyName }: ImageGalleryProps) {
  return <Gallery images={images} label={propertyName} emptyDescription={`Photos of ${propertyName} have not been added yet. Check back later to explore this property.`} />;
}
