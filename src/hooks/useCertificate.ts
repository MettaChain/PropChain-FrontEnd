'use client';

import { useCallback } from 'react';
import { useCertificateStore } from '@/store/certificateStore';
import { useWalletStore } from '@/store/walletStore';
import type { NFTCertificate } from '@/types/certificate';
import type { Property } from '@/types/property';
import { CHAIN_CONFIG } from '@/config/chains';

interface PurchaseDetails {
  tokenAmount: number;
  transactionHash: string;
}

export function useCertificate() {
  const { addCertificate, getCertificate, certificates } = useCertificateStore();
  const { address, chainId } = useWalletStore();

  /**
   * Auto-generates and stores a certificate after a successful purchase.
   */
  const generateCertificate = useCallback(
    (property: Property, purchase: PurchaseDetails): NFTCertificate | null => {
      if (!address) return null;

      const chainConfig = CHAIN_CONFIG[chainId];
      const ownershipPercentage =
        (purchase.tokenAmount / property.tokenInfo.totalSupply) * 100;

      const cert: NFTCertificate = {
        id: `cert-${property.id}-${address}-${Date.now()}`,
        propertyId: property.id,
        propertyName: property.name,
        propertyAddress: [
          property.location.address,
          property.location.city,
          property.location.state,
        ].join(', '),
        propertyImage: property.images[0] ?? '',
        tokenAmount: purchase.tokenAmount,
        tokenSymbol: property.tokenInfo.tokenSymbol,
        walletAddress: address,
        purchaseDate: new Date().toISOString(),
        transactionHash: purchase.transactionHash,
        network: chainConfig?.name ?? property.blockchain,
        contractAddress: property.tokenInfo.contractAddress,
        ownershipPercentage,
      };

      addCertificate(cert);
      return cert;
    },
    [address, chainId, addCertificate]
  );

  const getCertificateForProperty = useCallback(
    (propertyId: string) => {
      if (!address) return undefined;
      return getCertificate(propertyId, address);
    },
    [address, getCertificate]
  );

  const userCertificates = address
    ? certificates.filter((c) => c.walletAddress === address)
    : [];

  return { generateCertificate, getCertificateForProperty, userCertificates };
}
