'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { Share2, Twitter, Linkedin, Link2, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { toast } from 'sonner';

interface ShareButtonProps {
  property: {
    id: string;
    name: string;
    location: {
      city: string;
      state: string;
    };
    price: {
      total: number;
      perToken: number;
    };
    images: string[];
    metrics: {
      roi: number;
    };
  };
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg';
  className?: string;
}

export const ShareButton: React.FC<ShareButtonProps> = ({
  property,
  variant = 'outline',
  size = 'default',
  className = '',
}) => {
  const [copied, setCopied] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const propertyUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/properties/${property.id}`;
  
  const shareText = `Check out this property: ${property.name} in ${property.location.city}, ${property.location.state}. ${property.metrics.roi}% ROI - ${property.price.total} ETH total value.`;
  
  const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(propertyUrl)}`;
  
  const linkedinUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(propertyUrl)}`;

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: property.name,
          text: shareText,
          url: propertyUrl,
        });
        toast.success('Property shared successfully!');
      } catch (error) {
        // User cancelled or error occurred
        if ((error as Error).name !== 'AbortError') {
          console.error('Error sharing:', error);
          toast.error('Failed to share property');
        }
      }
    } else {
      // Fallback to copy link
      handleCopyLink();
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(propertyUrl);
      setCopied(true);
      toast.success('Link copied to clipboard!');
      
      // Reset copied state after 2 seconds
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Error copying link:', error);
      toast.error('Failed to copy link');
    }
  };

  const handleTwitterShare = () => {
    window.open(twitterUrl, '_blank', 'width=550,height=420');
    toast.success('Opening Twitter share dialog...');
  };

  const handleLinkedInShare = () => {
    window.open(linkedinUrl, '_blank', 'width=550,height=420');
    toast.success('Opening LinkedIn share dialog...');
  };

  const handleEmailShare = () => {
    const subject = encodeURIComponent(`Check out this property: ${property.name}`);
    const body = encodeURIComponent(`I found this interesting property and thought you might like it:\n\n${shareText}\n\nView it here: ${propertyUrl}`);
    window.open(`mailto:?subject=${subject}&body=${body}`);
    toast.success('Opening email client...');
  };

  const isNativeShareSupported = typeof navigator !== 'undefined' && navigator.share;

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogTrigger asChild>
        <Button variant={variant} size={size} className={className}>
          <Share2 className="w-4 h-4 mr-2" />
          Share
        </Button>
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Share Property</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Property Preview */}
          <div className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div className="relative w-16 h-16 bg-gray-200 dark:bg-gray-700 rounded-lg overflow-hidden flex-shrink-0">
              {property.images[0] && (
                <Image
                  src={property.images[0]}
                  alt={property.name}
                  width={64}
                  height={64}
                  className="object-cover"
                />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-semibold text-gray-900 dark:text-white truncate">
                {property.name}
              </h4>
              <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                {property.location.city}, {property.location.state}
              </p>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  {property.price.total} ETH
                </span>
                <span className="text-sm text-green-600">
                  {property.metrics.roi}% ROI
                </span>
              </div>
            </div>
          </div>

          {/* Share Options */}
          <div className="grid grid-cols-2 gap-2">
            {isNativeShareSupported && (
              <Button
                onClick={handleNativeShare}
                className="w-full justify-start"
                variant="outline"
              >
                <Share2 className="w-4 h-4 mr-2" />
                Native Share
              </Button>
            )}
            
            <Button
              onClick={handleTwitterShare}
              className="w-full justify-start"
              variant="outline"
            >
              <Twitter className="w-4 h-4 mr-2" />
              Twitter
            </Button>
            
            <Button
              onClick={handleLinkedInShare}
              className="w-full justify-start"
              variant="outline"
            >
              <Linkedin className="w-4 h-4 mr-2" />
              LinkedIn
            </Button>
            
            <Button
              onClick={handleEmailShare}
              className="w-full justify-start"
              variant="outline"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              Email
            </Button>
          </div>

          {/* Copy Link */}
          <Button
            onClick={handleCopyLink}
            className="w-full"
            variant={copied ? "default" : "outline"}
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 mr-2" />
                Copied!
              </>
            ) : (
              <>
                <Link2 className="w-4 h-4 mr-2" />
                Copy Link
              </>
            )}
          </Button>

          {/* Share Message Preview */}
          <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Share message:</p>
            <p className="text-sm text-gray-900 dark:text-white line-clamp-3">
              {shareText}
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
