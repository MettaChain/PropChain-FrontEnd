import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { PropertyCard } from '../components/PropertyCard';
import type { Property } from '../types/property';

const mockProperty: Property = {
  id: 'prop-storybook-1',
  name: 'Sunset Villa',
  description: 'Beautiful residential property with great views',
  location: {
    address: '123 Main St',
    city: 'Los Angeles',
    state: 'California',
    country: 'USA',
    zipCode: '90001',
    coordinates: { lat: 34.05, lng: -118.25 },
  },
  price: { total: 500, perToken: 50, currency: 'USD' },
  propertyType: 'residential',
  blockchain: 'ethereum',
  tokenInfo: {
    totalSupply: 1000,
    available: 500,
    sold: 500,
    contractAddress: '0x1234',
    tokenSymbol: 'PROP',
  },
  metrics: { roi: 8.5, annualReturn: 42500, transactionVolume: 1000000, appreciationRate: 5.2 },
  details: { bedrooms: 4, bathrooms: 3, squareFeet: 2500, yearBuilt: 2020, amenities: ['pool'] },
  images: ['https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=800'],
  listedDate: '2024-01-01',
  status: 'active',
  featured: true,
  verified: true,
};

const meta: Meta<typeof PropertyCard> = {
  title: 'A11y/PropertyCard',
  component: PropertyCard,
  parameters: {
    a11y: {
      // Storybook's @storybook/addon-a11y runs axe-core against each story,
      // including `color-contrast` which verifies that the Featured (yellow-700),
      // Verified (emerald-700), and ROI (blue-700) badges meet WCAG AA 4.5:1
      // against their backgrounds.
      config: {
        rules: [
          { id: 'color-contrast', enabled: true },
          { id: 'image-alt', enabled: true },
          { id: 'button-name', enabled: true },
        ],
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof PropertyCard>;

export const GridView: Story = {
  args: { property: mockProperty, viewMode: 'grid' },
};

export const ListView: Story = {
  args: { property: mockProperty, viewMode: 'list' },
};
