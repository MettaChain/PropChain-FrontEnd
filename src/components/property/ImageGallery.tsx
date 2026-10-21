'use client';

import React, { useCallback, useMemo, useState } from 'react';
import Image from 'next/image';
import { useTranslation } from 'react-i18next';
import { ImageLightbox } from './ImageLightbox';
import { ErrorBoundary } from '@/components/ui/SimpleErrorBoundary';
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
 * Issue #1266 — the gallery sits inside the property detail view, which
 * re-renders for reasons that have nothing to do with the images (the
 * currency toggle, a parent state change, an analytics update). `React.memo`
 * lets React skip the whole gallery when neither the image list nor the
 * property name changed, so those re-renders no longer walk the thumbnail
 * tree and re-create the `next/image` elements.
 */
export const ImageGallery = React.memo(function ImageGallery(props: ImageGalleryProps) {
  return (
    <ErrorBoundary>
      <ImageGalleryContent {...props} />
    </ErrorBoundary>
  );
});

interface GalleryThumbnailProps {
  image: string;
  alt: string;
  index: number;
  onOpen: (index: number) => void;
}

/**
 * Issue #1266 — a thumbnail only depends on its own image, its alt text and
 * the (stable) open handler, so it is memoized on its own: a re-render of the
 * gallery that leaves a thumbnail's props alone no longer re-renders it.
 */
const GalleryThumbnail = React.memo(function GalleryThumbnail({
  image,
  alt,
  index,
  onOpen,
}: GalleryThumbnailProps) {
  return (
    <div
      className="relative rounded-lg overflow-hidden cursor-pointer group"
      onClick={() => onOpen(index)}
    >
      <Image
        src={image}
        alt={alt}
        width={200}
        height={150}
        className="w-full h-24 object-cover transition-transform duration-300 group-hover:scale-110"
      />

      {/* Hover overlay */}
      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-300 flex items-center justify-center">
        <svg className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
        </svg>
      </div>
    </div>
  );
});

const ImageGalleryContent: React.FC<ImageGalleryProps> = ({ 
  images, 
  propertyName 
}) => {
  const { t } = useTranslation('common');
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  // Issue #1253 — the gallery had no loading state, so an image that was still
  // being fetched left an empty grey box. The skeleton is drawn over the
  // image until the browser reports it has loaded.
  const [mainImageLoaded, setMainImageLoaded] = useState(false);

  // Issue #1265 — the image list comes from the API and cannot be trusted, so
  // it is validated before anything is rendered. Entries that are broken,
  // empty or duplicated are skipped and reported to the user instead of
  // turning into broken images.
  const validation = useMemo(() => validateGalleryImages(images), [images]);
  const galleryImages = validation.images;

  // Issue #1264 — the property name is the alternative text of every image,
  // so a missing name falls back to a generic, translated label.
  const accessibleName =
    normalizeGalleryPropertyName(propertyName) || t('gallery.defaultPropertyName');

  // Issue #1266 — everything below is derived from the (already validated)
  // image list. It used to be recomputed on every render, which allocated a
  // new array and rebuilt the thumbnail elements even when the images had not
  // changed.
  const thumbnails = useMemo(() => galleryImages.slice(1, 5), [galleryImages]);
  const remainingImageCount = useMemo(
    () => Math.max(0, galleryImages.length - 5),
    [galleryImages]
  );
  const hasThumbnails = galleryImages.length > 1;

  const openLightbox = useCallback((index: number) => {
    setLightboxIndex(index);
  }, []);

  const closeLightbox = useCallback(() => {
    setLightboxIndex(null);
  }, []);

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

  if (galleryImages.length === 0) {
    return (
      <div className="space-y-4">
        {renderValidationNotice()}
        <div className="relative rounded-xl overflow-hidden bg-gray-200 dark:bg-gray-700 h-[400px] flex items-center justify-center">
          <div className="text-center">
            <svg className="w-16 h-16 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <p className="text-gray-500 dark:text-gray-400">{t('gallery.noImages')}</p>
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
      <div className="space-y-4">
        {renderValidationNotice()}

        {/* Main Image */}
        <div className="relative rounded-xl overflow-hidden cursor-pointer group">
          <Image
            src={galleryImages[0]}
            alt={t('gallery.mainImageAlt', { property: accessibleName })}
            width={800}
            height={600}
            className="w-full h-[400px] object-cover transition-transform duration-300 group-hover:scale-105"
            onClick={() => openLightbox(0)}
            onLoad={() => setMainImageLoaded(true)}
          />

          {/* Issue #1253 — loading skeleton, drawn over the image until it has
              loaded. It is decorative, so it is hidden from assistive tech. */}
          {!mainImageLoaded && (
            <div
              className="absolute inset-0 animate-pulse bg-gray-200 dark:bg-gray-700"
              aria-hidden="true"
            />
          )}
           
          {/* Overlay with image count */}
          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-300 flex items-center justify-center">
            <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-white/90 backdrop-blur-sm px-4 py-2 rounded-lg">
              <p className="text-gray-900 font-medium">
                {t('gallery.viewAll', { count: galleryImages.length })}
              </p>
            </div>
          </div>
        </div>

        {/* Thumbnail Gallery */}
        {hasThumbnails && (
          <div className="grid grid-cols-4 gap-2">
            {thumbnails.map((image, index) => {
              const actualIndex = index + 1;
              return (
                <GalleryThumbnail
                  key={actualIndex}
                  image={image}
                  alt={t('gallery.imageAlt', { property: accessibleName, index: actualIndex + 1 })}
                  index={actualIndex}
                  onOpen={openLightbox}
                />
              );
            })}
            
            {/* Show more indicator if there are more than 5 images */}
            {remainingImageCount > 0 && (
              <div className="relative rounded-lg overflow-hidden bg-gray-200 dark:bg-gray-700 flex items-center justify-center cursor-pointer group">
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-600 dark:text-gray-400 mb-1">
                    +{remainingImageCount}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-500">
                    {t('gallery.moreImages', { count: remainingImageCount })}
                  </div>
                </div>
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-300" />
              </div>
            )}
          </div>
        )}
      </div>

      {/* Lightbox */}
      <ImageLightbox
        images={galleryImages}
        initialIndex={lightboxIndex || 0}
        isOpen={lightboxIndex !== null}
        onClose={closeLightbox}
      />
    </>
  );
};
