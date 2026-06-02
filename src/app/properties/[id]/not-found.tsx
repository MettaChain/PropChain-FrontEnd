import React from 'react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowLeft, Home, Search } from 'lucide-react';

export default function PropertyNotFound() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
      <div className="text-center max-w-md">
        {/* 404 Icon */}
        <div className="w-24 h-24 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-6">
          <span className="text-4xl font-bold text-gray-500 dark:text-gray-400">404</span>
        </div>

        {/* Error Message */}
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
          Property Not Found
        </h1>
        
        <p className="text-gray-600 dark:text-gray-400 mb-8">
          The property you're looking for doesn't exist or may have been removed. 
          This could be a new property that hasn't been indexed yet.
        </p>

        {/* Action Buttons */}
        <div className="space-y-4">
          <Link href="/properties">
            <Button className="w-full">
              <Search className="w-4 h-4 mr-2" />
              Browse All Properties
            </Button>
          </Link>
          
          <Link href="/">
            <Button variant="outline" className="w-full">
              <Home className="w-4 h-4 mr-2" />
              Back to Home
            </Button>
          </Link>
        </div>

        {/* Additional Information */}
        <div className="mt-8 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
          <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-2">
            New Property?
          </h3>
          <p className="text-xs text-blue-700 dark:text-blue-300">
            If this property was recently added, it may take a few moments to become available. 
            Try refreshing the page in a minute or two.
          </p>
        </div>
      </div>
    </div>
  );
}
