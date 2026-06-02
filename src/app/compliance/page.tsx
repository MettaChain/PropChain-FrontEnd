'use client';

import Link from 'next/link';
import { KycVerificationCenter } from '@/components/kyc/KycVerificationCenter';
import { ComplianceAuditLog } from '@/components/kyc/ComplianceAuditLog';
import { KycStatusBadge } from '@/components/kyc/KycStatusBadge';
import { useKycStore } from '@/store/kycStore';

export default function CompliancePage() {
  const { profile } = useKycStore();

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-8 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <Link href="/dashboard" className="text-sm text-sky-600 hover:underline">
              Back to dashboard
            </Link>
            <h1 className="mt-2 text-3xl font-semibold">Compliance center</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Review KYC progress, threshold settings, and the full audit trail.
            </p>
          </div>
          <KycStatusBadge status={profile.status} thresholdEth={profile.thresholdEth} />
        </div>

        <KycVerificationCenter />
        <ComplianceAuditLog />
      </div>
    </div>
  );
}
