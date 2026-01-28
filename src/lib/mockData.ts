import type { Property, BlockchainNetwork } from '@/types/property';

/**
 * Mock Property Data
 * Sample tokenized real estate properties for development and testing
 */

export const MOCK_PROPERTIES: Property[] = [
  {
    id: '1',
    name: 'Luxury Downtown Penthouse',
    description: 'Stunning penthouse in the heart of Manhattan with panoramic city views. Premium finishes, smart home technology, and exclusive amenities.',
    location: {
      address: '432 Park Avenue',
      city: 'New York',
      state: 'NY',
      country: 'USA',
      zipCode: '10022',
      coordinates: { lat: 40.7614, lng: -73.9776 },
    },
    price: {
      total: 5000000,
      perToken: 100,
      currency: 'USD',
    },
    propertyType: 'residential',
    blockchain: 'ethereum',
    tokenInfo: {
      totalSupply: 50000,
      available: 25000,
      sold: 25000,
      contractAddress: '0x1234567890abcdef1234567890abcdef12345678',
      tokenSymbol: 'PENT432',
    },
    metrics: {
      roi: 8.5,
      annualReturn: 425000,
      transactionVolume: 2500000,
      appreciationRate: 5.2,
    },
    details: {
      bedrooms: 3,
      bathrooms: 3,
      squareFeet: 3200,
      yearBuilt: 2020,
      parking: 2,
      amenities: ['Gym', 'Pool', 'Concierge', 'Rooftop Terrace'],
    },
    images: [
      'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800',
      'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800',
    ],
    listedDate: '2024-01-15T00:00:00Z',
    status: 'active',
    featured: true,
    verified: true,
  },
  {
    id: '2',
    name: 'Modern Office Complex',
    description: 'Class A office building in Silicon Valley tech hub. High-speed internet, modern infrastructure, and sustainable design.',
    location: {
      address: '1 Market Street',
      city: 'San Francisco',
      state: 'CA',
      country: 'USA',
      zipCode: '94105',
      coordinates: { lat: 37.7749, lng: -122.4194 },
    },
    price: {
      total: 12000000,
      perToken: 200,
      currency: 'USD',
    },
    propertyType: 'commercial',
    blockchain: 'polygon',
    tokenInfo: {
      totalSupply: 60000,
      available: 40000,
      sold: 20000,
      contractAddress: '0xabcdef1234567890abcdef1234567890abcdef12',
      tokenSymbol: 'OFFC1M',
    },
    metrics: {
      roi: 12.3,
      annualReturn: 1476000,
      transactionVolume: 4000000,
      appreciationRate: 7.8,
    },
    details: {
      squareFeet: 45000,
      yearBuilt: 2019,
      parking: 100,
      amenities: ['Conference Rooms', 'Cafeteria', 'Fitness Center', 'EV Charging'],
    },
    images: [
      'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800',
      'https://images.unsplash.com/photo-1497366216548-37526070297c?w=800',
    ],
    listedDate: '2024-02-01T00:00:00Z',
    status: 'active',
    featured: true,
    verified: true,
  },
  {
    id: '3',
    name: 'Beachfront Villa Resort',
    description: 'Exclusive beachfront property in Bali with private beach access. Perfect for vacation rentals and hospitality investment.',
    location: {
      address: 'Jalan Pantai Seminyak',
      city: 'Seminyak',
      state: 'Bali',
      country: 'Indonesia',
      zipCode: '80361',
      coordinates: { lat: -8.6905, lng: 115.1683 },
    },
    price: {
      total: 2500000,
      perToken: 50,
      currency: 'USD',
    },
    propertyType: 'residential',
    blockchain: 'bsc',
    tokenInfo: {
      totalSupply: 50000,
      available: 35000,
      sold: 15000,
      contractAddress: '0x9876543210fedcba9876543210fedcba98765432',
      tokenSymbol: 'VILL-BALI',
    },
    metrics: {
      roi: 15.7,
      annualReturn: 392500,
      transactionVolume: 750000,
      appreciationRate: 9.3,
    },
    details: {
      bedrooms: 5,
      bathrooms: 4,
      squareFeet: 4500,
      lotSize: 8000,
      yearBuilt: 2021,
      parking: 4,
      amenities: ['Private Pool', 'Beach Access', 'Garden', 'Ocean View'],
    },
    images: [
      'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=800',
      'https://images.unsplash.com/photo-1582268611958-ebfd161ef9cf?w=800',
    ],
    listedDate: '2024-01-20T00:00:00Z',
    status: 'active',
    verified: true,
  },
  {
    id: '4',
    name: 'Industrial Warehouse Hub',
    description: 'Strategic logistics center near major highways. Ideal for e-commerce fulfillment and distribution operations.',
    location: {
      address: '500 Industrial Parkway',
      city: 'Dallas',
      state: 'TX',
      country: 'USA',
      zipCode: '75201',
      coordinates: { lat: 32.7767, lng: -96.7970 },
    },
    price: {
      total: 8000000,
      perToken: 160,
      currency: 'USD',
    },
    propertyType: 'industrial',
    blockchain: 'ethereum',
    tokenInfo: {
      totalSupply: 50000,
      available: 30000,
      sold: 20000,
      contractAddress: '0x5555666677778888999900001111222233334444',
      tokenSymbol: 'WARE-DLS',
    },
    metrics: {
      roi: 10.5,
      annualReturn: 840000,
      transactionVolume: 3200000,
      appreciationRate: 6.1,
    },
    details: {
      squareFeet: 85000,
      yearBuilt: 2018,
      parking: 50,
      amenities: ['Loading Docks', 'High Ceilings', 'Climate Control', 'Security System'],
    },
    images: [
      'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=800',
      'https://images.unsplash.com/photo-1553413077-190dd305871c?w=800',
    ],
    listedDate: '2024-01-10T00:00:00Z',
    status: 'active',
    verified: true,
  },
  {
    id: '5',
    name: 'Mixed-Use Development',
    description: 'Vibrant mixed-use property combining retail, office, and residential spaces in downtown Seattle.',
    location: {
      address: '1201 3rd Avenue',
      city: 'Seattle',
      state: 'WA',
      country: 'USA',
      zipCode: '98101',
      coordinates: { lat: 47.6062, lng: -122.3321 },
    },
    price: {
      total: 15000000,
      perToken: 250,
      currency: 'USD',
    },
    propertyType: 'mixed-use',
    blockchain: 'polygon',
    tokenInfo: {
      totalSupply: 60000,
      available: 45000,
      sold: 15000,
      contractAddress: '0xaaaa1111bbbb2222cccc3333dddd4444eeee5555',
      tokenSymbol: 'MIX-SEA',
    },
    metrics: {
      roi: 11.8,
      annualReturn: 1770000,
      transactionVolume: 3750000,
      appreciationRate: 8.2,
    },
    details: {
      squareFeet: 120000,
      yearBuilt: 2022,
      parking: 200,
      amenities: ['Retail Spaces', 'Office Floors', 'Residential Units', 'Public Plaza'],
    },
    images: [
      'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800',
      'https://images.unsplash.com/photo-1577495508326-19a1b3cf65b7?w=800',
    ],
    listedDate: '2024-02-05T00:00:00Z',
    status: 'active',
    featured: true,
    verified: true,
  },
  {
    id: '6',
    name: 'Historic Brownstone',
    description: 'Beautifully restored brownstone in Brooklyn with original architectural details and modern updates.',
    location: {
      address: '234 Prospect Park West',
      city: 'Brooklyn',
      state: 'NY',
      country: 'USA',
      zipCode: '11215',
      coordinates: { lat: 40.6782, lng: -73.9442 },
    },
    price: {
      total: 3200000,
      perToken: 80,
      currency: 'USD',
    },
    propertyType: 'residential',
    blockchain: 'ethereum',
    tokenInfo: {
      totalSupply: 40000,
      available: 20000,
      sold: 20000,
      contractAddress: '0x1111aaaa2222bbbb3333cccc4444dddd5555eeee',
      tokenSymbol: 'BRWN-BK',
    },
    metrics: {
      roi: 7.2,
      annualReturn: 230400,
      transactionVolume: 1600000,
      appreciationRate: 4.5,
    },
    details: {
      bedrooms: 4,
      bathrooms: 3,
      squareFeet: 2800,
      yearBuilt: 1890,
      parking: 1,
      amenities: ['Garden', 'Fireplace', 'Original Moldings', 'Updated Kitchen'],
    },
    images: [
      'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=800',
      'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800',
    ],
    listedDate: '2024-01-25T00:00:00Z',
    status: 'active',
    verified: true,
  },
  {
    id: '7',
    name: 'Tech Campus',
    description: 'Modern tech campus in Austin with collaborative workspaces and innovation labs.',
    location: {
      address: '500 W 2nd Street',
      city: 'Austin',
      state: 'TX',
      country: 'USA',
      zipCode: '78701',
      coordinates: { lat: 30.2672, lng: -97.7431 },
    },
    price: {
      total: 18000000,
      perToken: 300,
      currency: 'USD',
    },
    propertyType: 'commercial',
    blockchain: 'polygon',
    tokenInfo: {
      totalSupply: 60000,
      available: 50000,
      sold: 10000,
      contractAddress: '0x6666777788889999aaaabbbbccccddddeeee0000',
      tokenSymbol: 'TECH-ATX',
    },
    metrics: {
      roi: 13.5,
      annualReturn: 2430000,
      transactionVolume: 3000000,
      appreciationRate: 10.1,
    },
    details: {
      squareFeet: 95000,
      yearBuilt: 2023,
      parking: 250,
      amenities: ['Innovation Labs', 'Cafeteria', 'Gym', 'Outdoor Spaces'],
    },
    images: [
      'https://images.unsplash.com/photo-1497366811353-6870744d04b2?w=800',
      'https://images.unsplash.com/photo-1497366754035-f200968a6e72?w=800',
    ],
    listedDate: '2024-02-10T00:00:00Z',
    status: 'active',
    featured: true,
    verified: true,
  },
  {
    id: '8',
    name: 'Mountain Chalet',
    description: 'Luxury ski chalet in Aspen with ski-in/ski-out access and breathtaking mountain views.',
    location: {
      address: '100 Aspen Mountain Road',
      city: 'Aspen',
      state: 'CO',
      country: 'USA',
      zipCode: '81611',
      coordinates: { lat: 39.1911, lng: -106.8175 },
    },
    price: {
      total: 6500000,
      perToken: 130,
      currency: 'USD',
    },
    propertyType: 'residential',
    blockchain: 'bsc',
    tokenInfo: {
      totalSupply: 50000,
      available: 38000,
      sold: 12000,
      contractAddress: '0x7777888899990000aaaa1111bbbb2222cccc3333',
      tokenSymbol: 'CHAL-ASP',
    },
    metrics: {
      roi: 9.8,
      annualReturn: 637000,
      transactionVolume: 1560000,
      appreciationRate: 6.7,
    },
    details: {
      bedrooms: 6,
      bathrooms: 5,
      squareFeet: 5500,
      yearBuilt: 2020,
      parking: 3,
      amenities: ['Ski Access', 'Hot Tub', 'Wine Cellar', 'Home Theater'],
    },
    images: [
      'https://images.unsplash.com/photo-1542718610-a1d656d1884c?w=800',
      'https://images.unsplash.com/photo-1518780664697-55e3ad937233?w=800',
    ],
    listedDate: '2024-01-18T00:00:00Z',
    status: 'active',
    verified: true,
  },
];

// Helper function to get properties by blockchain
export function getPropertiesByBlockchain(blockchain: BlockchainNetwork): Property[] {
  return MOCK_PROPERTIES.filter(p => p.blockchain === blockchain);
}

// Helper function to get featured properties
export function getFeaturedProperties(): Property[] {
  return MOCK_PROPERTIES.filter(p => p.featured);
}

// Helper function to get unique locations
export function getUniqueLocations(): string[] {
  const locations = MOCK_PROPERTIES.map(p => `${p.location.city}, ${p.location.state}`);
  return [...new Set(locations)].sort();
}

// Helper function to get unique cities
export function getUniqueCities(): string[] {
  const cities = MOCK_PROPERTIES.map(p => p.location.city);
  return [...new Set(cities)].sort();
}
