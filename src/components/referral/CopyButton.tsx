'use client';

import { memo } from 'react';
import { logger } from '@/utils/logger';

export interface CopyButtonProps {
  text: string;
  onCopy?: () => void;
  isCopied?: boolean;
}

const CopyButton = memo(function CopyButton({
  text,
  onCopy,
  isCopied = false,
}: CopyButtonProps) {
  const handleClick = async () => {
    try {
      await navigator.clipboard.writeText(text);
      onCopy?.();
    } catch (error) {
      logger.error('Failed to copy to clipboard:', error);
    }
  };

  return (
    <button
      onClick={handleClick}
      aria-label={isCopied ? 'Link copied' : 'Copy referral link'}
      className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
        isCopied
          ? 'bg-green-100 text-green-700'
          : 'bg-white text-slate-700 hover:bg-slate-100'
      } border border-slate-300`}
    >
      {isCopied ? (
        <>
          <span aria-hidden="true">✓</span>
          Copied!
        </>
      ) : (
        <>
          <span aria-hidden="true">📋</span>
          Copy Link
        </>
      )}
    </button>
  );
});

export default CopyButton;
