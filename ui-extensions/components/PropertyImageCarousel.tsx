'use client';

import { useEffect, useState } from 'react';

export interface PropertyCarouselImage {
  src: string;
  alt: string;
  aspectRatio?: string;
}

export interface PropertyImageCarouselProps {
  images: PropertyCarouselImage[];
  loading?: boolean;
  dark?: boolean;
  initialIndex?: number;
}

export function PropertyImageCarousel({
  images,
  loading = false,
  dark = false,
  initialIndex = 0,
}: PropertyImageCarouselProps) {
  const [activeIndex, setActiveIndex] = useState(
    Math.min(Math.max(initialIndex, 0), Math.max(images.length - 1, 0)),
  );

  useEffect(() => {
    setActiveIndex(Math.min(Math.max(initialIndex, 0), Math.max(images.length - 1, 0)));
  }, [images.length, initialIndex]);

  const move = (direction: -1 | 1) => {
    setActiveIndex((current) => (current + direction + images.length) % images.length);
  };

  const current = images[activeIndex];
  const surface = dark
    ? 'border-slate-700 bg-slate-900 text-white'
    : 'border-slate-200 bg-white text-slate-900';

  if (loading) {
    return (
      <section
        className={`w-full max-w-3xl rounded-xl border p-4 ${surface}`}
        aria-label="Property image carousel loading"
        aria-busy="true"
      >
        <div className={`aspect-video animate-pulse rounded-lg ${dark ? 'bg-slate-700' : 'bg-slate-200'}`} />
        <p className="mt-3 text-sm" role="status">Loading property images…</p>
      </section>
    );
  }

  if (images.length === 0 || !current) {
    return (
      <section className={`w-full max-w-3xl rounded-xl border p-6 ${surface}`} role="status">
        No property images available.
      </section>
    );
  }

  return (
    <section
      className={`w-full max-w-3xl rounded-xl border p-4 ${surface}`}
      aria-label="Property image carousel"
      tabIndex={0}
      onKeyDown={(event) => {
        if (event.key === 'ArrowRight') {
          event.preventDefault();
          move(1);
        } else if (event.key === 'ArrowLeft') {
          event.preventDefault();
          move(-1);
        }
      }}
    >
      <div className="relative overflow-hidden rounded-lg bg-slate-100 dark:bg-slate-800">
        <img
          key={current.src}
          src={current.src}
          alt={current.alt}
          className="block h-auto w-full object-cover"
          style={{ aspectRatio: current.aspectRatio ?? '16 / 9' }}
        />
        {images.length > 1 && (
          <>
            <button
              type="button"
              onClick={() => move(-1)}
              aria-label="Previous image"
              className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-black/65 px-3 py-2 text-white hover:bg-black/80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
            >
              <span aria-hidden="true">←</span>
            </button>
            <button
              type="button"
              onClick={() => move(1)}
              aria-label="Next image"
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-black/65 px-3 py-2 text-white hover:bg-black/80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
            >
              <span aria-hidden="true">→</span>
            </button>
          </>
        )}
      </div>
      <div className="mt-3 flex items-center justify-between gap-3">
        <p className="min-w-0 truncate text-sm" aria-live="polite">
          {current.alt}
        </p>
        <span className="shrink-0 text-xs opacity-70">
          {activeIndex + 1} / {images.length}
        </span>
      </div>
      {images.length > 1 && (
        <div className="mt-3 flex flex-wrap gap-2" aria-label="Choose an image">
          {images.map((item, index) => (
            <button
              key={item.src}
              type="button"
              onClick={() => setActiveIndex(index)}
              aria-label={`Show image ${index + 1}: ${item.alt}`}
              aria-current={index === activeIndex ? 'true' : undefined}
              className={`h-2.5 w-2.5 rounded-full focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 ${index === activeIndex ? 'bg-blue-600' : dark ? 'bg-slate-500' : 'bg-slate-300'}`}
            />
          ))}
        </div>
      )}
    </section>
  );
}

export default PropertyImageCarousel;
