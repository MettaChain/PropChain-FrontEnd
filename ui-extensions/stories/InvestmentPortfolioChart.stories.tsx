import type { Meta, StoryObj } from '@storybook/nextjs-vite';

import {
  InvestmentPortfolioChart,
  type PortfolioHolding,
} from '../components/InvestmentPortfolioChart';

/** Storybook coverage for InvestmentPortfolioChart (#1437). */

const balanced: PortfolioHolding[] = [
  { name: 'Residential', value: 420_000, change: 6.4 },
  { name: 'Commercial', value: 310_000, change: 3.1 },
  { name: 'Industrial', value: 180_000, change: 1.8 },
  { name: 'Retail', value: 90_000, change: -0.6 },
];

const singleAsset: PortfolioHolding[] = [
  { name: 'Residential', value: 1_000_000, change: 4.2 },
];

const dense: PortfolioHolding[] = [
  { name: 'Residential', value: 180_000, change: 2.1 },
  { name: 'Commercial', value: 160_000, change: -1.4 },
  { name: 'Industrial', value: 145_000, change: 3.6 },
  { name: 'Retail', value: 120_000, change: 0.9 },
  { name: 'Hospitality', value: 110_000, change: -2.7 },
  { name: 'Logistics', value: 95_000, change: 5.2 },
  { name: 'Office', value: 80_000, change: -0.3 },
  { name: 'Mixed Use', value: 70_000, change: 1.1 },
  { name: 'Land', value: 40_000, change: -4.5 },
];

const negative: PortfolioHolding[] = [
  { name: 'Residential', value: 300_000, change: -8.4 },
  { name: 'Commercial', value: 250_000, change: -3.2 },
  { name: 'Industrial', value: 150_000, change: -1.7 },
];

const meta = {
  title: 'UI Extensions/InvestmentPortfolioChart',
  component: InvestmentPortfolioChart,
  parameters: { layout: 'centered' },
  argTypes: {
    holdings: {
      description: 'Portfolio holdings, each with a name, value and percentage change',
      control: 'object',
    },
    loading: { control: 'boolean' },
    dark: { control: 'boolean' },
    height: { control: { type: 'number', min: 160, max: 600, step: 16 } },
  },
  args: { dark: false, loading: false, height: 288 },
  decorators: [
    (Story) => (
      <div style={{ width: 720 }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof InvestmentPortfolioChart>;

export default meta;
type Story = StoryObj<typeof meta>;

export const BalancedPortfolio: Story = { args: { holdings: balanced } };

export const SingleAssetPortfolio: Story = { args: { holdings: singleAsset } };

export const DensePortfolio: Story = { args: { holdings: dense } };

export const NegativeReturns: Story = { args: { holdings: negative } };

export const LoadingState: Story = { args: { holdings: [], loading: true } };

export const DarkTheme: Story = {
  args: { holdings: balanced, dark: true },
  decorators: [
    (Story) => (
      <div className="dark bg-slate-950 p-6" style={{ width: 720 }}>
        <Story />
      </div>
    ),
  ],
};
