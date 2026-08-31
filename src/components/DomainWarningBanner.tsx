'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { AlertTriangle, Shield, ExternalLink } from 'lucide-react';

const TRUSTED_DOMAINS = new Set([
  'propchain.io',
  'app.propchain.io',
  'localhost',
  '127.0.0.1',
]);

const OFFICIAL_URL = 'https://propchain.io';

interface DomainWarningBannerProps {
  className?: string;
}

/**
 * DomainWarningBanner
 *
 * Renders a non-navigating warning panel when the current host is not a
 * trusted domain. The user must explicitly click "Proceed only if you trust
 * this site" to dismiss the banner. Includes an aria-live region for screen
 * reader announcements.
 *
 * NEVER auto-redirects. All navigation is gated behind explicit user consent.
 */
export const DomainWarningBanner: React.FC<DomainWarningBannerProps> = ({ className = '' }) => {
  const [isSuspicious, setIsSuspicious] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [hostname, setHostname] = useState('');
  const [announcement, setAnnouncement] = useState('');

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const host = window.location.hostname;
    const isTrusted =
      TRUSTED_DOMAINS.has(host) ||
      host.endsWith('.propchain.io') ||
      host.endsWith('.vercel.app') ||
      host.endsWith('.netlify.app');

    if (!isTrusted) {
      setHostname(host);
      setIsSuspicious(true);
      setAnnouncement(
        `Warning: You are viewing PropChain on an untrusted domain: ${host}. Please verify the site is legitimate before proceeding.`
      );
    }
  }, []);

  const handleDismiss = useCallback(() => {
    setDismissed(true);
    setAnnouncement('Domain warning dismissed by user. Proceeding on untrusted domain.');
  }, []);

  const handleGoToOfficial = useCallback(() => {
    setAnnouncement('Navigating to official PropChain website.');
    window.location.href = OFFICIAL_URL;
  }, []);

  if (!isSuspicious || dismissed) return null;

  return (
    <>
      {/* Screen-reader live region for announcements */}
      <div
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      >
        {announcement}
      </div>

      <div
        className={`fixed bottom-0 left-0 right-0 z-[9999] ${className}`}
        role="alert"
        aria-label="Domain security warning"
      >
        <div className="border-t-2 border-amber-500 bg-amber-50 px-4 py-3 shadow-lg dark:border-amber-600 dark:bg-amber-950/95">
          <div className="mx-auto flex max-w-5xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            {/* Warning message */}
            <div className="flex items-start gap-3">
              <AlertTriangle
                className="mt-0.5 h-5 w-5 flex-shrink-0 text-amber-600 dark:text-amber-400"
                aria-hidden="true"
              />
              <div>
                <h2 className="text-sm font-semibold text-amber-900 dark:text-amber-100">
                  Untrusted Domain Detected
                </h2>
                <p className="mt-0.5 text-xs text-amber-800 dark:text-amber-200">
                  You are viewing PropChain on{' '}
                  <code className="rounded bg-amber-200 px-1 py-0.5 font-mono text-amber-900 dark:bg-amber-800 dark:text-amber-100">
                    {hostname}
                  </code>
                  . This is not an official PropChain domain. Phishing sites may
                  impersonate PropChain to steal your wallet credentials.
                </p>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex flex-shrink-0 gap-2">
              <button
                type="button"
                onClick={handleGoToOfficial}
                className="inline-flex items-center gap-1.5 rounded-lg border border-amber-300 bg-white px-3 py-2 text-xs font-medium text-amber-800 shadow-sm transition-colors hover:bg-amber-100 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-1 dark:border-amber-700 dark:bg-amber-900 dark:text-amber-100 dark:hover:bg-amber-800"
              >
                <Shield className="h-3.5 w-3.5" />
                Go to Official Site
                <ExternalLink className="h-3 w-3" />
              </button>

              <button
                type="button"
                onClick={handleDismiss}
                className="inline-flex items-center gap-1.5 rounded-lg border border-red-300 bg-red-600 px-3 py-2 text-xs font-medium text-white shadow-sm transition-colors hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-1 dark:border-red-700"
              >
                Proceed only if you trust this site
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default DomainWarningBanner;
