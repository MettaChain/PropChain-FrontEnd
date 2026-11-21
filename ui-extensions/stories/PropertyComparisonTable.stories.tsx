import type { Meta, StoryObj } from '@storybook/nextjs-vite';

import {
  PropertyComparisonTable,
  type ComparisonProperty,
} from '../components/PropertyComparisonTable';

/** Storybook coverage for PropertyComparisonTable (#1436). */

const threeProperties: ComparisonProperty[] = [
  { id: 'p-1', name: 'Sunset Villa', location: 'Los Angeles, CA', price: 750_000, roi: 8.4, yield: 5.1 },
  { id: 'p-2', name: 'Harbour Lofts', location: 'Seattle, WA', price: 620_000, roi: 7.2, yield: 4.6 },
  { id: 'p-3', name: 'Cedar Heights', location: 'Austin, TX', price: 480_000, roi: 9.1, yield: 6.0 },
];

const twoProperties = threeProperties.slice(0, 2);

const fiveProperties: ComparisonProperty[] = [
  ...threeProperties,
  { id: 'p-4', name: 'Palm Court', location: 'Miami, FL', price: 910_000, roi: 6.8, yield: 4.2 },
  { id: 'p-5', name: 'Granite Row', location: 'Denver, CO', price: 540_000, roi: 7.9, yield: 5.4 },
];

const meta = {
  title: 'UI Extensions/PropertyComparisonTable',
  component: PropertyComparisonTable,
  parameters: { layout: 'fullscreen' },
  argTypes: {
    properties: {
      description: 'Properties to compare, one column per property',
      control: 'object',
    },
    loading: { control: 'boolean', description: 'Render the loading skeleton' },
    dir: { control: 'radio', options: ['ltr', 'rtl'], description: 'Layout direction' },
  },
  args: { loading: false, dir: 'ltr' },
  decorators: [
    (Story) => (
      <div style={{ padding: 24 }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof PropertyComparisonTable>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = { args: { properties: threeProperties } };

export const TwoProperties: Story = { args: { properties: twoProperties } };

export const FiveProperties: Story = { args: { properties: fiveProperties } };

export const LoadingSkeleton: Story = {
  args: { properties: threeProperties, loading: true },
};

export const EmptyState: Story = { args: { properties: [] } };

export const RtlLayout: Story = {
  args: { properties: threeProperties, dir: 'rtl' },
  parameters: { direction: 'rtl' },
};

export const DarkTheme: Story = {
  args: { properties: threeProperties },
  decorators: [
    (Story) => (
      <div className="dark bg-slate-950 p-6">
        <Story />
      </div>
    ),
  ],
};
