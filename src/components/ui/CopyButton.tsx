'use client';
import { logger } from '@/utils/logger';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Copy, Check, Share2, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';

interface CopyButtonProps {
  text: string;
  label?: string;
  variant?: 'default' | 'icon' | 'text';
  size?: 'sm' | 'default' | 'lg';
  className?: string;
  showConfirmation?: boolean;
  onCopy?: (copiedText: string) => void;
}

export const CopyButton: React.FC<CopyButtonProps> = ({
  text,
  label = 'Copy',
  variant = 'default',
  size = 'sm',
  className = '',
  showConfirmation = true,
  onCopy,
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      
      if (showConfirmation) {
        toast.success('Copied to clipboard!', {
          duration: 2000,
          position: 'top-right',
        });
      }
      
      if (onCopy) {
        onCopy(text);
      }
      
      // Reset copied state after 2 seconds
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      logger.error('Failed to copy:', error);
      toast.error('Failed to copy to clipboard', {
        duration: 3000,
        position: 'top-right',
      });
    }
  };

  const renderIcon = () => {
    if (copied) {
      return <Check className="w-4 h-4 text-green-500" />;
    }
    return <Copy className="w-4 h-4" />;
  };

  if (variant === 'icon') {
    return (
      <Button
        variant="ghost"
        size={size}
        onClick={handleCopy}
        className={`p-1 h-auto hover:bg-gray-100 dark:hover:bg-gray-800 ${className}`}
        title="Copy to clipboard"
      >
        {renderIcon()}
      </Button>
    );
  }

  if (variant === 'text') {
    return (
      <button
        onClick={handleCopy}
        className={`text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 transition-colors flex items-center gap-1 ${className}`}
      >
        {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
        {copied ? 'Copied!' : label}
      </button>
    );
  }

  return (
    <Button
      variant="outline"
      size={size}
      onClick={handleCopy}
      className={`flex items-center gap-2 ${className}`}
    >
      {renderIcon()}
      {copied ? 'Copied!' : label}
    </Button>
  );
};

// Specialized copy buttons for different use cases

interface CopyAddressProps {
  address: string;
  className?: string;
  showFull?: boolean;
}

export const CopyAddress: React.FC<CopyAddressProps> = ({
  address,
  className = '',
  showFull = false,
}) => {
  const displayAddress = showFull ? address : `${address.slice(0, 6)}...${address.slice(-4)}`;
  
  return (
    <div className={`flex items-center gap-2 font-mono text-sm ${className}`}>
      <span className="text-gray-600 dark:text-gray-400">{displayAddress}</span>
      <CopyButton
        text={address}
        variant="icon"
        className="p-0.5"
        showConfirmation={false}
      />
    </div>
  );
};

interface CopyTransactionHashProps {
  hash: string;
  className?: string;
  showExplorer?: boolean;
  explorerUrl?: string;
}

export const CopyTransactionHash: React.FC<CopyTransactionHashProps> = ({
  hash,
  className = '',
  showExplorer = true,
  explorerUrl,
}) => {
  const displayHash = `${hash.slice(0, 10)}...${hash.slice(-8)}`;
  
  const handleViewOnExplorer = () => {
    if (explorerUrl) {
      window.open(explorerUrl, '_blank');
    }
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <span className="font-mono text-xs text-gray-600 dark:text-gray-400">
        {displayHash}
      </span>
      <CopyButton
        text={hash}
        variant="icon"
        className="p-0.5"
        showConfirmation={false}
      />
      {showExplorer && explorerUrl && (
        <Button
          variant="ghost"
          size="sm"
          onClick={handleViewOnExplorer}
          className="p-0.5 h-auto hover:bg-gray-100 dark:hover:bg-gray-800"
          title="View on blockchain explorer"
        >
          <ExternalLink className="w-3 h-3" />
        </Button>
      )}
    </div>
  );
};

interface CopyShareLinkProps {
  url: string;
  title?: string;
  className?: string;
}

export const CopyShareLink: React.FC<CopyShareLinkProps> = ({
  url,
  title = 'Share',
  className = '',
}) => {
  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: title,
          url: url,
        });
      } catch (error) {
        // Fallback to copy if share fails
        await navigator.clipboard.writeText(url);
        toast.success('Link copied to clipboard!');
      }
    } else {
      // Fallback for browsers that don't support Web Share API
      await navigator.clipboard.writeText(url);
      toast.success('Link copied to clipboard!');
    }
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleShare}
      className={`flex items-center gap-2 ${className}`}
    >
      <Share2 className="w-4 h-4" />
      {title}
    </Button>
  );
};

// Hook for copy functionality
export const useCopyToClipboard = () => {
  const copy = async (text: string, successMessage?: string) => {
    try {
      await navigator.clipboard.writeText(text);
      if (successMessage) {
        toast.success(successMessage);
      }
      return true;
    } catch (error) {
      logger.error('Failed to copy:', error);
      toast.error('Failed to copy to clipboard');
      return false;
    }
  };

  return { copy };
};
