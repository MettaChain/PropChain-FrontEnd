'use client';

import React, { useState, useEffect } from 'react';
import { secondaryMarketService } from '@/lib/secondaryMarketService';
import { SecondaryMarketListing } from '@/types/property';
import { WalletConnector } from '@/components/WalletConnector';
import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import Link from 'next/link';
import { toast } from 'sonner';

export default function SecondaryMarketPage() {
  const [listings, setListings] = useState<SecondaryMarketListing[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadListings();
  }, []);

  const loadListings = async () => {
    setIsLoading(true);
    try {
      const data = await secondaryMarketService.getListings();
      setListings(data);
    } catch (error) {
      toast.error('Failed to load secondary market listings');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBuy = async (listingId: string) => {
    toast.info('Initiating purchase...');
    try {
      await secondaryMarketService.buyTokens(listingId, 1);
      toast.success('Successfully purchased tokens!');
      loadListings();
    } catch (error) {
      toast.error('Purchase failed');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex items-center gap-3">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">PC</span>
              </div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">PropChain</h1>
            </Link>
            <div className="flex items-center gap-3">
              <WalletConnector />
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Secondary Market</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">Trade property tokens directly with other holders</p>
          </div>
          <Button onClick={() => toast.info('Listing tokens feature coming soon')}>
            List Tokens for Sale
          </Button>
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <LoadingSpinner size="lg" />
            <p className="mt-4 text-gray-600 dark:text-gray-400">Loading market listings...</p>
          </div>
        ) : listings.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-xl p-12 text-center shadow-sm">
            <p className="text-gray-600 dark:text-gray-400">No active listings in the secondary market yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {listings.map((listing) => (
              <div key={listing.id} className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden border border-gray-200 dark:border-gray-700 transition-transform hover:scale-[1.02]">
                <div className="relative h-48">
                  <img 
                    src={listing.propertyImage} 
                    alt={listing.propertyName}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-4 right-4 bg-white/90 dark:bg-gray-800/90 backdrop-blur px-3 py-1 rounded-full text-sm font-semibold text-blue-600 dark:text-blue-400 shadow-sm">
                    {listing.blockchain.toUpperCase()}
                  </div>
                </div>
                <div className="p-6">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">{listing.propertyName}</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-4 flex items-center gap-1">
                    Seller: <span className="font-mono text-xs">{listing.sellerAddress}</span>
                  </p>
                  
                  <div className="flex justify-between items-end mb-6">
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">Available</p>
                      <p className="text-xl font-bold text-gray-900 dark:text-white">{listing.tokenCount} Tokens</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">Price</p>
                      <p className="text-xl font-bold text-blue-600 dark:text-blue-400">${listing.pricePerToken} <span className="text-sm font-normal text-gray-500">{listing.currency}</span></p>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      className="flex-1"
                      asChild
                    >
                      <Link href={`/properties/${listing.propertyId}`}>View Details</Link>
                    </Button>
                    <Button 
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                      onClick={() => handleBuy(listing.id)}
                    >
                      Buy Now
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
