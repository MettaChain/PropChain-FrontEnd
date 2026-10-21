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
import { useTranslation } from 'react-i18next';
import { ImageLightbox } from './ImageLightbox';
import { ErrorBoundary } from '@/components/ui/SimpleErrorBoundary';
import { trackGalleryEvent } from '@/lib/galleryAnalytics';
import {
  GALLERY_MAX_IMAGES,
  normalizeGalleryPropertyName,
  validateGalleryImages,
} from '@/lib/galleryValidation';

interface ImageGalleryProps {
  images: string[];
  propertyName: string;
}

/**
 * Issue #1254 — the gallery renders the lightbox and a grid of thumbnails; a
 * failure in either used to take the whole property page down with it. The
 * boundary below keeps the failure inside the gallery, where it degrades to a
 * retryable fallback.
 *
 * Issue #1266 / #1257 — the gallery sits inside the property detail view,
 * which re-renders for reasons that have nothing to do with the images (the
 * currency toggle, a parent state change, an analytics update). `memo` lets
 * React skip the whole gallery when neither the image list nor the property
 * name changed, and the derived lists and handlers are memoized so a
 * re-render no longer rebuilds the thumbnail elements.
 *
 * Issue #1265 — the image list comes from the API and cannot be trusted, so
 * it is validated before anything is rendered.
 *
 * Issue #1264 — the property name is the alternative text of every image, so
 * a missing name falls back to a generic, translated label.
 *
 * #1258 — keyboard navigation on the main image and the thumbnail strip.
 * #1259 — analytics events for view / open / navigate / close.
 */
export const ImageGallery = memo(function ImageGallery(props: ImageGalleryProps) {
  return (
    <ErrorBoundary>
      <ImageGalleryContent {...props} />
    </ErrorBoundary>
  );
});
ImageGallery.displayName = 'ImageGallery';

const ImageGalleryContent: React.FC<ImageGalleryProps> = memo(
  ({ images, propertyName }) => {
    const { t } = useTranslation('common');
    const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
    // Issue #1253 — the gallery had no loading state, so an image that was
    // still being fetched left an empty grey box. The skeleton is drawn over
    // the image until the browser reports it has loaded.
    const [mainImageLoaded, setMainImageLoaded] = useState(false);
    // #1258 — roving focus index across the main image (0) and thumbnails (1..4).
    const [focusIndex, setFocusIndex] = useState(0);
    const thumbRefs = useRef<(HTMLButtonElement | null)[]>([]);

    // Issue #1265 — validate the list before it is rendered.
    const validation = useMemo(() => validateGalleryImages(images), [images]);
    const galleryImages = validation.images;
    const imageCount = galleryImages.length;

    // Issue #1264 — accessible name used as the alternative text of every image.
    const accessibleName =
      normalizeGalleryPropertyName(propertyName) || t('gallery.defaultPropertyName');

    // #1257 — everything below is derived from the (already validated) image
    // list. It used to be recomputed on every render, which allocated a new
    // array and rebuilt the thumbnail elements even when nothing changed.
    const thumbnails = useMemo(() => galleryImages.slice(1, 5), [galleryImages]);
    const remainingImageCount = useMemo(
      () => Math.max(0, imageCount - 5),
      [imageCount]
    );
    const hasThumbnails = thumbnails.length > 0;

    // #1259 — fire a view event when the gallery becomes visible.
    useEffect(() => {
      if (imageCount > 0) {
        trackGalleryEvent('gallery_view', {
          propertyName: accessibleName,
          imageCount,
        });
      }
    }, [accessibleName, imageCount]);

    const openLightbox = useCallback(
      (index: number, method: 'click' | 'keyboard' = 'click') => {
        setLightboxIndex(index);
        trackGalleryEvent('gallery_lightbox_open', {
          propertyName: accessibleName,
          imageIndex: index,
          imageCount,
          method,
        });
        if (method === 'click' && index > 0) {
          trackGalleryEvent('gallery_thumbnail_click', {
            propertyName: accessibleName,
            imageIndex: index,
            imageCount,
          });
        }
      },
      [accessibleName, imageCount]
    );

    const closeLightbox = useCallback(() => {
      if (lightboxIndex !== null) {
        trackGalleryEvent('gallery_lightbox_close', {
          propertyName: accessibleName,
          imageIndex: lightboxIndex,
          imageCount,
        });
      }
      setLightboxIndex(null);
    }, [lightboxIndex, accessibleName, imageCount]);

    const handleLightboxNavigate = useCallback(
      (nextIndex: number, direction: 'next' | 'previous' | 'jump') => {
        trackGalleryEvent('gallery_lightbox_navigate', {
          propertyName: accessibleName,
          imageIndex: nextIndex,
          imageCount,
          direction,
        });
      },
      [accessibleName, imageCount]
    );

    // #1258 — grid keyboard navigation (arrow keys, Home/End, Enter/Space).
    const handleGridKeyDown = useCallback(
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
            trackGalleryEvent('gallery_keyboard_navigate', {
              propertyName: accessibleName,
              imageIndex: index,
              imageCount,
              method: 'keyboard',
            });
            return;
          default:
            return;
        }
        setFocusIndex(next);
        // Focus the main image (index 0) or the thumbnail at `next`.
        thumbRefs.current[next]?.focus();
        trackGalleryEvent('gallery_keyboard_navigate', {
          propertyName: accessibleName,
          imageIndex: next,
          imageCount,
          method: 'keyboard',
        });
      },
      [imageCount, openLightbox, accessibleName]
    );

    const renderValidationNotice = () => {
      const { issues, droppedCount } = validation;
      if (issues.length === 0 && droppedCount === 0) return null;

      return (
        <div
          role="status"
          aria-live="polite"
          className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-700 dark:bg-amber-950/40 dark:text-amber-200"
        >
          <p className="font-medium">{t('gallery.invalidImagesTitle')}</p>
          {issues.length > 0 && (
            <ul className="mt-2 list-disc space-y-1 pl-5">
              {issues.map((issue) => (
                <li key={issue.index}>
                  {t(`gallery.issue.${issue.reason}`)}
                </li>
              ))}
            </ul>
          )}
          {droppedCount > 0 && (
            <p className="mt-2">
              {t('gallery.imagesDropped', { count: droppedCount, max: GALLERY_MAX_IMAGES })}
            </p>
          )}
        </div>
      );
    };

    if (imageCount === 0) {
      return (
        <div className="space-y-4">
          {renderValidationNotice()}
          <div className="relative rounded-xl overflow-hidden bg-gray-200 dark:bg-gray-700 h-[400px] flex items-center justify-center">
            <div className="text-center">
              <svg
                className="w-16 h-16 mx-auto mb-4 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              <p className="text-gray-500 dark:text-gray-400">
                {t('gallery.noImages')}
              </p>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                {t('gallery.noImagesDescription')}
              </p>
            </div>
          </div>
        </div>
      );
    }

    return (
      <>
        <div
          className="space-y-4"
          role="region"
          aria-label={t('gallery.regionLabel', { property: accessibleName })}
        >
          {renderValidationNotice()}

          {/* Main Image */}
          <button
            type="button"
            ref={(el) => {
              thumbRefs.current[0] = el;
            }}
            className="relative block w-full rounded-xl overflow-hidden cursor-pointer group text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
            onClick={() => openLightbox(0, 'click')}
            onKeyDown={(e) => handleGridKeyDown(e, 0)}
            aria-label={t('gallery.mainImageButtonLabel', { property: accessibleName })}
            tabIndex={focusIndex === 0 ? 0 : -1}
          >
            {!mainImageLoaded && (
              /* Issue #1253 — loading skeleton, drawn over the image until it
                 has loaded. It is decorative, so it is hidden from assistive
                 tech. */
              <div
                className="absolute inset-0 animate-pulse bg-gray-200 dark:bg-gray-700 z-10"
                aria-hidden="true"
              />
            )}
            <Image
              src={galleryImages[0]}
              alt={t('gallery.mainImageAlt', { property: accessibleName })}
              width={800}
              height={600}
              className="w-full h-[400px] object-cover transition-transform duration-300 group-hover:scale-105"
              onLoad={() => setMainImageLoaded(true)}
              priority
            />

            {/* Overlay with image count */}
            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-300 flex items-center justify-center pointer-events-none">
              <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-white/90 backdrop-blur-sm px-4 py-2 rounded-lg">
                <p className="text-gray-900 font-medium">
                  {t('gallery.viewAll', { count: imageCount })}
                </p>
              </div>
            </div>
          </button>

          {/* Thumbnail Gallery */}
          {hasThumbnails && (
            <div
              className="grid grid-cols-4 gap-2"
              role="listbox"
              aria-label={t('gallery.thumbnailStripLabel')}
            >
              {thumbnails.map((image, index) => {
                const actualIndex = index + 1;
                const label = t('gallery.imageAlt', {
                  property: accessibleName,
                  index: actualIndex + 1,
                });
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
                    aria-label={label}
                    aria-selected={focusIndex === actualIndex}
                    tabIndex={focusIndex === actualIndex ? 0 : -1}
                  >
                    <Image
                      src={image}
                      alt={label}
                      width={200}
                      height={150}
                      className="w-full h-24 object-cover transition-transform duration-300 group-hover:scale-110"
                    />

                    {/* Hover overlay */}
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-300 flex items-center justify-center pointer-events-none">
                      <svg
                        className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        aria-hidden="true"
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

              {/* Show more indicator if there are more than 5 images */}
              {remainingImageCount > 0 && (
                <button
                  type="button"
                  className="relative rounded-lg overflow-hidden bg-gray-200 dark:bg-gray-700 flex items-center justify-center cursor-pointer group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                  onClick={() => openLightbox(5, 'click')}
                  aria-label={t('gallery.moreImagesLabel', {
                    count: remainingImageCount,
                  })}
                >
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-600 dark:text-gray-400 mb-1">
                      +{remainingImageCount}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-500">
                      {t('gallery.moreImages', { count: remainingImageCount })}
                    </div>
                  </div>
                </button>
              )}
            </div>
          )}
        </div>

        {/* Lightbox */}
        <ImageLightbox
          images={galleryImages}
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
