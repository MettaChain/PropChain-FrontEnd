'use client';

import { useState } from 'react';
import { logger } from '@/utils/logger';

export interface ShareButtonProps {
  url: string;
  onShare?: () => void;
}

const SHARE_TEXT =
  'Join PropChain - Invest in real estate through blockchain. Use my referral link and earn rewards!';

function isSafeUrl(raw: string): boolean {
  try {
    const parsed = new URL(raw);
    return parsed.protocol === 'https:' || parsed.protocol === 'http:';
  } catch {
    return false;
  }
}

export default function ShareButton({ url, onShare }: ShareButtonProps) {
  const [showOptions, setShowOptions] = useState(false);

  const shareVia = (platform: string) => {
    if (!isSafeUrl(url)) {
      logger.error('ShareButton: refused to share unsafe URL', { url });
      return;
    }

    const text = encodeURIComponent(SHARE_TEXT);
    const urlEncoded = encodeURIComponent(url);
    let shareUrl = '';

    switch (platform) {
      case 'twitter':
        shareUrl = `https://twitter.com/intent/tweet?text=${text}&url=${urlEncoded}`;
        break;
      case 'facebook':
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${urlEncoded}`;
        break;
      case 'linkedin':
        shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${urlEncoded}`;
        break;
      case 'telegram':
        shareUrl = `https://t.me/share/url?url=${urlEncoded}&text=${text}`;
        break;
      default:
        return;
    }

    window.open(shareUrl, 'share', 'width=600,height=400,noopener,noreferrer');
    onShare?.();
    setShowOptions(false);
  };

  const handleNativeShare = async () => {
    if (!navigator.share) return;
    if (!isSafeUrl(url)) {
      logger.error('ShareButton: refused to share unsafe URL via native share', { url });
      return;
    }

    try {
      await navigator.share({
        title: 'PropChain Referral',
        text: 'Join PropChain - Invest in real estate through blockchain!',
        url,
      });
      onShare?.();
      setShowOptions(false);
    } catch (error) {
      if (error instanceof Error && error.name !== 'AbortError') {
        logger.error('Native share failed:', error);
      }
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setShowOptions(!showOptions)}
        className="flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100"
      >
        <span>📤</span>
        Share
      </button>

      {showOptions && (
        <div className="absolute right-0 top-full z-10 mt-2 rounded-lg border border-slate-200 bg-white shadow-lg">
          {navigator.share && (
            <button
              onClick={handleNativeShare}
              className="flex w-full items-center gap-2 px-4 py-2 hover:bg-slate-50 first:rounded-t-lg"
            >
              <span>↗️</span>
              Share
            </button>
          )}
          <button
            onClick={() => shareVia('twitter')}
            className="flex w-full items-center gap-2 px-4 py-2 hover:bg-slate-50"
          >
            <span>𝕏</span>
            Twitter
          </button>
          <button
            onClick={() => shareVia('facebook')}
            className="flex w-full items-center gap-2 px-4 py-2 hover:bg-slate-50"
          >
            <span>f</span>
            Facebook
          </button>
          <button
            onClick={() => shareVia('linkedin')}
            className="flex w-full items-center gap-2 px-4 py-2 hover:bg-slate-50"
          >
            <span>in</span>
            LinkedIn
          </button>
          <button
            onClick={() => shareVia('telegram')}
            className="flex w-full items-center gap-2 px-4 py-2 hover:bg-slate-50 last:rounded-b-lg"
          >
            <span>✈️</span>
            Telegram
          </button>
        </div>
      )}
    </div>
  );
}
