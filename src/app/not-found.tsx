'use client';

import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Home, Search, Map, HelpCircle } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
      <div className="max-w-2xl w-full text-center">
        {/* Animated 404 Graphic */}
        <div className="relative mb-12">
          <h1 className="text-[150px] font-black text-blue-100 dark:text-gray-800 leading-none">
            404
          </h1>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-32 h-32 bg-blue-600 rounded-2xl rotate-12 flex items-center justify-center shadow-2xl animate-bounce">
              <HelpCircle className="w-16 h-16 text-white -rotate-12" />
            </div>
          </div>
        </div>

        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
          Oops! This property seems to be off-market.
        </h2>
        <p className="text-lg text-gray-600 dark:text-gray-400 mb-10 max-w-lg mx-auto">
          The page you're looking for doesn't exist or has been moved to a different block. 
          Let's get you back on track to finding your next investment.
        </p>

        {/* Suggestions */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-12">
          <Link href="/" className="group">
            <div className="p-6 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 hover:border-blue-500 transition-all hover:shadow-md h-full flex flex-col items-center">
              <Home className="w-8 h-8 text-blue-600 mb-3 group-hover:scale-110 transition-transform" />
              <span className="font-semibold text-gray-900 dark:text-white">Home</span>
            </div>
          </Link>
          <Link href="/properties" className="group">
            <div className="p-6 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 hover:border-blue-500 transition-all hover:shadow-md h-full flex flex-col items-center">
              <Search className="w-8 h-8 text-blue-600 mb-3 group-hover:scale-110 transition-transform" />
              <span className="font-semibold text-gray-900 dark:text-white">Search Properties</span>
            </div>
          </Link>
          <Link href="/secondary-market" className="group">
            <div className="p-6 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 hover:border-blue-500 transition-all hover:shadow-md h-full flex flex-col items-center">
              <Map className="w-8 h-8 text-blue-600 mb-3 group-hover:scale-110 transition-transform" />
              <span className="font-semibold text-gray-900 dark:text-white">Secondary Market</span>
            </div>
          </Link>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Button asChild size="lg" className="px-8 bg-blue-600 hover:bg-blue-700">
            <Link href="/properties">Browse Listings</Link>
          </Button>
          <Button asChild variant="outline" size="lg" className="px-8">
            <Link href="/developers">API Documentation</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
