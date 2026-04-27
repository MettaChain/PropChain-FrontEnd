'use client';

import React, { useRef, useState } from 'react';
import type { NFTCertificate } from '@/types/certificate';
import {
  downloadCertificatePng,
  downloadCertificatePdf,
  getCertificateShareUrl,
} from '@/lib/certificateGenerator';

interface NFTCertificateProps {
  certificate: NFTCertificate;
}

export function NFTCertificateCard({ certificate }: NFTCertificateProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [downloading, setDownloading] = useState(false);

  const filename = `propchain-certificate-${certificate.propertyId}`;
  const shortWallet = `${certificate.walletAddress.slice(0, 6)}...${certificate.walletAddress.slice(-4)}`;
  const shortTx = `${certificate.transactionHash.slice(0, 10)}...${certificate.transactionHash.slice(-6)}`;

  async function handleDownload(format: 'png' | 'pdf') {
    if (!ref.current) return;
    setDownloading(true);
    try {
      if (format === 'png') {
        await downloadCertificatePng(ref.current, filename);
      } else {
        await downloadCertificatePdf(ref.current, filename);
      }
    } finally {
      setDownloading(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Certificate visual */}
      <div
        ref={ref}
        className="relative w-full max-w-2xl mx-auto rounded-2xl overflow-hidden border-2 border-amber-400 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white shadow-2xl"
        style={{ fontFamily: 'serif' }}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-500 to-amber-400 px-6 py-3 flex items-center justify-between">
          <span className="font-bold text-slate-900 text-lg tracking-wide">PropChain</span>
          <span className="text-slate-900 text-sm font-semibold">Certificate of Ownership</span>
        </div>

        <div className="flex gap-4 p-6">
          {/* Property image */}
          {certificate.propertyImage && (
            <img
              src={certificate.propertyImage}
              alt={certificate.propertyName}
              className="w-36 h-28 object-cover rounded-lg flex-shrink-0 border border-amber-400/30"
              crossOrigin="anonymous"
            />
          )}

          {/* Details */}
          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-bold text-amber-400 truncate">{certificate.propertyName}</h2>
            <p className="text-slate-300 text-sm mt-1 truncate">{certificate.propertyAddress}</p>

            <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
              <div>
                <span className="text-slate-400">Tokens Owned</span>
                <p className="font-bold text-white">
                  {certificate.tokenAmount.toLocaleString()} {certificate.tokenSymbol}
                </p>
              </div>
              <div>
                <span className="text-slate-400">Ownership</span>
                <p className="font-bold text-white">{certificate.ownershipPercentage.toFixed(4)}%</p>
              </div>
              <div>
                <span className="text-slate-400">Purchase Date</span>
                <p className="font-semibold text-white">
                  {new Date(certificate.purchaseDate).toLocaleDateString()}
                </p>
              </div>
              <div>
                <span className="text-slate-400">Network</span>
                <p className="font-semibold text-white capitalize">{certificate.network}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-slate-700 px-6 py-3 flex justify-between text-xs text-slate-400">
          <span>Wallet: {shortWallet}</span>
          <span>Tx: {shortTx}</span>
        </div>

        {/* Decorative seal */}
        <div className="absolute top-4 right-4 w-14 h-14 rounded-full border-2 border-amber-400/50 flex items-center justify-center opacity-30">
          <span className="text-amber-400 text-xs font-bold text-center leading-tight">NFT<br/>CERT</span>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex flex-wrap gap-2 justify-center">
        <button
          onClick={() => handleDownload('png')}
          disabled={downloading}
          className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-sm font-medium disabled:opacity-50 transition-colors"
        >
          {downloading ? 'Generating…' : 'Download PNG'}
        </button>
        <button
          onClick={() => handleDownload('pdf')}
          disabled={downloading}
          className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-sm font-medium disabled:opacity-50 transition-colors"
        >
          {downloading ? 'Generating…' : 'Download PDF'}
        </button>
        <a
          href={getCertificateShareUrl(certificate)}
          target="_blank"
          rel="noopener noreferrer"
          className="px-4 py-2 bg-sky-500 hover:bg-sky-600 text-white rounded-lg text-sm font-medium transition-colors"
        >
          Share on X
        </a>
      </div>
    </div>
  );
}
