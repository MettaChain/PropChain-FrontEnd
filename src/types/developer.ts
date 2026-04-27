export type VerificationStatus = 'unverified' | 'pending' | 'verified' | 'rejected';

export interface DeveloperProfile {
  id: string;
  walletAddress: string;
  name: string;
  company?: string;
  website?: string;
  description?: string;
  /** Property IDs this developer has listed */
  propertyIds: string[];
  verificationStatus: VerificationStatus;
  verifiedAt?: string;
  rejectionReason?: string;
  /** Documents submitted for verification (URLs or IPFS hashes) */
  documents: string[];
  createdAt: string;
}

export interface VerificationCriteria {
  title: string;
  description: string;
}

export const VERIFICATION_CRITERIA: VerificationCriteria[] = [
  {
    title: 'Legal Entity',
    description: 'Registered business or legal entity documentation',
  },
  {
    title: 'Property Ownership',
    description: 'Proof of ownership or authority to tokenize the property',
  },
  {
    title: 'Identity Verification',
    description: 'Government-issued ID or KYC documentation',
  },
  {
    title: 'Track Record',
    description: 'History of completed real estate projects',
  },
];

export interface DeveloperVerificationState {
  developers: DeveloperProfile[];
  /** Add or update a developer profile */
  upsertDeveloper: (developer: DeveloperProfile) => void;
  /** Get developer by wallet address */
  getDeveloperByWallet: (walletAddress: string) => DeveloperProfile | undefined;
  /** Get developer by property ID */
  getDeveloperByProperty: (propertyId: string) => DeveloperProfile | undefined;
  /** Admin: update verification status */
  updateVerificationStatus: (
    developerId: string,
    status: VerificationStatus,
    rejectionReason?: string
  ) => void;
}
