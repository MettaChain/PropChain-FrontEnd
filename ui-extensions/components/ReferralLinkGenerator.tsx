'use client';

import * as React from 'react';
import QRCode from 'qrcode';
import { Check, Copy, Mail, Send, Share2, Trash2, Twitter } from 'lucide-react';

export interface ReferralLinkGeneratorProps {
  baseUrl?: string;
  initialShares?: number;
  initialClicks?: number;
  storageKey?: string;
}

export interface CopyHistoryEntry {
  url: string;
  code: string;
  copiedAt: number;
}

const HISTORY_LIMIT = 5;

function sanitizeTrackingCode(value: string): string {
  return value
    .trim()
    .replace(/[^a-zA-Z0-9-_]/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 40);
}

function createTrackingCode(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID().replace(/-/g, '').slice(0, 10);
  }
  return Math.random().toString(36).slice(2, 12);
}

function getDefaultBaseUrl(): string {
  if (typeof window !== 'undefined') return `${window.location.origin}/?ref=`;
  return 'https://propchain.io/?ref=';
}

export function ReferralLinkGenerator({
  baseUrl,
  initialShares = 0,
  initialClicks = 0,
  storageKey = 'propchain-referral-copy-history',
}: ReferralLinkGeneratorProps) {
  const resolvedBaseUrl = baseUrl ?? getDefaultBaseUrl();
  const [customCode, setCustomCode] = React.useState('');
  const [trackingCode, setTrackingCode] = React.useState(() => createTrackingCode());
  const [copied, setCopied] = React.useState(false);
  const [qrDataUrl, setQrDataUrl] = React.useState('');
  const [shares, setShares] = React.useState(initialShares);
  const [copyHistory, setCopyHistory] = React.useState<CopyHistoryEntry[]>([]);

  const separator = resolvedBaseUrl.includes('?') ? '&' : '?';
  const generatedUrl = `${resolvedBaseUrl.replace(/[?&]ref=.*$/, '')}${separator}ref=${encodeURIComponent(trackingCode)}`;

  React.useEffect(() => {
    try {
      const saved = window.localStorage.getItem(storageKey);
      if (saved) setCopyHistory(JSON.parse(saved) as CopyHistoryEntry[]);
    } catch {
      setCopyHistory([]);
    }
  }, [storageKey]);

  React.useEffect(() => {
    let cancelled = false;
    void QRCode.toDataURL(generatedUrl, { width: 180, margin: 1 })
      .then((value) => {
        if (!cancelled) setQrDataUrl(value);
      })
      .catch(() => {
        if (!cancelled) setQrDataUrl('');
      });
    return () => {
      cancelled = true;
    };
  }, [generatedUrl]);

  React.useEffect(() => {
    if (!copied) return;
    const timeout = window.setTimeout(() => setCopied(false), 2000);
    return () => window.clearTimeout(timeout);
  }, [copied]);

  const persistHistory = (entry: CopyHistoryEntry) => {
    setCopyHistory((current) => {
      const next = [entry, ...current].slice(0, HISTORY_LIMIT);
      try {
        window.localStorage.setItem(storageKey, JSON.stringify(next));
      } catch {
        // Clipboard history remains available for the current session.
      }
      return next;
    });
  };

  const generateLink = () => {
    setTrackingCode(sanitizeTrackingCode(customCode) || createTrackingCode());
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(generatedUrl);
    } catch {
      const textarea = document.createElement('textarea');
      textarea.value = generatedUrl;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
    }

    setCopied(true);
    persistHistory({ url: generatedUrl, code: trackingCode, copiedAt: Date.now() });
  };

  const share = (url: string) => {
    setShares((count) => count + 1);
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const clearHistory = () => {
    setCopyHistory([]);
    try {
      window.localStorage.removeItem(storageKey);
    } catch {
      // The in-memory history is still cleared.
    }
  };

  const shareText = encodeURIComponent(`Join me on PropChain: ${generatedUrl}`);

  return (
    <section
      className="mx-auto w-full max-w-2xl rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
      aria-label="Referral link generator"
    >
      <div className="mb-5 flex items-center gap-2">
        <Share2 className="h-5 w-5 text-blue-600" aria-hidden="true" />
        <h2 className="text-xl font-semibold text-slate-900">Referral link generator</h2>
      </div>

      <label htmlFor="tracking-code" className="block text-sm font-medium text-slate-700">
        Custom tracking code <span className="font-normal text-slate-500">(optional)</span>
      </label>
      <div className="mt-2 flex gap-2">
        <input
          id="tracking-code"
          type="text"
          value={customCode}
          onChange={(event) => setCustomCode(sanitizeTrackingCode(event.target.value))}
          onKeyDown={(event) => {
            if (event.key === 'Enter') generateLink();
          }}
          maxLength={40}
          placeholder="summer-2026"
          className="min-w-0 flex-1 rounded-lg border border-slate-300 px-3 py-2 text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:outline-none"
        />
        <button
          type="button"
          onClick={generateLink}
          className="rounded-lg bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700"
        >
          Generate
        </button>
      </div>

      <div className="mt-5">
        <span className="block text-sm font-medium text-slate-700">Your referral link</span>
        <div className="mt-2 flex items-stretch gap-2">
          <output
            className="flex min-w-0 flex-1 items-center overflow-hidden rounded-lg border border-slate-300 bg-slate-50 px-3 py-2"
            aria-live="polite"
          >
            <span className="truncate font-mono text-sm text-slate-700">{generatedUrl}</span>
          </output>
          <button
            type="button"
            onClick={() => void copyLink()}
            className={`flex min-w-28 items-center justify-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium ${
              copied
                ? 'border-green-300 bg-green-50 text-green-700'
                : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
            }`}
            aria-label={copied ? 'Referral link copied' : 'Copy referral link'}
          >
            {copied ? <Check className="h-4 w-4" aria-hidden="true" /> : <Copy className="h-4 w-4" aria-hidden="true" />}
            {copied ? 'Copied!' : 'Copy'}
          </button>
        </div>
      </div>

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <div>
          <h3 className="mb-2 text-sm font-medium text-slate-700">Share</h3>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => share(`https://twitter.com/intent/tweet?text=${shareText}`)}
              className="flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              <Twitter className="h-4 w-4" aria-hidden="true" />
              Twitter
            </button>
            <button
              type="button"
              onClick={() => share(`https://t.me/share/url?url=${encodeURIComponent(generatedUrl)}&text=${encodeURIComponent('Join me on PropChain')}`)}
              className="flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              <Send className="h-4 w-4" aria-hidden="true" />
              Telegram
            </button>
            <button
              type="button"
              onClick={() => share(`mailto:?subject=${encodeURIComponent('Join me on PropChain')}&body=${shareText}`)}
              className="flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              <Mail className="h-4 w-4" aria-hidden="true" />
              Email
            </button>
          </div>
        </div>

        <div className="flex items-start gap-4">
          <div className="shrink-0 rounded-lg border border-slate-200 bg-white p-2" role="img" aria-label="QR code for the referral link">
            {qrDataUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={qrDataUrl} alt="Referral link QR code" width={180} height={180} />
            ) : (
              <div className="flex h-[180px] w-[180px] items-center justify-center text-xs text-slate-500">
                QR unavailable
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3">
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
          <div className="text-2xl font-semibold text-slate-900">{shares}</div>
          <div className="text-sm text-slate-500">Shares</div>
        </div>
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
          <div className="text-2xl font-semibold text-slate-900">{initialClicks}</div>
          <div className="text-sm text-slate-500">Clicks</div>
        </div>
      </div>

      <div className="mt-5">
        <div className="mb-2 flex items-center justify-between">
          <h3 className="text-sm font-medium text-slate-700">Copy history</h3>
          {copyHistory.length > 0 && (
            <button
              type="button"
              onClick={clearHistory}
              className="flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-slate-700"
            >
              <Trash2 className="h-3 w-3" aria-hidden="true" />
              Clear
            </button>
          )}
        </div>
        {copyHistory.length === 0 ? (
          <p className="rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-500">No links copied yet.</p>
        ) : (
          <ul className="space-y-2" aria-label="Referral copy history">
            {copyHistory.map((entry) => (
              <li key={`${entry.url}-${entry.copiedAt}`} className="rounded-lg border border-slate-200 px-3 py-2">
                <p className="truncate font-mono text-xs text-slate-700">{entry.url}</p>
                <p className="mt-1 text-xs text-slate-500">
                  {entry.code} · {new Date(entry.copiedAt).toLocaleString()}
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}

export default ReferralLinkGenerator;
