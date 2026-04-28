import React from 'react';
import { notFound } from 'next/navigation';
import { PropertyDetailServer } from '@/components/PropertyDetailServer';
import { PropertyDetailClient } from '@/components/PropertyDetailClient';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { getPropertyForISR } from '@/lib/propertyServiceServer';
import type { Property } from '@/types/property';

// ISR configuration - revalidate every 60 seconds
export const revalidate = 60;

interface PropertyDetailPageProps {
  params: {
    id: string;
  };
  searchParams: {
    [key: string]: string | string[] | undefined;
  };
}

async function PropertyDetailContent({ propertyId }: { propertyId: string }) {
  // Fetch property data on server side
  const property = await getPropertyForISR(propertyId);

  if (!property) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
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
            {/* Client-side components for interactive elements */}
            <PropertyDetailClient propertyId={propertyId} />
          </div>
        </div>
      </header>

      {/* Property Detail Content - Server Component */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <PropertyDetailServer property={property} />
      </div>
    </div>
  );
}

export default async function PropertyDetailPage({ params }: PropertyDetailPageProps) {
  const { id } = params;
  
  return (
    <React.Suspense fallback={<PropertyDetailSkeleton />}>
      <PropertyDetailContent propertyId={id} />
    </React.Suspense>
  );
}

// Fallback loading component
function PropertyDetailSkeleton() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-4">
              <div className="w-20 h-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse" />
                <div className="w-24 h-6 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
              </div>
            </div>
            <div className="flex gap-2">
              <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse" />
              <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse" />
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="aspect-[16/9] bg-gray-200 dark:bg-gray-700 rounded-2xl animate-pulse" />

          <div className="space-y-6 pt-2">
            <div className="h-9 w-4/5 bg-gray-200 dark:bg-gray-700 rounded mb-4 animate-pulse" />
            <div className="h-7 w-1/2 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />

            <div className="flex gap-3">
              <div className="h-12 flex-1 bg-gray-200 dark:bg-gray-700 rounded-xl animate-pulse" />
              <div className="h-12 flex-1 bg-gray-200 dark:bg-gray-700 rounded-xl animate-pulse" />
            </div>

            <div className="space-y-3">
              <div className="h-5 w-full bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
              <div className="h-5 w-11/12 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
              <div className="h-5 w-4/5 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Generate static params for known properties
export async function generateStaticParams() {
  // In a real implementation, you would fetch this from your API/database
  // For now, we'll return an empty array to generate pages on-demand
  return [];
}