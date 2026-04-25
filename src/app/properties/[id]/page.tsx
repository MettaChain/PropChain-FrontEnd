'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import { PropertyDetail } from '@/components/PropertyDetail';
import { WalletConnector } from '@/components/WalletConnector';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowLeft, Loader2 } from 'lucide-react';

export default function PropertyDetailPage() {
  const params = useParams();
  const propertyId = params?.id as string;

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
            <div className="flex items-center gap-3">
              <Link href="/secondary-market">
                <Button variant="ghost" size="sm" className="text-blue-600 font-semibold">
                  Secondary Market
                </Button>
              </Link>
              <WalletConnector />
            </div>
          </div>
        </div>
      </header>

      {/* Property Detail */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {propertyId ? (
          <PropertyDetail propertyId={propertyId} />
        ) : (
          <div className="flex items-center justify-center min-h-[400px]">
            <Loader2 className="w-8 h-8 animate-spin" />
          </div>
        )}
      </div>
    </div>
  );
}
