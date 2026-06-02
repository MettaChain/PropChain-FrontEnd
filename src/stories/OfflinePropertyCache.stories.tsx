import type { Meta, StoryObj } from '@storybook/react';
import React from 'react';
import { OfflinePropertyCache } from '@/components/mobile/OfflinePropertyCache';
import type { MobileProperty } from '@/types/mobileProperty';

/**
 * OfflinePropertyCache — Manages downloading, viewing, and removing cached
 * property listings for offline access on mobile.
 *
 * ## Usage
 * ```tsx
 * import { OfflinePropertyCache } from '@/components/mobile/OfflinePropertyCache';
 *
 * <OfflinePropertyCache
 *   properties={myProperties}
 *   onPropertySelect={(p) => router.push(`/properties/${p.id}`)}
 * />
 * ```
 *
 * ## Props
 * | Prop               | Type                               | Required | Description                               |
 * |--------------------|------------------------------------|----------|-------------------------------------------|
 * | `properties`       | `MobileProperty[]`                 | Yes      | Properties available for offline caching. |
 * | `onPropertySelect` | `(property: MobileProperty) => void` | No     | Called when the user taps a cached item.  |
 *
 * ## Accessibility
 * - Online/offline status is conveyed via labelled icons and text, not colour alone.
 * - Buttons have visible labels or descriptive `aria-label` attributes.
 * - Offline notice banner uses `role="alert"` (via framer-motion wrapper) to
 *   announce its appearance to screen readers.
 */
const meta = {
  title: 'Components/Mobile/OfflinePropertyCache',
  component: OfflinePropertyCache,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Offline-first property cache manager. Allows users to download listings and browse them without an internet connection.',
      },
    },
    chromatic: { viewports: [375, 768, 1280] },
  },
  tags: ['autodocs'],
} satisfies Meta<typeof OfflinePropertyCache>;

export default meta;
type Story = StoryObj<typeof meta>;

const sampleProperties: MobileProperty[] = [
  {
    id: 'prop-1',
    name: 'Oceanview Residences',
    location: 'Miami, FL',
    type: 'Residential',
    value: 750000,
    tokens: 1500,
    roi: 12.5,
    monthlyIncome: 4000,
    images: [
      'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=800',
      'https://images.unsplash.com/photo-1494526585095-c41746248156?w=800',
    ],
    description: 'Stunning oceanfront property.',
    bedrooms: 3,
    bathrooms: 2,
    sqft: 2000,
    amenities: ['Pool', 'Gym', 'Concierge'],
  },
  {
    id: 'prop-2',
    name: 'Downtown Loft',
    location: 'Chicago, IL',
    type: 'Commercial',
    value: 450000,
    tokens: 900,
    roi: 9.2,
    monthlyIncome: 2500,
    images: [
      'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800',
    ],
    description: 'Modern loft in the heart of downtown.',
    bedrooms: 1,
    bathrooms: 1,
    sqft: 900,
    amenities: ['Doorman', 'Rooftop'],
  },
];

/**
 * Default — online state, two available properties, no cached entries yet.
 */
export const Default: Story = {
  args: {
    properties: sampleProperties,
    onPropertySelect: undefined,
  },
};

/**
 * Empty — no properties available to download.
 */
export const Empty: Story = {
  args: {
    properties: [],
  },
};

/**
 * ManyProperties — stress test with a larger list to check layout at scale.
 */
export const ManyProperties: Story = {
  args: {
    properties: Array.from({ length: 12 }, (_, i) => ({
      ...sampleProperties[0],
      id: `prop-${i + 1}`,
      name: `Property ${i + 1}`,
      location: `City ${i + 1}, US`,
    })),
  },
};
