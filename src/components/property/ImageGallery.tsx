'use client';

import React, {
  useState,
  useCallback,
  useMemo,
  memo,
  useRef,
  useEffect,
} from 'react';
import Image from 'next/image';
import { ImageLightbox } from './ImageLightbox';
import { ErrorBoundary } from '@/components/ui/SimpleErrorBoundary';
import { trackGalleryEvent } from '@/lib/galleryAnalytics';

export interface ImageGalleryProps {
  images: string[];
  propertyName: string;
}

/**
 * Issue #1254 — the gallery renders the lightbox and a grid of thumbnails; a
 * failure in either used to take the whole property page down with it. The
 * boundary below keeps the failure inside the gallery, where it degrades to a
 * retryable fallback.
 *
 * #1257 — memoized root + stable callbacks to limit re-renders.
 * #1258 — keyboard navigation on the thumbnail strip and main image.
 * #1259 — analytics events for open / navigate / close.
 */
export const ImageGallery: React.FC<ImageGalleryProps> = memo((props) => (
  <ErrorBoundary>
    <ImageGalleryContent {...props} />
  </ErrorBoundary>
));
ImageGallery.displayName = 'ImageGallery';

const ImageGalleryContent: React.FC<ImageGalleryProps> = memo(
  ({ images, propertyName }) => {
    const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
    const [mainImageLoaded, setMainImageLoaded] = useState(false);
    const [focusIndex, setFocusIndex] = useState(0);
    const thumbRefs = useRef<(HTMLButtonElement | null)[]>([]);

    const imageCount = images?.length ?? 0;
    const thumbSources = useMemo(
      () => (images && images.length > 1 ? images.slice(1, 5) : []),
      [images],
    );

    useEffect(() => {
      if (imageCount > 0) {
        trackGalleryEvent('gallery_view', {
          propertyName,
          imageCount,
        });
      }
    }, [propertyName, imageCount]);

    const openLightbox = useCallback(
      (index: number, method: 'click' | 'keyboard' = 'click') => {
        setLightboxIndex(index);
        trackGalleryEvent('gallery_lightbox_open', {
          propertyName,
          imageIndex: index,
          imageCount,
          method,
        });
        if (method === 'click' && index > 0) {
          trackGalleryEvent('gallery_thumbnail_click', {
            propertyName,
            imageIndex: index,
            imageCount,
          });
        }
      },
      [propertyName, imageCount],
    );

    const closeLightbox = useCallback(() => {
      if (lightboxIndex !== null) {
        trackGalleryEvent('gallery_lightbox_close', {
          propertyName,
          imageIndex: lightboxIndex,
          imageCount,
        });
      }
      setLightboxIndex(null);
    }, [lightboxIndex, propertyName, imageCount]);

    const handleLightboxNavigate = useCallback(
      (nextIndex: number, direction: 'next' | 'previous' | 'jump') => {
        trackGalleryEvent('gallery_lightbox_navigate', {
          propertyName,
          imageIndex: nextIndex,
          imageCount,
          direction,
        });
      },
      [propertyName, imageCount],
    );

    // #1258 — grid keyboard navigation
    const handleGridKeyDown = useCallback(
      (e: React.KeyboardEvent, index: number) => {
        if (!images || images.length === 0) return;
        let next = index;
        switch (e.key) {
          case 'ArrowRight':
          case 'ArrowDown':
            e.preventDefault();
            next = Math.min(images.length - 1, index + 1);
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
            next = images.length - 1;
            break;
          case 'Enter':
          case ' ':
            e.preventDefault();
            openLightbox(index, 'keyboard');
            trackGalleryEvent('gallery_keyboard_navigate', {
              propertyName,
              imageIndex: index,
              imageCount,
              method: 'keyboard',
            });
            return;
          default:
            return;
        }
        setFocusIndex(next);
        // Focus thumbnail buttons when index maps into the strip (main = 0)
        if (next === 0) {
          // main image is a button too
          thumbRefs.current[0]?.focus();
        } else {
          thumbRefs.current[next]?.focus();
        }
        trackGalleryEvent('gallery_keyboard_navigate', {
          propertyName,
          imageIndex: next,
          imageCount,
          method: 'keyboard',
        });
      },
      [images, openLightbox, propertyName, imageCount],
    );

    if (!images || images.length === 0) {
      return (
        <div className="relative rounded-xl overflow-hidden bg-gray-200 dark:bg-gray-700 h-[400px] flex items-center justify-center">
          <div className="text-center">
            <svg
              className="w-16 h-16 mx-auto mb-4 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            <p className="text-gray-500 dark:text-gray-400">No images available</p>
          </div>
        </div>
      );
    }

    return (
      <>
        <div
          className="space-y-4"
          role="region"
          aria-label={`${propertyName} image gallery`}
        >
          {/* Main Image */}
          <button
            type="button"
            ref={(el) => {
              thumbRefs.current[0] = el;
            }}
            className="relative w-full rounded-xl overflow-hidden cursor-pointer group text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
            onClick={() => openLightbox(0, 'click')}
            onKeyDown={(e) => handleGridKeyDown(e, 0)}
            aria-label={`View ${propertyName} main image`}
            tabIndex={focusIndex === 0 ? 0 : -1}
          >
            {!mainImageLoaded && (
              <div
                className="absolute inset-0 bg-gray-200 dark:bg-gray-700 animate-pulse"
                aria-hidden
              />
            )}
            <Image
              src={images[0]}
              alt={propertyName}
              width={800}
              height={600}
              className="w-full h-[400px] object-cover transition-transform duration-300 group-hover:scale-105"
              onLoad={() => setMainImageLoaded(true)}
              priority
            />
          </button>

          {/* Thumbnail strip */}
          {thumbSources.length > 0 && (
            <div
              className="grid grid-cols-4 gap-2"
              role="listbox"
              aria-label="Property image thumbnails"
            >
              {thumbSources.map((image, index) => {
                const actualIndex = index + 1;
                return (
                  <button
                    key={`${actualIndex}-${image}`}
                    type="button"
                    role="option"
                    ref={(el) => {
                      thumbRefs.current[actualIndex] = el;
                    }}
                    className="relative rounded-lg overflow-hidden cursor-pointer group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                    onClick={() => openLightbox(actualIndex, 'click')}
                    onKeyDown={(e) => handleGridKeyDown(e, actualIndex)}
                    aria-label={`${propertyName} - Image ${actualIndex + 1}`}
                    aria-selected={focusIndex === actualIndex}
                    tabIndex={focusIndex === actualIndex ? 0 : -1}
                  >
                    <Image
                      src={image}
                      alt={`${propertyName} - Image ${actualIndex + 1}`}
                      width={200}
                      height={150}
                      className="w-full h-24 object-cover transition-transform duration-300 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-300 flex items-center justify-center pointer-events-none">
                      <svg
                        className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        aria-hidden
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7"
                        />
                      </svg>
                    </div>
                  </button>
                );
              })}

              {images.length > 5 && (
                <button
                  type="button"
                  className="relative rounded-lg overflow-hidden bg-gray-200 dark:bg-gray-700 flex items-center justify-center cursor-pointer group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                  onClick={() => openLightbox(5, 'click')}
                  aria-label={`View ${images.length - 5} more images`}
                >
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-600 dark:text-gray-400 mb-1">
                      +{images.length - 5}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-500">
                      more
                    </div>
                  </div>
                </button>
              )}
            </div>
          )}
        </div>

        <ImageLightbox
          images={images}
          initialIndex={lightboxIndex ?? 0}
          isOpen={lightboxIndex !== null}
          onClose={closeLightbox}
          onNavigate={handleLightboxNavigate}
        />
      </>
    );
  },
);
ImageGalleryContent.displayName = 'ImageGalleryContent';
