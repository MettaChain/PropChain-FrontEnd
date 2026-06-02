'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { useCertificate } from '@/hooks/useCertificate';
import { useWalletStore } from '@/store/walletStore';
import { NFTCertificateCard } from '@/components/NFTCertificate';
import type { NFTCertificate } from '@/types/certificate';

export function CertificatesPanel() {
  const { isConnected } = useWalletStore();
  const { userCertificates } = useCertificate();
  const [selected, setSelected] = useState<NFTCertificate | null>(null);

  if (!isConnected) {
    return (
      <div className="rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-6 text-center text-gray-500 dark:text-gray-400">
        Connect your wallet to view your ownership certificates.
      </div>
    );
  }

  if (userCertificates.length === 0) {
    return (
      <div className="rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-6 text-center text-gray-500 dark:text-gray-400">
        No certificates yet. Purchase property tokens to receive an ownership certificate.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {selected ? (
        <div className="space-y-4">
          <button
            onClick={() => setSelected(null)}
            className="text-sm text-blue-600 hover:underline"
          >
            ← Back to all certificates
          </button>
          <NFTCertificateCard certificate={selected} />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {userCertificates.map((cert) => (
            <button
              key={cert.id}
              onClick={() => setSelected(cert)}
              className="text-left rounded-xl border border-amber-300 bg-gradient-to-br from-slate-900 to-slate-800 text-white p-4 hover:border-amber-400 transition-colors shadow-md"
            >
              <div className="flex gap-3 items-start">
                {cert.propertyImage && (
                  <div className="relative w-14 h-14 flex-shrink-0">
                    <Image
                      src={cert.propertyImage}
                      alt={cert.propertyName}
                      width={56}
                      height={56}
                      className="object-cover rounded-lg"
                    />
                  </div>
                )}
                <div className="min-w-0">
                  <p className="font-semibold text-amber-400 truncate">{cert.propertyName}</p>
                  <p className="text-xs text-slate-400 truncate">{cert.propertyAddress}</p>
                  <p className="text-sm mt-1 font-bold">
                    {cert.tokenAmount.toLocaleString()} {cert.tokenSymbol}
                  </p>
                  <p className="text-xs text-slate-400">
                    {new Date(cert.purchaseDate).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
