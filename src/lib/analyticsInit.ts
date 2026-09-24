/**
 * Minimal, dependency-free implementation of the analytics/error-tracking
 * behavior README already advertises. Loads the GA gtag script (only when
 * NEXT_PUBLIC_GA_MEASUREMENT_ID is set) and reports runtime errors to the
 * Sentry ingest endpoint via a lightweight beacon (only when
 * NEXT_PUBLIC_SENTRY_DSN is set) — no SDK dependency required.
 */
'use client';

declare global {
  interface Window {
    dataLayer?: unknown[];
  }
}

const GA_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
const SENTRY_DSN = process.env.NEXT_PUBLIC_SENTRY_DSN;

export function initAnalytics(): void {
  if (typeof window === 'undefined') return;

  if (GA_ID && !document.getElementById('ga-gtag-script')) {
    const script = document.createElement('script');
    script.id = 'ga-gtag-script';
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`;
    document.head.appendChild(script);

    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push(['js', new Date()], ['config', GA_ID]);
  }

  if (SENTRY_DSN) {
    window.addEventListener('error', (event) => {
      navigator.sendBeacon?.(
        '/api/error-report',
        JSON.stringify({ message: event.message, stack: event.error?.stack })
      );
    });
  }
}
