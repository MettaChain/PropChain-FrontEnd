import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { useEffect } from 'react';
import GasPriceTracker, { type GasChainId } from '../components/GasPriceTracker';

interface GasStoryProps {
  chainId: GasChainId;
  gasPrices: { slow: number; standard: number; fast: number };
  alertThreshold: number;
}

function toHexWei(gwei: number): string {
  return `0x${BigInt(Math.round(gwei * 1_000_000_000)).toString(16)}`;
}

/** Story-only RPC adapter keeps examples deterministic and independent of public RPC uptime. */
function GasPriceTrackerStoryHarness({ chainId, gasPrices, alertThreshold }: GasStoryProps) {
  useEffect(() => {
    const originalFetch = window.fetch;
    window.fetch = async (input, init) => {
      const url = typeof input === 'string'
        ? input
        : input instanceof URL
          ? input.href
          : input.url;

      if (url.startsWith('mock://')) {
        const baseFee = 1;
        const rewards = [
          gasPrices.slow - baseFee,
          gasPrices.standard - baseFee,
          gasPrices.fast - baseFee,
        ].map(toHexWei);

        return new Response(
          JSON.stringify({
            jsonrpc: '2.0',
            id: 1,
            result: {
              baseFeePerGas: [toHexWei(baseFee), toHexWei(baseFee)],
              reward: [rewards],
            },
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } },
        );
      }

      return originalFetch(input, init);
    };

    return () => {
      window.fetch = originalFetch;
    };
  }, [gasPrices]);

  const rpcUrls: Partial<Record<GasChainId, string>> = {
    1: 'mock://ethereum',
    137: 'mock://polygon',
    56: 'mock://bnb',
    42161: 'mock://arbitrum',
  };

  return (
    <div style={{ width: 560, maxWidth: '100%' }}>
      <GasPriceTracker
        initialChainId={chainId}
        initialAlertThreshold={alertThreshold}
        rpcUrls={rpcUrls}
      />
    </div>
  );
}

const meta = {
  title: 'UI Extensions/GasPriceTrackerWidget',
  component: GasPriceTrackerStoryHarness,
  parameters: { layout: 'centered' },
  argTypes: {
    chainId: {
      control: 'select',
      options: [1, 137, 56, 42161],
      mapping: { 1: 1, 137: 137, 56: 56, 42161: 42161 },
      description: 'Network to display (1 = Ethereum, 137 = Polygon)',
    },
    gasPrices: { control: 'object', description: 'Mock slow, standard, and fast gas prices in Gwei' },
    alertThreshold: { control: { type: 'number', min: 0, max: 300 } },
  },
  args: {
    chainId: 1,
    gasPrices: { slow: 8, standard: 12, fast: 18 },
    alertThreshold: 100,
  },
} satisfies Meta<typeof GasPriceTrackerStoryHarness>;

export default meta;
type Story = StoryObj<typeof meta>;

export const LowGasBelow20Gwei: Story = {
  args: { chainId: 1, gasPrices: { slow: 8, standard: 12, fast: 18 } },
};

export const MediumGas20To50Gwei: Story = {
  args: { chainId: 1, gasPrices: { slow: 24, standard: 35, fast: 48 } },
};

export const HighGasAbove100Gwei: Story = {
  args: { chainId: 1, gasPrices: { slow: 105, standard: 130, fast: 175 }, alertThreshold: 100 },
};

export const EthereumChain: Story = {
  args: { chainId: 1, gasPrices: { slow: 18, standard: 28, fast: 42 } },
};

export const PolygonChain: Story = {
  args: { chainId: 137, gasPrices: { slow: 3, standard: 7, fast: 12 } },
};

export const DarkTheme: Story = {
  args: { chainId: 1, gasPrices: { slow: 24, standard: 35, fast: 48 } },
  decorators: [
    (Story) => (
      <div className="dark rounded-xl bg-slate-950 p-6">
        <Story />
      </div>
    ),
  ],
};
