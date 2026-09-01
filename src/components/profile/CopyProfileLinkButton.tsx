'use client';

import React, { useState } from 'react';
import { Link2, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { logger } from '@/utils/logger';

interface CopyProfileLinkButtonProps {
  username: string;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg';
  className?: string;
}

export const CopyProfileLinkButton: React.FC<CopyProfileLinkButtonProps> = ({
  username,
  variant = 'outline',
  size = 'default',
  className = '',
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopyLink = async () => {
    try {
      // Check if clipboard API is available
      if (!navigator.clipboard) {
        throw new Error('Clipboard API not available');
      }

      const profileUrl = `${window.location.origin}/u/${username}`;
      await navigator.clipboard.writeText(profileUrl);

      setCopied(true);
      toast.success('Profile link copied to clipboard!');

      // Reset copied state after 2 seconds
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      logger.error('Error copying profile link:', error);
      toast.error('Failed to copy profile link');
    }
  };

  return (
    <Button
      onClick={handleCopyLink}
      variant={variant}
      size={size}
      className={className}
      disabled={copied}
    >
      {copied ? (
        <>
          <Check className="w-4 h-4 mr-2" />
          Copied!
        </>
      ) : (
        <>
          <Link2 className="w-4 h-4 mr-2" />
          Copy link
        </>
      )}
    </Button>
  );
};
