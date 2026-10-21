/**
 * Gallery analytics events (#1259).
 * Pushes structured events to the gtag dataLayer when available; no-ops otherwise.
 */

export type GalleryAnalyticsEvent =
  | 'gallery_view'
  | 'gallery_thumbnail_click'
  | 'gallery_lightbox_open'
  | 'gallery_lightbox_close'
  | 'gallery_lightbox_navigate'
  | 'gallery_keyboard_navigate';

export interface GalleryEventPayload {
  propertyName?: string;
  imageIndex?: number;
  imageCount?: number;
  direction?: 'next' | 'previous' | 'jump';
  method?: 'click' | 'keyboard' | 'swipe';
}

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

/** Track a gallery interaction. Safe to call on the server (no-ops). */
export function trackGalleryEvent(
  event: GalleryAnalyticsEvent,
  payload: GalleryEventPayload = {},
): void {
  if (typeof window === 'undefined') return;

  const detail = {
    event,
    category: 'gallery',
    ...payload,
  };

  try {
    if (typeof window.gtag === 'function') {
      window.gtag('event', event, {
        event_category: 'gallery',
        ...payload,
      });
    }
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push(detail);
  } catch {
    // Analytics must never break the UI.
  }
}
