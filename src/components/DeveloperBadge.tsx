'use client';

import React from 'react';
import { ShieldCheck, ShieldAlert, Clock } from 'lucide-react';
import type { VerificationStatus } from '@/types/developer';

interface DeveloperBadgeProps {
  status: VerificationStatus;
  developerName?: string;
  /** compact = icon only, default = icon + label */
  compact?: boolean;
}

export function DeveloperBadge({ status, developerName, compact = false }: DeveloperBadgeProps) {
  if (status === 'verified') {
    return (
      <span
        title={developerName ? `Verified developer: ${developerName}` : 'Verified developer'}
        className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400 text-xs font-semibold px-2 py-0.5 rounded-full"
      >
        <ShieldCheck className="w-3.5 h-3.5" />
        {!compact && <span>Verified Developer</span>}
      </span>
    );
  }

  if (status === 'pending') {
    return (
      <span
        title="Verification pending"
        className="inline-flex items-center gap-1 bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-400 text-xs font-semibold px-2 py-0.5 rounded-full"
      >
        <Clock className="w-3.5 h-3.5" />
        {!compact && <span>Pending Verification</span>}
      </span>
    );
  }

  // unverified or rejected
  return (
    <span
      title="Unverified developer — invest with caution"
      className="inline-flex items-center gap-1 bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400 text-xs font-semibold px-2 py-0.5 rounded-full"
    >
      <ShieldAlert className="w-3.5 h-3.5" />
      {!compact && <span>Unverified</span>}
    </span>
  );
}
