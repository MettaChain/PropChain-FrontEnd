'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import QRCode from 'qrcode';
import type { Property } from '@/types/property';
import { WalletConnector } from '@/components/WalletConnector';
import { PriceAlertBell } from '@/components/PriceAlertBell';
import { SetPriceAlertModal } from '@/components/property/SetPriceAlertModal';
import { useNotificationStore } from '@/store/notificationStore';
import { toast } from 'sonner';
import { useI18nFormatting } from '@/utils/i18nFormatting';
import type { PriceAlertType } from '@/types/property';

interface Props {
  property: Property;
}

export function PropertyDetailClient({ property }: Props) {
  const qrRef = useRef<HTMLCanvasElement>(null);
  const [qrGenerated, setQrGenerated] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isAlertModalOpen, setIsAlertModalOpen] = useState(false);
  const { priceAlerts, addPriceAlert } = useNotificationStore();
  const existingAlert = priceAlerts.find((a) => a.propertyId === property.id);
  const { formatCurrency, formatNumber, formatDate } = useI18nFormatting();

  const handleSetAlert = (alertType: PriceAlertType, targetPrice: number, emailNotification: boolean) => {
    addPriceAlert({
      id: `alert-${property.id}-${Date.now()}`,
      propertyId: property.id,
      propertyName: property.name,
      propertyImage: property.images[0],
      alertType,
      targetPrice,
      currentPrice: property.price.perToken,
      createdAt: new Date().toISOString(),
      isActive: true,
      isTriggered: false,
      userId: '',
      emailNotification,
    });
    toast.success('Price alert set successfully');
  };

  const shareUrl =
    typeof window !== 'undefined'
      ? window.location.href
      : `https://propchain.io/properties/${property.id}`;

  useEffect(() => {
    if (qrRef.current) {
      QRCode.toCanvas(qrRef.current, shareUrl, { width: 160, margin: 1 }, () => {
        setQrGenerated(true);
      });
    }
  }, [shareUrl]);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/properties" className="flex items-center gap-3" aria-label="Back to properties">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center" aria-hidden="true">
                <span className="text-white font-bold text-sm">PC</span>
              </div>
              <span className="text-xl font-bold text-gray-900 dark:text-white">PropChain</span>
            </Link>
            <div className="flex items-center gap-2">
              <PriceAlertBell />
              <WalletConnector />
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" className="mb-6">
          <ol className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
            <li><Link href="/" className="hover:text-blue-600">Home</Link></li>
            <li aria-hidden="true">/</li>
            <li><Link href="/properties" className="hover:text-blue-600">Properties</Link></li>
            <li aria-hidden="true">/</li>
            <li className="text-gray-900 dark:text-white font-medium" aria-current="page">{property.name}</li>
          </ol>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left: Images + Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Hero Image */}
            {property.images[0] && (
              <div className="rounded-xl overflow-hidden aspect-video bg-gray-200 dark:bg-gray-700 relative">
                <Image
                  src={property.images[0]}
                  alt={`${property.name} - main photo`}
                  fill
                  priority
                  sizes="(max-width: 1024px) 100vw, 66vw"
                  className="object-cover"
                />
              </div>
            )}

            {/* Property Info */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{property.name}</h1>
                  <p className="text-gray-500 dark:text-gray-400 mt-1">
                    {property.location.address}, {property.location.city}, {property.location.state}
                  </p>
                </div>
                <div className="flex gap-2">
                  {property.verified && (
                    <span className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 text-xs font-medium px-2.5 py-0.5 rounded-full">
                      Verified
                    </span>
                  )}
                  {property.featured && (
                    <span className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 text-xs font-medium px-2.5 py-0.5 rounded-full">
                      Featured
                    </span>
                  )}
                </div>
              </div>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed">{property.description}</p>
            </div>

            {/* Metrics */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Investment Metrics</h2>
              <dl className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[
                  { label: 'Annual ROI', value: `${property.metrics.roi}%` },
                  { label: 'Annual Return', value: formatCurrency(property.metrics.annualReturn) },
                  { label: 'Appreciation', value: `${property.metrics.appreciationRate}%` },
                  { label: 'Volume', value: formatCurrency(property.metrics.transactionVolume) },
                ].map(({ label, value }) => (
                  <div key={label} className="text-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <dt className="text-xs text-gray-500 dark:text-gray-400 mb-1">{label}</dt>
                    <dd className="text-lg font-bold text-blue-600 dark:text-blue-400">{value}</dd>
                  </div>
                ))}
              </dl>
            </div>

            {/* Property Details */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Property Details</h2>
              <dl className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
                {property.details.bedrooms !== undefined && (
                  <div><dt className="text-gray-500 dark:text-gray-400">Bedrooms</dt><dd className="font-medium text-gray-900 dark:text-white">{property.details.bedrooms}</dd></div>
                )}
                {property.details.bathrooms !== undefined && (
                  <div><dt className="text-gray-500 dark:text-gray-400">Bathrooms</dt><dd className="font-medium text-gray-900 dark:text-white">{property.details.bathrooms}</dd></div>
                )}
                <div><dt className="text-gray-500 dark:text-gray-400">Square Feet</dt><dd className="font-medium text-gray-900 dark:text-white">{formatNumber(property.details.squareFeet)} sqft</dd></div>
                <div><dt className="text-gray-500 dark:text-gray-400">Year Built</dt><dd className="font-medium text-gray-900 dark:text-white">{property.details.yearBuilt}</dd></div>
                <div><dt className="text-gray-500 dark:text-gray-400">Listed</dt><dd className="font-medium text-gray-900 dark:text-white">{formatDate(property.listedDate)}</dd></div>
                <div><dt className="text-gray-500 dark:text-gray-400">Type</dt><dd className="font-medium text-gray-900 dark:text-white capitalize">{property.propertyType}</dd></div>
                <div><dt className="text-gray-500 dark:text-gray-400">Blockchain</dt><dd className="font-medium text-gray-900 dark:text-white capitalize">{property.blockchain}</dd></div>
              </dl>
              {property.details.amenities.length > 0 && (
                <div className="mt-4">
                  <dt className="text-sm text-gray-500 dark:text-gray-400 mb-2">Amenities</dt>
                  <dd className="flex flex-wrap gap-2">
                    {property.details.amenities.map((a) => (
                      <span key={a} className="bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs px-2 py-1 rounded">{a}</span>
                    ))}
                  </dd>
                </div>
              )}
            </div>
          </div>

          {/* Right: Purchase + Share */}
          <div className="space-y-6">
            {/* Pricing Card */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm sticky top-24">
              <div className="mb-4">
                <p className="text-3xl font-bold text-gray-900 dark:text-white">{formatCurrency(property.price.total)}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">{formatCurrency(property.price.perToken)} per token</p>
              </div>

              {/* Token availability */}
              <div className="mb-4">
                <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-1">
                  <span>Tokens Available</span>
                  <span>{formatNumber(property.tokenInfo.available)} / {formatNumber(property.tokenInfo.totalSupply)}</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2" role="progressbar" aria-valuenow={property.tokenInfo.sold} aria-valuemin={0} aria-valuemax={property.tokenInfo.totalSupply} aria-label="Tokens sold">
                  <div
                    className="bg-blue-600 h-2 rounded-full"
                    style={{ width: `${(property.tokenInfo.sold / property.tokenInfo.totalSupply) * 100}%` }}
                  />
                </div>
              </div>

              <button
                type="button"
                className="w-full bg-blue-600 hover:bg-blue-700 focus:ring-4 focus:ring-blue-300 text-white font-semibold py-3 px-4 rounded-lg transition-colors focus:outline-none"
                aria-label={`Purchase tokens for ${property.name}`}
              >
                Purchase Tokens
              </button>

              <button
                type="button"
                onClick={() => setIsAlertModalOpen(true)}
                className="w-full border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 font-medium py-2.5 px-4 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 flex items-center justify-center gap-2"
                aria-label={existingAlert ? 'Manage price alert' : 'Set price alert'}
              >
                {existingAlert ? (
                  <>
                    <span>🔔</span> Manage Alert
                  </>
                ) : (
                  <>
                    <span>🔔</span> Set Price Alert
                  </>
                )}
              </button>

              <p className="text-xs text-gray-500 dark:text-gray-400 text-center mt-3">
                Token: {property.tokenInfo.tokenSymbol} · {property.blockchain}
              </p>
            </div>

            {/* Share / QR Code */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Share This Property</h2>

              {/* QR Code */}
              <div className="flex flex-col items-center mb-4">
                <canvas
                  ref={qrRef}
                  aria-label={`QR code linking to ${property.name} property page`}
                  role="img"
                  className={qrGenerated ? '' : 'opacity-0'}
                />
                {!qrGenerated && (
                  <div className="w-40 h-40 bg-gray-100 dark:bg-gray-700 rounded animate-pulse" aria-hidden="true" />
                )}
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 text-center">Scan to open on mobile</p>
              </div>

              {/* Copy link */}
              <div className="flex gap-2">
                <input
                  type="text"
                  readOnly
                  value={shareUrl}
                  aria-label="Shareable property URL"
                  className="flex-1 text-xs bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 text-gray-600 dark:text-gray-300 truncate focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  type="button"
                  onClick={handleCopy}
                  aria-label="Copy property URL to clipboard"
                  className="bg-blue-600 hover:bg-blue-700 focus:ring-4 focus:ring-blue-300 text-white text-xs font-medium px-3 py-2 rounded-lg transition-colors focus:outline-none whitespace-nowrap"
                >
                  {copied ? 'Copied!' : 'Copy'}
                </button>
              </div>

              {/* Social share links */}
              <div className="flex gap-3 mt-4 justify-center">
                <a
                  href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(`Check out ${property.name} on PropChain`)}&url=${encodeURIComponent(shareUrl)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Share on Twitter"
                  className="text-sm text-blue-500 hover:text-blue-700 underline focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
                >
                  Twitter
                </a>
                <a
                  href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Share on LinkedIn"
                  className="text-sm text-blue-500 hover:text-blue-700 underline focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
                >
                  LinkedIn
                </a>
              </div>
            </div>
          </div>
        </div>
      </main>

      <SetPriceAlertModal
        property={property}
        isOpen={isAlertModalOpen}
        onOpenChange={setIsAlertModalOpen}
        onSetAlert={handleSetAlert}
        existingAlert={existingAlert ? {
          alertType: existingAlert.alertType,
          targetPrice: existingAlert.targetPrice,
          isActive: existingAlert.isActive,
        } : undefined}
      />
    </div>
  );
}
