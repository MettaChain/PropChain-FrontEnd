export type KycStatus = 'unverified' | 'pending' | 'verified' | 'rejected';
export type LivenessStatus = 'not_started' | 'pending' | 'passed' | 'failed';

export interface KycDocument {
  id: string;
  name: string;
  type: string;
  size: number;
  uploadedAt: string;
}

export interface ComplianceLogEntry {
  id: string;
  timestamp: string;
  event:
    | 'threshold_updated'
    | 'document_uploaded'
    | 'liveness_started'
    | 'liveness_passed'
    | 'liveness_failed'
    | 'verification_submitted'
    | 'verification_approved'
    | 'verification_rejected'
    | 'transaction_screened'
    | 'transaction_blocked';
  details: Record<string, string | number | boolean | null>;
}

export interface KycProfile {
  status: KycStatus;
  provider: string;
  thresholdEth: number;
  documents: KycDocument[];
  livenessStatus: LivenessStatus;
  lastReviewedAt?: string;
  verifiedAt?: string;
  rejectedReason?: string;
}

export interface KycState {
  profile: KycProfile;
  auditLog: ComplianceLogEntry[];
  setThreshold: (thresholdEth: number) => void;
  addDocuments: (documents: KycDocument[]) => void;
  startLivenessCheck: () => void;
  completeLivenessCheck: (passed: boolean) => void;
  submitVerification: () => void;
  approveVerification: () => void;
  rejectVerification: (reason: string) => void;
  resetKyc: () => void;
  logTransactionScreening: (valueEth: number, thresholdHit: boolean, allowed: boolean) => void;
}
