'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import Image from 'next/image';
import { useTranslation } from 'react-i18next';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';

interface ImageLightboxProps {
  images: string[];
  initialIndex?: number;
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Keeps an index inside the image list.
 *
 * @param index - The index to clamp.
 * @param length - The number of images in the list.
 * @returns A finite index between 0 and `length - 1`, or 0 for an empty list.
 */
function clampIndex(index: number, length: number): number {
  if (length <= 0) return 0;
  if (!Number.isFinite(index)) return 0;
  return Math.min(Math.max(Math.trunc(index), 0), length - 1);
}

export const ImageLightbox: React.FC<ImageLightboxProps> = ({
  images,
  initialIndex = 0,
  isOpen,
  onClose,
}) => {
  const { t } = useTranslation('common');
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const previouslyFocused = useRef<HTMLElement | null>(null);

  // Issue #1265 — the lightbox is opened with an index that comes from the
  // gallery, and the list can be shorter than that index (or be empty) when
  // the gallery is re-validated. The index is therefore clamped to the list
  // instead of being trusted, so the lightbox can never point at an image
  // that does not exist.
  const safeIndex = clampIndex(initialIndex, images.length);

  // The rendered index is clamped as well, so a stale or out of range state
  // can never make the lightbox render an image that is not in the list.
  const activeIndex = clampIndex(currentIndex, images.length);

  // Reset index when lightbox opens with new initialIndex
  useEffect(() => {
    if (isOpen) {
      setCurrentIndex(safeIndex);
    }
  }, [safeIndex, isOpen]);

  // Issue #1252 — the overlay was a plain div, so a screen reader had no way
  // of knowing a dialog had opened, and focus stayed wherever it was behind
  // the overlay. Focus now moves into the dialog and is handed back to the
  // element that opened it.
  useEffect(() => {
    if (!isOpen) return;

    previouslyFocused.current = document.activeElement as HTMLElement | null;
    closeButtonRef.current?.focus();

    return () => {
      previouslyFocused.current?.focus?.();
    };
  }, [isOpen]);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowLeft':
          navigatePrevious();
          break;
        case 'ArrowRight':
          navigateNext();
          break;
        case 'Escape':
          onClose();
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, currentIndex]);

  // Touch handlers for mobile swipe
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  }, []);

  const handleTouchEnd = useCallback(() => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;

    if (isLeftSwipe) {
      navigateNext();
    }
    if (isRightSwipe) {
      navigatePrevious();
    }
  }, [touchStart, touchEnd]);

  const navigateNext = () => {
    if (images.length === 0) return;
    setCurrentIndex((prev) => (prev + 1) % images.length);
  };

  const navigatePrevious = () => {
    if (images.length === 0) return;
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  const handleThumbnailClick = (index: number) => {
    setCurrentIndex(index);
  };

  if (!isOpen || images.length === 0) return null;

  return (
    // Issue #1252 — `role="dialog"` + `aria-modal` tell assistive tech that
    // the rest of the page is behind a modal, and the label names it.
    <div
      role="dialog"
      aria-modal="true"
      aria-label={t('gallery.lightboxLabel')}
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black bg-opacity-90 p-2 sm:p-4"
    >
      {/* Close Button */}
      <button
        ref={closeButtonRef}
        onClick={onClose}
        className="absolute right-2 top-2 z-10 rounded-full bg-white/10 p-1.5 transition-colors hover:bg-white/20 sm:right-4 sm:top-4 sm:p-2"
        aria-label={t('gallery.closeLightbox')}
      >
        <X className="w-6 h-6 text-white" />
      </button>

      {/* Main Image Container */}
      <div 
        className="relative mx-4 w-full max-w-7xl max-h-[70vh] sm:max-h-[80vh]"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <Image
          src={images[activeIndex]}
          alt={t('gallery.lightboxImageAlt', { index: activeIndex + 1 })}
          width={1200}
          height={800}
          className="max-w-full max-h-[70vh] object-contain sm:max-h-[80vh]"
          priority
        />

        {/* Navigation Buttons */}
        {images.length > 1 && (
          <>
            <button
              onClick={navigatePrevious}
              className="absolute left-0 top-1/2 -translate-y-1/2 rounded-full bg-white/10 p-1.5 transition-colors hover:bg-white/20 sm:left-4 sm:p-2"
              aria-label={t('gallery.previousImage')}
            >
              <ChevronLeft className="w-6 h-6 text-white" />
            </button>
            <button
              onClick={navigateNext}
              className="absolute right-0 top-1/2 -translate-y-1/2 rounded-full bg-white/10 p-1.5 transition-colors hover:bg-white/20 sm:right-4 sm:p-2"
              aria-label={t('gallery.nextImage')}
            >
              <ChevronRight className="w-6 h-6 text-white" />
            </button>
          </>
        )}

        {/* Image Counter */}
        {/* Issue #1252 — `aria-live` so the position is announced when it
            changes. */}
        <div
          aria-live="polite"
          className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-black/50 px-3 py-1 text-sm text-white"
        >
          {t('gallery.counter', { current: activeIndex + 1, total: images.length })}
        </div>
      </div>

      {/* Thumbnail Strip */}
      {images.length > 1 && (
        <div className="absolute bottom-16 left-1/2 flex max-w-[92vw] -translate-x-1/2 gap-2 overflow-x-auto px-4 sm:bottom-20">
          {images.map((image, index) => (
            <button
              key={image}
              onClick={() => handleThumbnailClick(index)}
              // Issue #1252 — `aria-current` marks the thumbnail that is
              // currently shown.
              aria-current={index === activeIndex ? "true" : undefined}
              className={`flex-shrink-0 relative rounded-lg overflow-hidden border-2 transition-all ${
                index === activeIndex 
                  ? 'border-blue-500 scale-110 ' 
                  : 'border-transparent hover:border-white/50'
              }`}
            >
              <Image
                src={image}
                alt={t('gallery.thumbnailAlt', { index: index + 1 })}
                width={60}
                height={45}
                className="w-16 h-12 object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
