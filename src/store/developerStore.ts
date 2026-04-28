import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { DeveloperProfile, DeveloperVerificationState, VerificationStatus } from '@/types/developer';

// Seed mock verified developers so the UI has data to show
const MOCK_DEVELOPERS: DeveloperProfile[] = [
  {
    id: 'dev-1',
    walletAddress: '0xAbCd1234567890AbCd1234567890AbCd12345678',
    name: 'Skyline Properties',
    company: 'Skyline Properties LLC',
    website: 'https://skylineproperties.example.com',
    description: 'Premium real estate developer with 15+ years of experience in residential and commercial projects.',
    propertyIds: ['prop-1', 'prop-2'],
    verificationStatus: 'verified',
    verifiedAt: '2024-01-15T10:00:00Z',
    documents: [],
    createdAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'dev-2',
    walletAddress: '0xDeF0987654321DeF0987654321DeF098765432',
    name: 'Urban Ventures',
    company: 'Urban Ventures Inc.',
    website: 'https://urbanventures.example.com',
    description: 'Specializing in urban redevelopment and mixed-use properties.',
    propertyIds: ['prop-3'],
    verificationStatus: 'pending',
    documents: [],
    createdAt: '2024-02-01T00:00:00Z',
  },
];

export const useDeveloperStore = create<DeveloperVerificationState>()(
  persist(
    (set, get) => ({
      developers: MOCK_DEVELOPERS,

      upsertDeveloper: (developer: DeveloperProfile) => {
        set((state) => {
          const exists = state.developers.some((d) => d.id === developer.id);
          return {
            developers: exists
              ? state.developers.map((d) => (d.id === developer.id ? developer : d))
              : [developer, ...state.developers],
          };
        });
      },

      getDeveloperByWallet: (walletAddress: string) => {
        return get().developers.find(
          (d) => d.walletAddress.toLowerCase() === walletAddress.toLowerCase()
        );
      },

      getDeveloperByProperty: (propertyId: string) => {
        return get().developers.find((d) => d.propertyIds.includes(propertyId));
      },

      updateVerificationStatus: (
        developerId: string,
        status: VerificationStatus,
        rejectionReason?: string
      ) => {
        set((state) => ({
          developers: state.developers.map((d) =>
            d.id === developerId
              ? {
                  ...d,
                  verificationStatus: status,
                  verifiedAt: status === 'verified' ? new Date().toISOString() : d.verifiedAt,
                  rejectionReason: status === 'rejected' ? rejectionReason : undefined,
                }
              : d
          ),
        }));
      },
    }),
    { name: 'propchain-developers' }
  )
);
