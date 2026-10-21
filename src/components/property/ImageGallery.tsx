'use client';

import React, { memo, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Gallery, GalleryTrackPayload } from '@/components/gallery/Gallery';
import { trackGalleryEvent } from '@/lib/galleryAnalytics';
import {
  GALLERY_MAX_IMAGES,
  normalizeGalleryPropertyName,
  validateGalleryImages,
} from '@/lib/galleryValidation';

export interface ImageGalleryProps {
  /** Image URLs from the API; validated before anything is rendered. */
  readonly images: readonly string[];
  /** The property name; used as the accessible name of every image. */
  readonly propertyName: string;
}

/**
 * Property-specific adapter around the shared `Gallery` (issues #1260–#1263).
 *
 * The adapter keeps the existing `images` / `propertyName` API and owns the
 * concerns that are specific to API data and analytics:
 *
 * - Issue #1265 — the image list is validated before it is rendered, and the
 *   rejected entries are reported in a `role="status"` notice.
 * - Issue #1264 — a missing property name falls back to a generic, translated
 *   label.
 * - #1259 — a `gallery_view` event fires when the gallery becomes visible and
 *   gallery interactions are forwarded to `trackGalleryEvent`.
 */
export const ImageGallery = memo(function ImageGallery({
  images,
  propertyName,
}: ImageGalleryProps) {
  const { t } = useTranslation('common');

  // Issue #1265 — the image list comes from the API and cannot be trusted, so
  // it is validated before anything is rendered. Entries that are broken,
  // empty or duplicated are skipped and reported to the user instead of
  // turning into broken images.
  const validation = useMemo(
    () => validateGalleryImages(images ? [...images] : []),
    [images]
  );
  const galleryImages = validation.images;
  const imageCount = galleryImages.length;

  // Issue #1264 — the property name is the alternative text of every image,
  // so a missing name falls back to a generic, translated label.
  const accessibleName =
    normalizeGalleryPropertyName(propertyName) || t('gallery.defaultPropertyName');

  // #1259 — a view event fires whenever the gallery becomes visible.
  useEffect(() => {
    if (imageCount > 0) {
      trackGalleryEvent('gallery_view', {
        propertyName: accessibleName,
        imageCount,
      });
    }
  }, [accessibleName, imageCount]);

  const handleTrack = (
    event: Parameters<typeof trackGalleryEvent>[0],
    payload: GalleryTrackPayload
  ) => {
    trackGalleryEvent(event, { propertyName: accessibleName, ...payload });
  };

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

  const notice = renderValidationNotice();
  const hasIssues =
    validation.issues.length > 0 || validation.droppedCount > 0;

  if (imageCount === 0) {
    // The notice (when present) already is the status region of the screen,
    // so the empty placeholder only claims `role="status"` on its own.
    return (
      <div className="space-y-4">
        {notice}
        <div
          role={hasIssues ? undefined : 'status'}
          className="relative rounded-xl overflow-hidden bg-gray-200 dark:bg-gray-700 h-[400px] flex items-center justify-center"
        >
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
      {notice}
      <Gallery
        images={galleryImages}
        label={accessibleName}
        onTrack={handleTrack}
      />
    </>
  );
});
ImageGallery.displayName = 'ImageGallery';
