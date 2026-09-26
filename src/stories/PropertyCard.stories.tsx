import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { PropertyCard } from "../components/PropertyCard";
import type { Property } from "../types/property";

/**
 * PropertyCard story coverage (#1096).
 *
 * `PropertyCard` is the highest-traffic component in the app: it renders on
 * /properties, in search results, in the watchlist and in the compare tray.
 * Before this story the only PropertyCard story lived under an `A11y/` title,
 * so design review and the a11y addon never saw the card in the states it
 * actually ships in.
 */
const baseProperty: Property = {
  id: "prop-storybook-1",
  name: "Sunset Villa",
  description: "Bright residential property with a pool and city views",
  location: {
    address: "123 Main St",
    city: "Los Angeles",
    state: "California",
    country: "USA",
    zipCode: "90001",
    coordinates: { lat: 34.05, lng: -118.25 },
  },
  price: { total: 500, perToken: 50, currency: "USD" },
  propertyType: "residential",
  blockchain: "ethereum",
  tokenInfo: {
    totalSupply: 1000,
    available: 500,
    sold: 500,
    contractAddress: "0x1234567890123456789012345678901234567890",
    tokenSymbol: "PROP",
  },
  metrics: {
    roi: 8.5,
    annualReturn: 42500,
    transactionVolume: 1000000,
    appreciationRate: 5.2,
  },
  details: {
    bedrooms: 4,
    bathrooms: 3,
    squareFeet: 2500,
    yearBuilt: 2020,
    amenities: ["pool", "garage"],
  },
  images: ["https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=800"],
  listedDate: "2024-01-01",
  status: "active",
  featured: true,
  verified: true,
};

const meta = {
  title: "Components/PropertyCard",
  component: PropertyCard,
  parameters: {
    layout: "centered",
    a11y: {
      config: {
        rules: [
          { id: "color-contrast", enabled: true },
          { id: "image-alt", enabled: true },
          { id: "button-name", enabled: true },
        ],
      },
    },
  },
  args: {
    property: baseProperty,
    viewMode: "grid",
  },
  decorators: [
    // Give the card the width its container would normally provide; in a
    // centred single-story layout it would otherwise collapse to its min-width.
    (Story) => (
      <div style={{ maxWidth: 420, width: "100%" }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof PropertyCard>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Default grid rendering with featured and verified badges. */
export const Grid: Story = {};

/** List rendering, which switches the card to a horizontal layout. */
export const List: Story = {
  args: { viewMode: "list" },
  decorators: [
    (Story) => (
      <div style={{ maxWidth: 720, width: "100%" }}>
        <Story />
      </div>
    ),
  ],
};

/** Unverified, non-featured listing: the common case for a fresh listing. */
export const Unverified: Story = {
  args: {
    property: { ...baseProperty, featured: false, verified: false },
  },
};

/** Sold-out listing, so the exhausted token supply state is reviewable. */
export const SoldOut: Story = {
  args: {
    property: {
      ...baseProperty,
      status: "sold",
      tokenInfo: { ...baseProperty.tokenInfo, available: 0, sold: 1000 },
    },
  },
};

/** No photography available: exercises the image placeholder path. */
export const NoImages: Story = {
  args: {
    property: { ...baseProperty, images: [] },
  },
};

/**
 * RTL mirror. `.storybook/preview.ts` supplies the `dir="rtl"` wrapper for any
 * story that sets `parameters.direction`.
 */
export const GridRTL: Story = {
  args: { viewMode: "grid" },
  parameters: { direction: "rtl" },
};
