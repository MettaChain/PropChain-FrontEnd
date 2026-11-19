# Building Custom Property Card Variants

This guide explains how the existing `PropertyCard` (`src/components/PropertyCard.tsx`) is built and how to add your own card variants under `ui-extensions/`, without modifying `src/`.

`PropertyCard` has no `variant` prop. It only supports `viewMode: 'grid' | 'list'`. A variant is therefore a new component that you write in `ui-extensions/components/` and that reuses the same data type, helpers and conventions.

## 1. Base `PropertyCard` structure

Props:

```ts
interface PropertyCardProps {
  property: Property;            // from '@/types/property'
  viewMode?: 'grid' | 'list';    // default 'grid'
}
```

The component is exported as `React.memo(PropertyCardInner)` and renders a single `<article>`:

| Region | Contents |
|--------|----------|
| Image (`next/image`, `fill`) | Featured / Verified badges, ROI badge, compare toggle button, favorite button, blockchain badge, compare checkbox |
| Body | Property type label, name as a `Link` to `/properties/{id}`, location, bedrooms/bathrooms/sqft (when `details.bedrooms` is set), description (list mode only) |
| Token summary | Available / total supply and per-token price |
| Footer | Total value (`CurrencyToggle`), `ShareButton`, "Add to Cart" button, "View" link |

State and helpers it relies on:

- `useCartStore` (`addItem`), `useCompareStore` (`selectedIds`, `toggleProperty`, `MAX_COMPARE`), `useFavoritesStore` (`addFavorite`, `removeFavorite`, `isFavorite`)
- `formatPrice`, `formatNumber`, `formatROI`, `getBlockchainColor` from `@/utils/searchUtils`
- `BLOCKCHAIN_LABELS`, `PROPERTY_TYPE_LABELS` from `@/types/property`

Layout is driven by `viewMode`: `flex-row` with a fixed-width image (`w-64`) for list, `flex-col` with a `h-56` image for grid. Spacing and text sizes step up at the `sm:` breakpoint (for example `p-3 sm:p-5`).

## 2. Type definitions

Reuse the existing `Property` type rather than redefining it. The fields used by the examples below are `id`, `name`, `images`, `location.city`, `location.state`, `propertyType`, `price.total`, `price.perToken`, `metrics.roi`, `details.bedrooms`, `details.bathrooms`, `details.squareFeet`, `tokenInfo.available`, `tokenInfo.totalSupply`, `verified` and `featured`.

Put your own prop types in `ui-extensions/types/`:

```ts
// ui-extensions/types/propertyCardVariants.ts
import type { Property } from '@/types/property';

export interface PropertyCardVariantProps {
  property: Property;
  className?: string;
}
```

## 3. Three variant examples

All three are plain components in `ui-extensions/components/`. They render an `<article>` like the base card and link to `/properties/{id}`.

### Minimal

Name, location and ROI only. Useful for dense lists.

```tsx
// ui-extensions/components/PropertyCardMinimal.tsx
import Link from 'next/link';
import type { PropertyCardVariantProps } from '../types/propertyCardVariants';
import { formatROI } from '@/utils/searchUtils';

export function PropertyCardMinimal({ property, className = '' }: PropertyCardVariantProps) {
  return (
    <article
      className={`flex items-center justify-between rounded-lg border border-gray-200 p-3 dark:border-gray-700 dark:bg-gray-800 ${className}`}
    >
      <div className="min-w-0">
        <Link
          href={`/properties/${property.id}`}
          className="block truncate font-semibold text-gray-900 hover:text-blue-600 dark:text-white"
        >
          {property.name}
        </Link>
        <p className="truncate text-sm text-gray-600 dark:text-gray-400">
          {property.location.city}, {property.location.state}
        </p>
      </div>
      <span className="ml-3 shrink-0 rounded bg-blue-700 px-2 py-1 text-xs font-bold text-white">
        {formatROI(property.metrics.roi)} ROI
      </span>
    </article>
  );
}
```

### Compact

Small image plus the key numbers.

```tsx
// ui-extensions/components/PropertyCardCompact.tsx
import Image from 'next/image';
import Link from 'next/link';
import type { PropertyCardVariantProps } from '../types/propertyCardVariants';
import { formatPrice, formatROI } from '@/utils/searchUtils';
import { PROPERTY_TYPE_LABELS } from '@/types/property';

export function PropertyCardCompact({ property, className = '' }: PropertyCardVariantProps) {
  return (
    <article
      className={`flex gap-3 overflow-hidden rounded-xl bg-white shadow-md dark:bg-gray-800 ${className}`}
    >
      <div className="relative h-24 w-24 shrink-0 sm:h-28 sm:w-32">
        <Image
          src={property.images[0]}
          alt={`${property.name} - ${PROPERTY_TYPE_LABELS[property.propertyType]} property in ${property.location.city}, ${property.location.state}`}
          fill
          className="object-cover"
        />
      </div>
      <div className="flex min-w-0 flex-1 flex-col justify-center py-2 pr-3">
        <Link
          href={`/properties/${property.id}`}
          className="truncate font-bold text-gray-900 hover:text-blue-600 dark:text-white"
        >
          {property.name}
        </Link>
        <p className="truncate text-xs text-gray-600 dark:text-gray-400">
          {property.location.city}, {property.location.state}
        </p>
        <p className="mt-1 text-sm font-semibold text-gray-900 dark:text-white">
          {formatPrice(property.price.perToken)} per token
        </p>
        <p className="text-xs text-gray-600 dark:text-gray-400">{formatROI(property.metrics.roi)} ROI</p>
      </div>
    </article>
  );
}
```

### Detailed

Adds the specs and token availability that the base card shows, with the cart/compare/favorite wiring left to you. To keep behaviour consistent with the base card, call the same stores it uses.

```tsx
// ui-extensions/components/PropertyCardDetailed.tsx
import Image from 'next/image';
import Link from 'next/link';
import type { PropertyCardVariantProps } from '../types/propertyCardVariants';
import { formatNumber, formatPrice, formatROI } from '@/utils/searchUtils';
import { PROPERTY_TYPE_LABELS } from '@/types/property';
import { useCartStore } from '@/store/cartStore';

export function PropertyCardDetailed({ property, className = '' }: PropertyCardVariantProps) {
  const { addItem } = useCartStore();
  const soldOut = property.tokenInfo.available === 0;

  return (
    <article className={`overflow-hidden rounded-xl bg-white shadow-md dark:bg-gray-800 ${className}`}>
      <div className="relative h-56 w-full">
        <Image
          src={property.images[0]}
          alt={`${property.name} - ${PROPERTY_TYPE_LABELS[property.propertyType]} property in ${property.location.city}, ${property.location.state}`}
          fill
          className="object-cover"
        />
        {property.verified && (
          <span
            role="status"
            aria-label="Verified property"
            className="absolute left-3 top-3 rounded bg-emerald-700 px-2 py-1 text-xs font-semibold text-white"
          >
            Verified
          </span>
        )}
      </div>

      <div className="p-4 sm:p-5">
        <Link
          href={`/properties/${property.id}`}
          className="text-lg font-bold text-gray-900 hover:text-blue-600 dark:text-white"
        >
          {property.name}
        </Link>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          {property.location.city}, {property.location.state}
        </p>

        <dl className="mt-3 grid grid-cols-3 gap-2 text-sm text-gray-700 dark:text-gray-300">
          <div>
            <dt className="text-xs text-gray-500 dark:text-gray-400">Size</dt>
            <dd>{formatNumber(property.details.squareFeet)} sqft</dd>
          </div>
          <div>
            <dt className="text-xs text-gray-500 dark:text-gray-400">ROI</dt>
            <dd>{formatROI(property.metrics.roi)}</dd>
          </div>
          <div>
            <dt className="text-xs text-gray-500 dark:text-gray-400">Per token</dt>
            <dd>{formatPrice(property.price.perToken)}</dd>
          </div>
        </dl>

        <p className="mt-3 text-sm text-gray-700 dark:text-gray-300">
          {formatNumber(property.tokenInfo.available)} / {formatNumber(property.tokenInfo.totalSupply)} tokens available
        </p>

        <button
          type="button"
          onClick={() => addItem(property, 1)}
          disabled={soldOut}
          aria-label={soldOut ? 'No tokens available' : `Add ${property.name} to cart`}
          className="mt-4 rounded-lg bg-green-600 px-3 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-2"
        >
          Add to Cart
        </button>
      </div>
    </article>
  );
}
```

## 4. Responsive design patterns

Patterns taken from the base card:

- Mobile-first sizes with `sm:` overrides (`p-3 sm:p-5`, `text-base sm:text-xl`).
- `min-w-0` plus `truncate` or `line-clamp-2` on text inside flex rows so long names do not overflow.
- Image area has a fixed height (`h-56`) or width (`w-64`) so `next/image` with `fill` has a sized parent.
- Secondary labels may be hidden on small screens (`hidden sm:inline` on the "Add to Cart" text, keeping the icon and `aria-label`).
- Switch layout direction with a single conditional class (`flex-row` vs `flex-col`) rather than duplicating markup.

## 5. Accessibility requirements

Follow what `PropertyCard` already does, and what its a11y tests (`src/components/__tests__/PropertyCard.a11y.test.tsx`, `PropertyCardContrast.test.tsx`) check:

- Render each card as an `<article>` and give links meaningful text.
- Give images descriptive `alt` text (name, property type, city and state), and mark purely decorative icons `aria-hidden="true"`.
- Give icon-only buttons an `aria-label`; use `aria-pressed` for toggles.
- Badge colours must meet WCAG AA contrast (4.5:1). The base card uses `bg-*-700` backgrounds with white text in light mode.
- Use `focus-visible:ring-*` styles on every interactive element.
- Keep disabled controls explained (for example `aria-label="No tokens available"`).

## 6. Storybook stories

The repo's stories (see `src/stories/PropertyCard.stories.tsx`) use `@storybook/nextjs-vite` with `Meta` / `StoryObj`. Place yours in `ui-extensions/stories/` and build `args` from a `Property` object.

```tsx
// ui-extensions/stories/PropertyCardVariants.stories.tsx
import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { PropertyCardCompact } from '../components/PropertyCardCompact';
import type { Property } from '@/types/property';

const property: Property = {
  id: 'prop-variant-1',
  name: 'Sunset Villa',
  description: 'Bright residential property with a pool and city views',
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
    contractAddress: '0x1234567890123456789012345678901234567890',
    tokenSymbol: 'PROP',
  },
  metrics: { roi: 8.5, annualReturn: 42500, transactionVolume: 1000000, appreciationRate: 5.2 },
  details: { bedrooms: 4, bathrooms: 3, squareFeet: 2500, yearBuilt: 2020, amenities: ['pool', 'garage'] },
  images: ['https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=800'],
  listedDate: '2024-01-01',
  status: 'active',
  featured: true,
  verified: true,
};

const meta = {
  title: 'Extensions/PropertyCardCompact',
  component: PropertyCardCompact,
  tags: ['autodocs'],
  args: { property },
} satisfies Meta<typeof PropertyCardCompact>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const LongName: Story = {
  args: { property: { ...property, name: 'An Exceptionally Long Property Name That Should Truncate' } },
};
```

The `property` fixture above is copied from the existing PropertyCard story, so it matches the `Property` type. Add the same pattern for the minimal and detailed variants. Detailed uses `useCartStore`, a Zustand store, so it needs no provider.

## 7. Best practices

- Do not edit `src/components/PropertyCard.tsx`; compose with its helpers and stores instead.
- Reuse `Property` and the `@/utils/searchUtils` formatters so numbers display consistently with the rest of the app.
- Keep the variant presentational; if it needs cart, compare or favorites behaviour, use the same stores as the base card.
- Add a Storybook story and check light and dark themes plus a narrow viewport before using a variant.
