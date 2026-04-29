import type { Metadata } from 'next';
import { generatePropertyMetadata, generatePropertyStructuredData, generateBreadcrumbStructuredData } from '@/utils/seo';
import PropertyDetailClient from './PropertyDetailClient';

// Mock property data - in a real app this would come from an API
const mockProperties = {
  '1': {
    id: '1',
    name: 'Manhattan Tower Suite',
    location: {
      address: '123 Wall Street',
      city: 'New York',
      state: 'NY',
      country: 'USA',
      zipCode: '10005',
      coordinates: { lat: 40.7074, lng: -74.0113 }
    },
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
    },
    listedDate: '2023-01-15T00:00:00Z',
    updatedAt: '2023-12-01T00:00:00Z',
    price: {
      total: 524000,
      perToken: 500,
      currency: 'USD'
    },
    propertyType: 'commercial',
    metrics: {
      roi: 14.2,
      annualReturn: 62400,
      transactionVolume: 1500000,
      appreciationRate: 8.5
    },
    featured: true,
    verified: true
  },
  '2': {
    id: '2',
    name: 'Sunset Beach Villa',
    location: {
      address: '456 Ocean Drive',
      city: 'Miami',
      state: 'FL',
      country: 'USA',
      zipCode: '33139',
      coordinates: { lat: 25.7617, lng: -80.1918 }
    },
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
    },
    listedDate: '2023-03-20T00:00:00Z',
    updatedAt: '2023-11-15T00:00:00Z',
    price: {
      total: 389000,
      perToken: 500,
      currency: 'USD'
    },
    propertyType: 'residential',
    metrics: {
      roi: 11.8,
      annualReturn: 45960,
      transactionVolume: 800000,
      appreciationRate: 6.2
    },
    featured: false,
    verified: true
  }
};

interface PropertyPageProps {
  params: { id: string };
  searchParams: { [key: string]: string | string[] | undefined };
}

// Generate dynamic metadata for the property
export async function generateMetadata({ params }: PropertyPageProps): Promise<Metadata> {
  const property = mockProperties[params.id as keyof typeof mockProperties];
  
  if (!property) {
    return {
      title: 'Property Not Found | PropChain',
      description: 'The requested property could not be found.',
    };
  }

  return generatePropertyMetadata(property, `/properties/${params.id}`);
}

// Generate JSON-LD structured data
function generateStructuredData(property: any, url: string) {
  const propertyStructuredData = generatePropertyStructuredData(property, url);
  const breadcrumbStructuredData = generateBreadcrumbStructuredData([
    { name: 'Home', url: '/' },
    { name: 'Properties', url: '/properties' },
    { name: property.name, url: `/properties/${property.id}` }
  ]);

  return {
    __html: `${propertyStructuredData}\n${breadcrumbStructuredData}`
  };
}

export default function PropertyPage({ params }: PropertyPageProps) {
  const property = mockProperties[params.id as keyof typeof mockProperties];
  const url = `/properties/${params.id}`;

  if (!property) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Property Not Found</h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">The property you're looking for doesn't exist or has been removed.</p>
          <a 
            href="/properties" 
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Back to Properties
          </a>
        </div>
      </div>
    );
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={generateStructuredData(property, url)}
      />
      <PropertyDetailClient property={property} />
    </>
  );
}
