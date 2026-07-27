import type { Meta, StoryObj } from '@storybook/react';
import React, { useState } from 'react';
import { expect, userEvent, within } from 'storybook/test';

import { Web3ErrorBoundary } from '@/components/error/Web3ErrorBoundary';

/**
 * Web3ErrorBoundary — A blockchain-specific error boundary for wallet and Web3 failures.
 *
 * ## Usage
 * Wrap any wallet-connected or blockchain UI with `Web3ErrorBoundary` to preserve the page
 * and show a recoverable error experience when Web3 rendering fails.
 *
 * ```tsx
 * import { Web3ErrorBoundary } from '@/components/error/Web3ErrorBoundary';
 *
 * function WalletPanel() {
 *   return (
 *     <Web3ErrorBoundary enableRetry maxRetries={3}>
 *       <ConnectedWalletView />
 *     </Web3ErrorBoundary>
 *   );
 * }
 * ```
 *
 * ## Props
 * - `fallback?: React.ReactNode` — custom fallback UI rendered instead of the built-in error card.
 * - `enableRetry?: boolean` — render recovery action buttons when the captured error supports them.
 * - `maxRetries?: number` — limit retry attempts before the retry action disables.
 * - `onError?: (error: AppError) => void` — callback for custom logging or reporting.
 *
 * ## Accessibility
 * - The built-in error card uses semantic headings and alert regions.
 * - Action buttons have clear, descriptive labels: `Reconnect Wallet` and `Reload Page`.
 * - Keyboard navigation remains supported through standard button controls.
 */
const meta = {
  title: 'Components/Error/Web3ErrorBoundary',
  component: Web3ErrorBoundary,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'A boundary for Web3 and wallet errors that preserves app stability and displays a user-friendly recovery experience.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    enableRetry: {
      control: 'boolean',
      description: 'Show recovery UI when the captured Web3 error is recoverable.',
    },
    maxRetries: {
      control: 'number',
      description: 'Maximum allowed retry attempts before retry actions are disabled.',
    },
    fallback: {
      table: {
        disable: true,
      },
      description: 'Custom fallback element rendered instead of the default Web3 error screen.',
    },
    onError: {
      table: {
        disable: true,
      },
    },
  },
} satisfies Meta<typeof Web3ErrorBoundary>;

export default meta;
type Story = StoryObj<typeof meta>;

const ThrowWeb3Error: React.FC = () => {
  throw new Error('Wallet disconnected');
};

const Web3ErrorBoundaryDemo: React.FC<{
  enableRetry?: boolean;
  maxRetries?: number;
  fallback?: React.ReactNode;
}> = ({ enableRetry = true, maxRetries = 3, fallback }) => {
  const [triggerError, setTriggerError] = useState(false);

  return (
    <div className="space-y-6 p-4 min-h-[360px] w-full max-w-2xl">
      <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-slate-700 shadow-sm">
        <p className="text-sm">
          This example shows a wallet-connected UI protected by `Web3ErrorBoundary`.
          Click the button below to trigger a Web3 error and reveal the fallback experience.
        </p>
      </div>

      <Web3ErrorBoundary enableRetry={enableRetry} maxRetries={maxRetries} fallback={fallback}>
        <div className="rounded-xl border border-slate-200 bg-white p-6 text-slate-900 shadow-sm">
          {triggerError ? <ThrowWeb3Error /> : <p>Wallet content is rendered normally.</p>}
        </div>
        <button
          type="button"
          onClick={() => setTriggerError(true)}
          className="rounded-full bg-indigo-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700"
        >
          Trigger Web3 Error
        </button>
      </Web3ErrorBoundary>
    </div>
  );
};

export const Default: Story = {
  render: (args) => <Web3ErrorBoundaryDemo {...args} />,
  args: {
    enableRetry: true,
    maxRetries: 3,
  },
};

export const WithCustomFallback: Story = {
  render: (args) => (
    <Web3ErrorBoundaryDemo
      {...args}
      fallback={
        <div className="rounded-xl border border-blue-200 bg-blue-50 p-6 text-blue-900 shadow-sm">
          <h2 className="text-lg font-semibold">Custom Wallet Fallback</h2>
          <p className="mt-2 text-sm">A custom fallback UI can replace the built-in error card.</p>
        </div>
      }
    />
  ),
  args: {
    enableRetry: false,
  },
};

export const InteractiveErrorState: Story = {
  render: (args) => <Web3ErrorBoundaryDemo {...args} />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const triggerButton = await canvas.getByRole('button', { name: /trigger web3 error/i });
    await userEvent.click(triggerButton);
    await expect(canvas.getByText(/Blockchain Error/i)).toBeInTheDocument();
    await expect(canvas.getByRole('button', { name: /Reload Page/i })).toBeInTheDocument();
  },
};
