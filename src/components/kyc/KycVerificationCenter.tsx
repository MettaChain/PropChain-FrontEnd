'use client';

import { useMemo, useState, type ChangeEvent } from 'react';
import { useRouter } from 'next/navigation';
import { BadgeCheck, FileUp, ScanFace, ShieldAlert, ShieldCheck, UploadCloud } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { useKycStore } from '@/store/kycStore';
import { DEFAULT_KYC_THRESHOLD_ETH, createComplianceId, formatEthAmount } from '@/lib/kyc';
import type { KycDocument } from '@/types/kyc';

export function KycVerificationCenter() {
  const router = useRouter();
  const { profile, setThreshold, addDocuments, startLivenessCheck, completeLivenessCheck, submitVerification, resetKyc } =
    useKycStore();
  const [thresholdDraft, setThresholdDraft] = useState(String(profile.thresholdEth));
  const [notes, setNotes] = useState('');

  const completion = useMemo(() => {
    const steps = [
      profile.documents.length > 0,
      profile.livenessStatus === 'passed',
      profile.status === 'verified',
    ];
    return (steps.filter(Boolean).length / steps.length) * 100;
  }, [profile.documents.length, profile.livenessStatus, profile.status]);

  const handleDocumentUpload = (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (!files.length) return;

    const documents: KycDocument[] = files.map((file) => ({
      id: createComplianceId('doc'),
      name: file.name,
      type: file.type || 'application/octet-stream',
      size: file.size,
      uploadedAt: new Date().toISOString(),
    }));

    addDocuments(documents);
    event.target.value = '';
  };

  const handleLiveness = async () => {
    startLivenessCheck();
    window.setTimeout(() => {
      completeLivenessCheck(true);
    }, 1200);
  };

  const handleThresholdSave = () => {
    const threshold = Number(thresholdDraft);
    if (!Number.isFinite(threshold) || threshold < 0) return;
    setThreshold(threshold);
  };

  return (
    <Card className="border-slate-200 dark:border-slate-800">
      <CardHeader className="space-y-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle className="text-lg">Automated KYC / AML flow</CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">
              High-value transactions pause here until identity checks are complete.
            </p>
          </div>
          <div className="rounded-full bg-slate-100 px-3 py-1 text-sm text-slate-700 dark:bg-slate-800 dark:text-slate-200">
            Provider: {profile.provider}
          </div>
        </div>
        <Progress value={completion} className="h-2" />
      </CardHeader>

      <CardContent className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="kyc-threshold">KYC threshold (ETH)</Label>
            <div className="flex gap-2">
              <Input
                id="kyc-threshold"
                type="number"
                min="0"
                step="0.1"
                value={thresholdDraft}
                onChange={(event) => setThresholdDraft(event.target.value)}
              />
              <Button variant="outline" onClick={handleThresholdSave}>
                Save
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Transactions at or above {formatEthAmount(profile.thresholdEth)} ETH trigger identity review.
            </p>
          </div>

          <div className="space-y-2">
            <Label>KYC status</Label>
            <div className="flex flex-wrap items-center gap-2">
              <BadgeCheck className="h-4 w-4 text-emerald-600" />
              <span className="text-sm font-medium capitalize">{profile.status}</span>
              <span className="text-xs text-muted-foreground">
                Liveness: {profile.livenessStatus}
              </span>
            </div>
          </div>
        </div>

        <Separator />

        <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="space-y-4">
            <div className="rounded-xl border border-dashed border-slate-300 p-4 dark:border-slate-700">
              <div className="flex items-start gap-3">
                <UploadCloud className="mt-0.5 h-5 w-5 text-sky-600" />
                <div className="flex-1">
                  <h3 className="font-medium">Document upload flow</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Upload a passport, national ID, or company registration document.
                  </p>
                  <div className="mt-3">
                    <Input
                      type="file"
                      multiple
                      accept="image/*,application/pdf"
                      onChange={handleDocumentUpload}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-dashed border-slate-300 p-4 dark:border-slate-700">
              <div className="flex items-start gap-3">
                <ScanFace className="mt-0.5 h-5 w-5 text-violet-600" />
                <div className="flex-1">
                  <h3 className="font-medium">Liveness check integration</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Simulated provider flow runs a face check before submission.
                  </p>
                  <Button className="mt-3" onClick={handleLiveness}>
                    Run liveness check
                  </Button>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="kyc-notes">Reviewer notes</Label>
              <Textarea
                id="kyc-notes"
                placeholder="Anything compliance should know?"
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
              />
            </div>
          </div>

          <div className="space-y-4 rounded-xl bg-slate-50 p-4 dark:bg-slate-900/40">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Current checklist</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  resetKyc();
                  setThresholdDraft(String(DEFAULT_KYC_THRESHOLD_ETH));
                }}
              >
                Reset
              </Button>
            </div>

            <ul className="space-y-3 text-sm">
              <li className="flex items-start gap-2">
                {profile.documents.length > 0 ? (
                  <ShieldCheck className="mt-0.5 h-4 w-4 text-emerald-600" />
                ) : (
                  <ShieldAlert className="mt-0.5 h-4 w-4 text-amber-600" />
                )}
                <span>{profile.documents.length} document(s) uploaded</span>
              </li>
              <li className="flex items-start gap-2">
                {profile.livenessStatus === 'passed' ? (
                  <ShieldCheck className="mt-0.5 h-4 w-4 text-emerald-600" />
                ) : (
                  <ShieldAlert className="mt-0.5 h-4 w-4 text-amber-600" />
                )}
                <span>Liveness status: {profile.livenessStatus}</span>
              </li>
              <li className="flex items-start gap-2">
                <FileUp className="mt-0.5 h-4 w-4 text-sky-600" />
                <span>Provider notes: {notes || 'No notes yet'}</span>
              </li>
            </ul>

            <Button className="w-full" onClick={submitVerification}>
              Submit verification
            </Button>

            {profile.status === 'verified' && (
              <Button variant="outline" className="w-full" onClick={() => router.push('/compliance')}>
                View compliance log
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
