import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  DEFAULT_KYC_THRESHOLD_ETH,
  createComplianceId,
} from '@/lib/kyc';
import type { ComplianceLogEntry, KycDocument, KycProfile, KycState } from '@/types/kyc';

const INITIAL_PROFILE: KycProfile = {
  status: 'unverified',
  provider: 'TrustLayer Mock',
  thresholdEth: DEFAULT_KYC_THRESHOLD_ETH,
  documents: [],
  livenessStatus: 'not_started',
};

export const useKycStore = create<KycState>()(
  persist(
    (set, get) => ({
      profile: INITIAL_PROFILE,
      auditLog: [],

      setThreshold: (thresholdEth: number) => {
        set((state) => ({
          profile: { ...state.profile, thresholdEth },
          auditLog: [
            {
              id: createComplianceId('log'),
              timestamp: new Date().toISOString(),
              event: 'threshold_updated',
              details: { thresholdEth },
            },
            ...state.auditLog,
          ],
        }));
      },

      addDocuments: (documents: KycDocument[]) => {
        set((state) => ({
          profile: {
            ...state.profile,
            documents: [...documents, ...state.profile.documents],
            status: state.profile.status === 'verified' ? 'verified' : 'pending',
            lastReviewedAt: new Date().toISOString(),
          },
          auditLog: [
            ...documents.map((document) => ({
              id: createComplianceId('log'),
              timestamp: document.uploadedAt,
              event: 'document_uploaded' as const,
              details: {
                documentId: document.id,
                name: document.name,
                type: document.type,
                size: document.size,
              },
            })),
            ...state.auditLog,
          ],
        }));
      },

      startLivenessCheck: () => {
        set((state) => ({
          profile: { ...state.profile, livenessStatus: 'pending', status: 'pending' },
          auditLog: [
            {
              id: createComplianceId('log'),
              timestamp: new Date().toISOString(),
              event: 'liveness_started',
              details: { provider: state.profile.provider },
            },
            ...state.auditLog,
          ],
        }));
      },

      completeLivenessCheck: (passed: boolean) => {
        set((state) => ({
          profile: {
            ...state.profile,
            livenessStatus: passed ? 'passed' : 'failed',
            status: passed ? state.profile.status : 'rejected',
            rejectedReason: passed ? undefined : 'Liveness verification failed',
            lastReviewedAt: new Date().toISOString(),
          },
          auditLog: [
            {
              id: createComplianceId('log'),
              timestamp: new Date().toISOString(),
              event: passed ? 'liveness_passed' : 'liveness_failed',
              details: { provider: state.profile.provider },
            },
            ...state.auditLog,
          ],
        }));
      },

      submitVerification: () => {
        const { profile } = get();
        const ready = profile.documents.length > 0 && profile.livenessStatus === 'passed';

        set((state) => ({
          profile: {
            ...state.profile,
            status: ready ? 'pending' : 'rejected',
            rejectedReason: ready ? undefined : 'Upload documents and pass liveness before submitting',
            lastReviewedAt: new Date().toISOString(),
          },
          auditLog: [
            {
              id: createComplianceId('log'),
              timestamp: new Date().toISOString(),
              event: 'verification_submitted',
              details: {
                documentCount: profile.documents.length,
                livenessStatus: profile.livenessStatus,
                ready,
              },
            },
            ...state.auditLog,
          ],
        }));

        if (ready) {
          get().approveVerification();
        }
      },

      approveVerification: () => {
        set((state) => ({
          profile: {
            ...state.profile,
            status: 'verified',
            verifiedAt: new Date().toISOString(),
            rejectedReason: undefined,
            lastReviewedAt: new Date().toISOString(),
          },
          auditLog: [
            {
              id: createComplianceId('log'),
              timestamp: new Date().toISOString(),
              event: 'verification_approved',
              details: {
                provider: state.profile.provider,
                thresholdEth: state.profile.thresholdEth,
              },
            },
            ...state.auditLog,
          ],
        }));
      },

      rejectVerification: (reason: string) => {
        set((state) => ({
          profile: {
            ...state.profile,
            status: 'rejected',
            rejectedReason: reason,
            lastReviewedAt: new Date().toISOString(),
          },
          auditLog: [
            {
              id: createComplianceId('log'),
              timestamp: new Date().toISOString(),
              event: 'verification_rejected',
              details: { reason },
            },
            ...state.auditLog,
          ],
        }));
      },

      resetKyc: () => {
        set({
          profile: INITIAL_PROFILE,
          auditLog: [],
        });
      },

      logTransactionScreening: (valueEth: number, thresholdHit: boolean, allowed: boolean) => {
        set((state) => ({
          auditLog: [
            {
              id: createComplianceId('log'),
              timestamp: new Date().toISOString(),
              event: allowed ? 'transaction_screened' : 'transaction_blocked',
              details: {
                valueEth,
                thresholdHit,
                allowed,
              },
            },
            ...state.auditLog,
          ],
        }));
      },
    }),
    {
      name: 'propchain-kyc',
      partialize: (state) => ({
        profile: state.profile,
        auditLog: state.auditLog,
      }),
    }
  )
);
