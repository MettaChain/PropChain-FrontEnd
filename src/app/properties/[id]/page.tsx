import { Suspense } from 'react';
import type { Metadata } from 'next';
import { PropertyDetailPageClient } from './PropertyDetailPageClient';
import { propertyService } from '@/lib/propertyService';

interface PropertyDetailPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({
  params,
}: PropertyDetailPageProps): Promise<Metadata> {
  const { id } = await params;

  try {
    const property = await propertyService.getPropertyById(id);
    if (!property) {
      return {
        title: 'Property Not Found - PropChain',
        description: 'The requested property could not be found.',
      };
    }
    return {
      title: `${property.name} - PropChain`,
      description: property.description,
      openGraph: {
        title: `${property.name} - PropChain`,
        description: `${property.name} in ${property.location.city}, ${property.location.state} — ${property.propertyType} investment from $${property.price.perToken.toLocaleString()} per token.`,
      },
    };
  } catch {
    return {
      title: 'Property Not Found - PropChain',
      description: 'The requested property could not be found.',
    };
  }
}
import React from 'react';
import { PropertyDetail } from '@/components/PropertyDetail';
import { WalletConnector } from '@/components/WalletConnector';
import { PriceAlertBell } from '@/components/PriceAlertBell';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowLeft, Loader2 } from 'lucide-react';

export default async function PropertyDetailPage({
  params,
}: PropertyDetailPageProps) {
  const { id } = await params;

  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
          <div className="text-center">
            <div className="inline-block w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4" />
            <p className="text-gray-600 dark:text-gray-400">Loading property...</p>
          </div>
        </div>
      }
    >
      <PropertyDetailPageClient propertyId={id} />
    </Suspense>
  );
}
