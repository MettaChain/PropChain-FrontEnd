'use client';

import type { ElementType } from 'react';
import { ShieldCheck, ShieldAlert, Clock3, BadgeAlert } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import type { KycStatus } from '@/types/kyc';

interface KycStatusBadgeProps {
  status: KycStatus;
  thresholdEth: number;
  compact?: boolean;
}

const statusConfig: Record<KycStatus, { label: string; className: string; icon: ElementType }> = {
  unverified: {
    label: 'KYC required',
    className: 'bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300',
    icon: BadgeAlert,
  },
  pending: {
    label: 'KYC pending',
    className: 'bg-sky-100 text-sky-800 dark:bg-sky-950/40 dark:text-sky-300',
    icon: Clock3,
  },
  verified: {
    label: 'KYC verified',
    className: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300',
    icon: ShieldCheck,
  },
  rejected: {
    label: 'KYC review needed',
    className: 'bg-rose-100 text-rose-800 dark:bg-rose-950/40 dark:text-rose-300',
    icon: ShieldAlert,
  },
};

export function KycStatusBadge({ status, thresholdEth, compact = false }: KycStatusBadgeProps) {
  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <Badge
      variant="secondary"
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 ${config.className}`}
      title={`High-value transactions above ${thresholdEth} ETH ${status === 'verified' ? 'are allowed' : 'require KYC review'}`}
    >
      <Icon className="h-3.5 w-3.5" />
      {!compact && <span>{config.label}</span>}
      {compact && <span>{status === 'verified' ? 'Verified' : 'KYC'}</span>}
    </Badge>
  );
}
