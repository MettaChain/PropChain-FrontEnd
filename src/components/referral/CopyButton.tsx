'use client';

/**
 * CopyButton - Button for copying referral links to clipboard
 */

import { useState } from 'react';

export interface CopyButtonProps {
  text: string;
  onCopy?: () => void;
  isCopied?: boolean;
}

export default function CopyButton({
  text,
  onCopy,
  isCopied = false,
}: CopyButtonProps) {
  const handleClick = async () => {
    try {
      await navigator.clipboard.writeText(text);
      onCopy?.();
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  return (
    <button
      onClick={handleClick}
      className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
        isCopied
          ? 'bg-green-100 text-green-700'
          : 'bg-white text-slate-700 hover:bg-slate-100'
      } border border-slate-300`}
    >
      {isCopied ? (
        <>
          <span>✓</span>
          Copied!
        </>
      ) : (
        <>
          <span>📋</span>
          Copy Link
        </>
      )}
    </button>
  );
}
