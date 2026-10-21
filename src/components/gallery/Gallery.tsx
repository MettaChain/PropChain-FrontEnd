'use client';

import { useState } from 'react';
import Image from 'next/image';
import { ImageIcon } from 'lucide-react';
import { ErrorBoundary } from '@/components/ui/SimpleErrorBoundary';
import { ImageLightbox } from './ImageLightbox';

export interface GalleryProps {
  /** Image URLs in display order; the first image is featured. */
  readonly images: readonly string[];
  /** Accessible name and image description for this collection. */
  readonly label: string;
  readonly emptyTitle?: string;
  readonly emptyDescription?: string;
}

/** Reusable image grid with an accessible empty state and lightbox. */
export function Gallery(props: GalleryProps) {
  return (
    <ErrorBoundary>
      <GalleryContent key={JSON.stringify(props.images)} {...props} />
    </ErrorBoundary>
  );
}

function GalleryContent({
  images,
  label,
  emptyTitle = 'No images available',
  emptyDescription = 'Images will appear here when they are added.',
}: GalleryProps) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [mainImageLoaded, setMainImageLoaded] = useState(false);
  const mainImage = images[0];
  const focusClasses = 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background';

  if (mainImage === undefined) {
    return (
      <section aria-label={label} className="flex min-h-[400px] items-center justify-center rounded-xl border border-border bg-muted p-6 text-center text-foreground">
        <div role="status">
          <ImageIcon aria-hidden="true" className="mx-auto mb-4 h-16 w-16 text-muted-foreground" />
          <h3 className="text-lg font-semibold">{emptyTitle}</h3>
          <p className="mt-2 max-w-sm text-sm text-muted-foreground">{emptyDescription}</p>
        </div>
      </section>
    );
  }

  return (
    <section aria-label={label} className="space-y-4">
      <button type="button" aria-label={`View all ${images.length} images of ${label}`} onClick={() => setLightboxIndex(0)} className={`group relative block w-full overflow-hidden rounded-xl bg-muted ${focusClasses}`}>
        <Image src={mainImage} alt={label} width={800} height={600} onLoad={() => setMainImageLoaded(true)} onError={() => setMainImageLoaded(true)} className="h-[400px] w-full object-cover transition-transform duration-300 group-hover:scale-105" />
        {!mainImageLoaded && <span aria-hidden="true" className="pointer-events-none absolute inset-0 animate-pulse bg-muted" />}
        <span className="absolute inset-0 flex items-center justify-center bg-black/0 transition-colors group-hover:bg-black/20 group-focus-visible:bg-black/20">
          <span className="rounded-lg bg-background/95 px-4 py-2 font-medium text-foreground opacity-0 shadow-sm backdrop-blur-sm transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">View all {images.length} images</span>
        </span>
      </button>
      {images.length > 1 && (
        <div className="grid grid-cols-4 gap-2">
          {images.slice(1, 5).map((image, index) => (
            <button key={index + 1} type="button" aria-label={`View image ${index + 2} of ${label}`} onClick={() => setLightboxIndex(index + 1)} className={`group relative overflow-hidden rounded-lg bg-muted ${focusClasses}`}>
              <Image src={image} alt={`${label} - Image ${index + 2}`} width={200} height={150} className="h-24 w-full object-cover transition-transform duration-300 group-hover:scale-110" />
              <span aria-hidden="true" className="absolute inset-0 bg-black/0 transition-colors group-hover:bg-black/30" />
            </button>
          ))}
          {images.length > 5 && (
            <button type="button" aria-label={`View ${images.length - 5} more images of ${label}`} onClick={() => setLightboxIndex(5)} className={`flex min-h-24 flex-col items-center justify-center rounded-lg border border-border bg-muted text-foreground hover:bg-accent ${focusClasses}`}>
              <span className="text-2xl font-bold">+{images.length - 5}</span>
              <span className="text-xs text-muted-foreground">more</span>
            </button>
          )}
        </div>
      )}
      <ImageLightbox images={images} label={label} initialIndex={lightboxIndex ?? 0} isOpen={lightboxIndex !== null} onClose={() => setLightboxIndex(null)} />
    </section>
  );
}
