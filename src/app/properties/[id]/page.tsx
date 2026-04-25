'use client';

import React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { PropertyDetail } from '@/components/PropertyDetail';
import { WalletConnector } from '@/components/WalletConnector';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowLeft, Loader2 } from 'lucide-react';

function PropertyDetailContent() {
  const params = useParams();
  const router = useRouter();
  const propertyId = params.id as string;

  if (!propertyId) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Property not found
          </h2>
          <Link href="/properties">
            <Button>Back to Properties</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-4">
              <Link href="/properties">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Properties
                </Button>
              </Link>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">PC</span>
                </div>
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                  PropChain
                </h1>
              </div>
            </div>
            <WalletConnector />
          </div>
        </div>
      </header>

      {/* Property Detail */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <PropertyDetail propertyId={propertyId} />
      </div>
    </div>
  );
}

export default function PropertyDetailPage() {
  return (
    <React.Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400">Loading property details...</p>
          </div>
        </div>
      }
    >
      <PropertyDetailContent />
    </React.Suspense>
  );
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { MOCK_PROPERTIES } from '@/lib/mockData';
import { PropertyDetailClient } from './PropertyDetailClient';

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const property = MOCK_PROPERTIES.find((p) => p.id === id);

  if (!property) {
    return { title: 'Property Not Found | PropChain' };
  }

  const title = `${property.name} | PropChain`;
  const description = `${property.description.slice(0, 155)}...`;
  const image = property.images[0] ?? 'https://propchain.io/og-default.png';
  const url = `https://propchain.io/properties/${id}`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url,
      siteName: 'PropChain',
      images: [{ url: image, width: 1200, height: 630, alt: property.name }],
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [image],
      site: '@PropChain',
    },
    alternates: { canonical: url },
  };
}

export async function generateStaticParams() {
  return MOCK_PROPERTIES.map((p) => ({ id: p.id }));
}

export default async function PropertyDetailPage({ params }: Props) {
  const { id } = await params;
  const property = MOCK_PROPERTIES.find((p) => p.id === id);

  if (!property) notFound();

  return <PropertyDetailClient property={property} />;
}
