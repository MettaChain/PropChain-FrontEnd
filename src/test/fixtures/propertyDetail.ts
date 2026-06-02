import type { Property } from '@/types/property';

export const mockPropertyDetail: Property = {
  id: 'prop-detail-1',
  name: 'Luxury Downtown Apartment',
  description: 'A beautiful modern apartment in the heart of downtown with premium amenities.',
  location: {
    address: '123 Main Street',
    city: 'New York',
    state: 'NY',
    country: 'USA',
    zipCode: '10001',
    coordinates: { lat: 40.7128, lng: -74.006 },
  },
  price: {
    total: 1000000,
    perToken: 1000,
    currency: 'USD',
  },
  propertyType: 'residential',
  blockchain: 'ethereum',
  tokenInfo: {
    totalSupply: 1000,
    available: 500,
    sold: 500,
    contractAddress: '0x742d35Cc6634C0532925a3b844Bc454e4438f44e',
    tokenSymbol: 'LDA',
  },
  metrics: {
    roi: 12.5,
    annualReturn: 125000,
    transactionVolume: 2500000,
    appreciationRate: 8.2,
  },
  details: {
    bedrooms: 2,
    bathrooms: 2,
    squareFeet: 1200,
    yearBuilt: 2020,
    amenities: ['pool', 'gym', 'parking'],
  },
  images: ['/images/property1.jpg', '/images/property2.jpg'],
  listedDate: '2024-06-15T00:00:00.000Z',
  status: 'active',
  featured: true,
  verified: true,
};
