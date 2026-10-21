'use client';

import React, { memo, useCallback, useRef, useState } from 'react';
import Image from 'next/image';
import { ImageIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { ErrorBoundary } from '@/components/ui/SimpleErrorBoundary';
import { ImageLightbox } from './ImageLightbox';

/** Analytics events the Gallery can report, mirroring galleryAnalytics. */
export type GalleryTrackEvent =
  | 'gallery_lightbox_open'
  | 'gallery_lightbox_close'
  | 'gallery_thumbnail_click'
  | 'gallery_keyboard_navigate';

export interface GalleryTrackPayload {
  imageIndex?: number;
  imageCount?: number;
  method?: 'click' | 'keyboard';
}

export interface GalleryProps {
  /** Image URLs in display order; the first image is featured. */
  readonly images: readonly string[];
  /** Accessible name and image description for this collection. */
  readonly label: string;
  readonly emptyTitle?: string;
  readonly emptyDescription?: string;
  /** Optional analytics sink; no-ops when absent. */
  readonly onTrack?: (event: GalleryTrackEvent, payload: GalleryTrackPayload) => void;
}

/**
 * Reusable image grid with an accessible empty state and lightbox.
 *
 * The property `ImageGallery` adapter supplies property-specific copy and
 * analytics; outside that domain every prop except `images` and `label` is
 * optional.
 *
 * #1258 — arrow/Home/End move focus across the main image, thumbnails and the
 * more control; Enter/Space opens the lightbox at the focused image.
 * #1257 — the shell is memoized so unchanged props skip the subtree.
 */
export const Gallery = memo(function Gallery(props: GalleryProps) {
  return (
    <ErrorBoundary>
      <GalleryContent key={JSON.stringify(props.images)} {...props} />
    </ErrorBoundary>
  );
});
Gallery.displayName = 'Gallery';

function GalleryContent({
  images,
  label,
  emptyTitle = 'No images available',
  emptyDescription = 'Images will appear here when they are added.',
  onTrack,
}: GalleryProps) {
  const { t } = useTranslation('common');
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [mainImageLoaded, setMainImageLoaded] = useState(false);
  // #1258 — roving focus index: main image (0), thumbnails (1..4), more (5).
  const [focusIndex, setFocusIndex] = useState(0);
  const controlRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const mainImage = images[0];
  const imageCount = images.length;
  const focusClasses = 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background';

  const openLightbox = useCallback(
    (index: number, method: 'click' | 'keyboard' = 'click') => {
      setLightboxIndex(index);
      onTrack?.('gallery_lightbox_open', { imageIndex: index, imageCount, method });
      if (method === 'click' && index > 0) {
        onTrack?.('gallery_thumbnail_click', { imageIndex: index, imageCount });
      }
    },
    [imageCount, onTrack],
  );

  const closeLightbox = useCallback(() => {
    if (lightboxIndex !== null) {
      onTrack?.('gallery_lightbox_close', { imageIndex: lightboxIndex, imageCount });
    }
    setLightboxIndex(null);
  }, [lightboxIndex, imageCount, onTrack]);

  // #1258 — grid keyboard navigation.
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent, index: number) => {
      if (imageCount === 0) return;
      let next = index;
      switch (e.key) {
        case 'ArrowRight':
        case 'ArrowDown':
          e.preventDefault();
          next = Math.min(imageCount - 1, index + 1);
          break;
        case 'ArrowLeft':
        case 'ArrowUp':
          e.preventDefault();
          next = Math.max(0, index - 1);
          break;
        case 'Home':
          e.preventDefault();
          next = 0;
          break;
        case 'End':
          e.preventDefault();
          next = imageCount - 1;
          break;
        case 'Enter':
        case ' ':
          e.preventDefault();
          openLightbox(index, 'keyboard');
          onTrack?.('gallery_keyboard_navigate', {
            imageIndex: index,
            imageCount,
            method: 'keyboard',
          });
          return;
        default:
          return;
      }
      setFocusIndex(next);
      controlRefs.current[next]?.focus();
      onTrack?.('gallery_keyboard_navigate', {
        imageIndex: next,
        imageCount,
        method: 'keyboard',
      });
    },
    [imageCount, onTrack, openLightbox],
  );

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
      <button
        type="button"
        ref={(el) => {
          controlRefs.current[0] = el;
        }}
        aria-label={`View all ${imageCount} images of ${label}`}
        onClick={() => openLightbox(0, 'click')}
        onKeyDown={(e) => handleKeyDown(e, 0)}
        tabIndex={focusIndex === 0 ? 0 : -1}
        className={`group relative block w-full overflow-hidden rounded-xl bg-muted ${focusClasses}`}
      >
        <Image src={mainImage} alt={label} width={800} height={600} onLoad={() => setMainImageLoaded(true)} onError={() => setMainImageLoaded(true)} className="h-[400px] w-full object-cover transition-transform duration-300 group-hover:scale-105" />
        {!mainImageLoaded && <span aria-hidden="true" className="pointer-events-none absolute inset-0 animate-pulse bg-muted" />}
        <span className="absolute inset-0 flex items-center justify-center bg-black/0 transition-colors group-hover:bg-black/20 group-focus-visible:bg-black/20">
          <span className="rounded-lg bg-background/95 px-4 py-2 font-medium text-foreground opacity-0 shadow-sm backdrop-blur-sm transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
            {t('gallery.viewAll', { count: imageCount })}
          </span>
        </span>
      </button>
      {imageCount > 1 && (
        <div className="grid grid-cols-4 gap-2">
          {images.slice(1, 5).map((image, index) => {
            const actualIndex = index + 1;
            return (
              <button
                key={actualIndex}
                type="button"
                ref={(el) => {
                  controlRefs.current[actualIndex] = el;
                }}
                aria-label={`View image ${actualIndex + 1} of ${label}`}
                onClick={() => openLightbox(actualIndex, 'click')}
                onKeyDown={(e) => handleKeyDown(e, actualIndex)}
                tabIndex={focusIndex === actualIndex ? 0 : -1}
                className={`group relative overflow-hidden rounded-lg bg-muted ${focusClasses}`}
              >
                <Image src={image} alt={`${label} - Image ${actualIndex + 1}`} width={200} height={150} className="h-24 w-full object-cover transition-transform duration-300 group-hover:scale-110" />
                <span aria-hidden="true" className="absolute inset-0 bg-black/0 transition-colors group-hover:bg-black/30" />
              </button>
            );
          })}
          {imageCount > 5 && (
            <button
              type="button"
              ref={(el) => {
                controlRefs.current[5] = el;
              }}
              aria-label={`View ${imageCount - 5} more images of ${label}`}
              onClick={() => openLightbox(5, 'click')}
              onKeyDown={(e) => handleKeyDown(e, 5)}
              tabIndex={focusIndex === 5 ? 0 : -1}
              className={`flex min-h-24 flex-col items-center justify-center rounded-lg border border-border bg-muted text-foreground hover:bg-accent ${focusClasses}`}
            >
              <span className="text-2xl font-bold">+{imageCount - 5}</span>
              <span className="text-xs text-muted-foreground">more</span>
            </button>
          )}
        </div>
      )}
      <ImageLightbox
        images={images}
        label={label}
        initialIndex={lightboxIndex ?? 0}
        isOpen={lightboxIndex !== null}
        onClose={closeLightbox}
      />
    </section>
  );
}
