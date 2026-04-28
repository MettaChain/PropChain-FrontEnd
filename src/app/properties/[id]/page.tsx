'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, 
  MapPin, 
  Building2, 
  TrendingUp, 
  Copy, 
  Share2, 
  ExternalLink,
  CheckCircle,
  Wallet,
  Home,
  Bath,
  Square
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { WalletConnector } from '@/components/WalletConnector';

// Mock property data - in a real app this would come from an API
const mockProperties = {
  '1': {
    id: '1',
    name: 'Manhattan Tower Suite',
    location: 'New York, NY',
    type: 'Commercial',
    description: 'Luxury commercial space in the heart of Manhattan with premium amenities and excellent connectivity.',
    images: [
      'https://images.unsplash.com/photo-1486325212027-8081e485255e?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&auto=format&fit=crop&q=80'
    ],
    value: 524000,
    tokens: 1048,
    roi: 14.2,
    monthlyIncome: 3280,
    contractAddress: '0x742d35Cc6634C0532925a3b844Bc454e4438f44e',
    blockchain: 'ethereum',
    details: {
      bedrooms: 0,
      bathrooms: 2,
      squareFeet: 2500,
      yearBuilt: 2019,
      parking: 4
    },
    tokenInfo: {
      available: 524,
      totalSupply: 1048,
      perToken: 500
    }
  },
  '2': {
    id: '2',
    name: 'Sunset Beach Villa',
    location: 'Miami, FL',
    type: 'Residential',
    description: 'Beautiful beachfront property with stunning ocean views and modern amenities.',
    images: [
      'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800&auto=format&fit=crop&q=80'
    ],
    value: 389000,
    tokens: 778,
    roi: 11.8,
    monthlyIncome: 2450,
    contractAddress: '0x1234567890123456789012345678901234567890',
    blockchain: 'polygon',
    details: {
      bedrooms: 4,
      bathrooms: 3,
      squareFeet: 3200,
      yearBuilt: 2021,
      parking: 2
    },
    tokenInfo: {
      available: 389,
      totalSupply: 778,
      perToken: 500
    }
  }
};

const blockchainColors = {
  ethereum: '#627EEA',
  polygon: '#8247E5',
  bsc: '#F3BA2F'
};

const blockchainLabels = {
  ethereum: 'Ethereum',
  polygon: 'Polygon',
  bsc: 'BSC'
};

export default function PropertyDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [property, setProperty] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [copiedItem, setCopiedItem] = useState<string | null>(null);

  useEffect(() => {
    // Simulate API call
    const timer = setTimeout(() => {
      const propertyData = mockProperties[params.id as keyof typeof mockProperties];
      if (propertyData) {
        setProperty(propertyData);
      }
      setLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, [params.id]);

  const handleCopy = async (text: string, type: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedItem(type);
      toast.success(`${type} copied to clipboard!`);
      setTimeout(() => setCopiedItem(null), 2000);
    } catch (error) {
      toast.error('Failed to copy to clipboard');
    }
  };

  const handleShare = async () => {
    const shareUrl = `${window.location.origin}/properties/${property.id}`;
    try {
      if (navigator.share) {
        await navigator.share({
          title: property.name,
          text: `Check out this property: ${property.name} in ${property.location}`,
          url: shareUrl
        });
      } else {
        await handleCopy(shareUrl, 'Property URL');
      }
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const handleViewOnExplorer = () => {
    const explorerUrl = property.blockchain === 'ethereum' 
      ? `https://etherscan.io/address/${property.contractAddress}`
      : property.blockchain === 'polygon'
      ? `https://polygonscan.com/address/${property.contractAddress}`
      : `https://bscscan.com/address/${property.contractAddress}`;
    
    window.open(explorerUrl, '_blank');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Loading property details...</p>
        </div>
      </div>
    );
  }

  if (!property) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Property Not Found</h1>
          <Button onClick={() => router.push('/properties')}>
            Back to Properties
          </Button>
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
              <Link href="/properties" className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">
                <ArrowLeft className="w-4 h-4" />
                Back to Properties
              </Link>
              <div className="w-px h-6 bg-gray-300 dark:bg-gray-600" />
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

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="grid grid-cols-1 lg:grid-cols-3 gap-8"
        >
          {/* Left Column - Images and Basic Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Image Gallery */}
            <Card className="overflow-hidden">
              <div className="relative h-96">
                <Image
                  src={property.images[0]}
                  alt={property.name}
                  fill
                  className="object-cover"
                />
                <div className="absolute top-4 left-4">
                  <Badge 
                    className="text-white"
                    style={{ backgroundColor: blockchainColors[property.blockchain as keyof typeof blockchainColors] }}
                  >
                    {blockchainLabels[property.blockchain as keyof typeof blockchainLabels]}
                  </Badge>
                </div>
                <div className="absolute top-4 right-4">
                  <Badge className="bg-green-500 text-white">
                    {property.roi}% ROI
                  </Badge>
                </div>
              </div>
            </Card>

            {/* Property Details */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="w-5 h-5" />
                  Property Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                    {property.name}
                  </h2>
                  <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                    <MapPin className="w-4 h-4" />
                    <span>{property.location}</span>
                  </div>
                </div>

                <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                  {property.description}
                </p>

                {/* Property Details Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <Home className="w-6 h-6 mx-auto mb-2 text-blue-600" />
                    <p className="text-sm text-gray-500 dark:text-gray-400">Bedrooms</p>
                    <p className="font-semibold text-gray-900 dark:text-white">
                      {property.details.bedrooms || 'N/A'}
                    </p>
                  </div>
                  <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <Bath className="w-6 h-6 mx-auto mb-2 text-blue-600" />
                    <p className="text-sm text-gray-500 dark:text-gray-400">Bathrooms</p>
                    <p className="font-semibold text-gray-900 dark:text-white">
                      {property.details.bathrooms}
                    </p>
                  </div>
                  <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <Square className="w-6 h-6 mx-auto mb-2 text-blue-600" />
                    <p className="text-sm text-gray-500 dark:text-gray-400">Square Feet</p>
                    <p className="font-semibold text-gray-900 dark:text-white">
                      {property.details.squareFeet.toLocaleString()}
                    </p>
                  </div>
                  <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <TrendingUp className="w-6 h-6 mx-auto mb-2 text-blue-600" />
                    <p className="text-sm text-gray-500 dark:text-gray-400">Year Built</p>
                    <p className="font-semibold text-gray-900 dark:text-white">
                      {property.details.yearBuilt}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Contract Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Wallet className="w-5 h-5" />
                  Contract Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Smart Contract Address
                  </label>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="flex-1 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg font-mono text-sm">
                      {property.contractAddress}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleCopy(property.contractAddress, 'Contract Address')}
                      className="flex items-center gap-2"
                    >
                      {copiedItem === 'Contract Address' ? (
                        <CheckCircle className="w-4 h-4 text-green-600" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                      {copiedItem === 'Contract Address' ? 'Copied!' : 'Copy'}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleViewOnExplorer}
                      className="flex items-center gap-2"
                    >
                      <ExternalLink className="w-4 h-4" />
                      Explorer
                    </Button>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Referral Link
                  </label>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="flex-1 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg font-mono text-sm">
                      {`${window.location.origin}/properties/${property.id}?ref=wallet123`}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleCopy(`${window.location.origin}/properties/${property.id}?ref=wallet123`, 'Referral Link')}
                      className="flex items-center gap-2"
                    >
                      {copiedItem === 'Referral Link' ? (
                        <CheckCircle className="w-4 h-4 text-green-600" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                      {copiedItem === 'Referral Link' ? 'Copied!' : 'Copy'}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Investment Info */}
          <div className="space-y-6">
            {/* Investment Summary */}
            <Card>
              <CardHeader>
                <CardTitle>Investment Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-400">Total Value</span>
                  <span className="text-2xl font-bold text-gray-900 dark:text-white">
                    ${property.value.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-400">Monthly Income</span>
                  <span className="text-lg font-semibold text-green-600">
                    ${property.monthlyIncome.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-400">Annual ROI</span>
                  <span className="text-lg font-semibold text-blue-600">
                    {property.roi}%
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Token Information */}
            <Card>
              <CardHeader>
                <CardTitle>Token Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Available Tokens</span>
                    <span className="font-semibold">
                      {property.tokenInfo.available.toLocaleString()} / {property.tokenInfo.totalSupply.toLocaleString()}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full"
                      style={{ width: `${(property.tokenInfo.available / property.tokenInfo.totalSupply) * 100}%` }}
                    />
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-400">Price per Token</span>
                  <span className="font-semibold">
                    ${property.tokenInfo.perToken}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="space-y-3">
              <Button className="w-full" size="lg">
                Invest Now
              </Button>
              <Button variant="outline" className="w-full" onClick={handleShare}>
                <Share2 className="w-4 h-4 mr-2" />
                Share Property
              </Button>
            </div>
          </div>
        </motion.div>
      </main>
    </div>
  );
}
