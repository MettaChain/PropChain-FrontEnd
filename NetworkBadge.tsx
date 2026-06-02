import React from 'react';
import { AlertCircle, Globe } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

const SUPPORTED_NETWORKS: Record<number, string> = {
  1: 'Ethereum',
  137: 'Polygon',
  56: 'BSC',
};

export const NetworkBadge: React.FC<{ chainId: number | null }> = ({ chainId }) => {
  const isSupported = chainId !== null && !!SUPPORTED_NETWORKS[chainId];
  const networkName = isSupported ? SUPPORTED_NETWORKS[chainId!] : 'Unsupported Network';

  if (!isSupported) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge variant="destructive" className="flex items-center gap-1 cursor-help">
              <AlertCircle className="h-3 w-3" />
              <span className="hidden sm:inline">Unsupported</span>
            </Badge>
          </TooltipTrigger>
          <TooltipContent>
            <p>Please switch to Ethereum, Polygon, or BSC</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <Badge variant="secondary" className="flex items-center gap-1 bg-green-50 text-green-700 hover:bg-green-100 border-green-200">
      <Globe className="h-3 w-3" />
      <span>{networkName}</span>
    </Badge>
  );
};