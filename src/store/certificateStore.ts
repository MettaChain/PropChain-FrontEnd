import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { NFTCertificate, CertificateState } from '@/types/certificate';

export const useCertificateStore = create<CertificateState>()(
  persist(
    (set, get) => ({
      certificates: [],

      addCertificate: (cert: NFTCertificate) => {
        set((state) => ({
          certificates: [
            cert,
            ...state.certificates.filter(
              (c) => !(c.propertyId === cert.propertyId && c.walletAddress === cert.walletAddress)
            ),
          ],
        }));
      },

      getCertificate: (propertyId: string, walletAddress: string) => {
        return get().certificates.find(
          (c) => c.propertyId === propertyId && c.walletAddress === walletAddress
        );
      },
    }),
    { name: 'propchain-certificates' }
  )
);
