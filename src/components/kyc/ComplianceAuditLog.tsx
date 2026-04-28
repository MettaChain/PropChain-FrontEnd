'use client';

import { formatDistanceToNow } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useKycStore } from '@/store/kycStore';
import type { ComplianceLogEntry } from '@/types/kyc';

const eventLabels: Record<ComplianceLogEntry['event'], string> = {
  threshold_updated: 'Threshold updated',
  document_uploaded: 'Document uploaded',
  liveness_started: 'Liveness started',
  liveness_passed: 'Liveness passed',
  liveness_failed: 'Liveness failed',
  verification_submitted: 'Verification submitted',
  verification_approved: 'Verification approved',
  verification_rejected: 'Verification rejected',
  transaction_screened: 'Transaction screened',
  transaction_blocked: 'Transaction blocked',
};

const eventTone: Record<ComplianceLogEntry['event'], string> = {
  threshold_updated: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200',
  document_uploaded: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-950/40 dark:text-cyan-300',
  liveness_started: 'bg-blue-100 text-blue-800 dark:bg-blue-950/40 dark:text-blue-300',
  liveness_passed: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300',
  liveness_failed: 'bg-rose-100 text-rose-800 dark:bg-rose-950/40 dark:text-rose-300',
  verification_submitted: 'bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300',
  verification_approved: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300',
  verification_rejected: 'bg-rose-100 text-rose-800 dark:bg-rose-950/40 dark:text-rose-300',
  transaction_screened: 'bg-violet-100 text-violet-800 dark:bg-violet-950/40 dark:text-violet-300',
  transaction_blocked: 'bg-rose-100 text-rose-800 dark:bg-rose-950/40 dark:text-rose-300',
};

export function ComplianceAuditLog() {
  const auditLog = useKycStore((state) => state.auditLog);

  return (
    <Card className="border-slate-200 dark:border-slate-800">
      <CardHeader>
        <CardTitle className="text-lg">Compliance audit log</CardTitle>
      </CardHeader>
      <CardContent>
        {auditLog.length === 0 ? (
          <p className="text-sm text-muted-foreground">No compliance activity yet.</p>
        ) : (
          <ScrollArea className="h-[320px] pr-3">
            <div className="space-y-3">
              {auditLog.map((entry) => (
                <div
                  key={entry.id}
                  className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-950/30 p-3"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Badge className={`rounded-full px-2 py-0.5 ${eventTone[entry.event]}`}>
                        {eventLabels[entry.event]}
                      </Badge>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(entry.timestamp), { addSuffix: true })}
                    </span>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-2 text-xs text-muted-foreground">
                    {Object.entries(entry.details).map(([key, value]) => (
                      <span key={key} className="rounded-full bg-slate-100 px-2 py-1 dark:bg-slate-800">
                        {key}: {String(value)}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
