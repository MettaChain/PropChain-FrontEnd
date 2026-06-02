import type { Meta, StoryObj } from '@storybook/react';
import React, { useState } from 'react';
import { expect, userEvent, within } from 'storybook/test';

import { NetworkErrorBoundary } from '@/components/error/NetworkErrorBoundary';

/**
 * NetworkErrorBoundary — A network-specific error boundary for handling offline or connectivity failures.
 *
 * ## Usage
 * Wrap components that depend on network availability with `NetworkErrorBoundary`.
 * When a network failure occurs, the boundary shows a user-facing recovery experience
 * instead of letting the entire UI crash.
 *
 * ```tsx
 * import { NetworkErrorBoundary } from '@/components/error/NetworkErrorBoundary';
 *
 * function Dashboard() {
 *   return (
 *     <NetworkErrorBoundary enableRetry maxRetries={3}>
 *       <NetworkDependentWidget />
 *     </NetworkErrorBoundary>
 *   );
 * }
 * ```
 *
 * ## Props
 * - `fallback?: React.ReactNode` — custom fallback UI rendered instead of the built-in error card.
 * - `enableRetry?: boolean` — show a retry connection button when the error is recoverable.
 * - `maxRetries?: number` — maximum number of retry attempts before retry actions are disabled.
 * - `retryDelay?: number` — custom retry delay in milliseconds for exponential backoff.
 *
 * ## Accessibility
 * - Uses semantic headings and alert descriptions for screen readers.
 * - Button labels like `Retry Connection` and `Reload Page` are descriptive.
 * - The network status panel communicates connectivity and retry progress clearly.
 */
const meta = {
  title: 'Components/Error/NetworkErrorBoundary',
  component: NetworkErrorBoundary,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'A boundary for network failures that displays connectivity status and guides users through recovery.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    enableRetry: {
      control: 'boolean',
      description: 'Enable retry controls when the network error is recoverable.',
    },
    maxRetries: {
      control: 'number',
      description: 'Number of maximum retry attempts before retry actions disable.',
    },
    retryDelay: {
      control: 'number',
      description: 'Custom backoff delay applied between retry attempts.',
    },
    fallback: {
      table: {
        disable: true,
      },
      description: 'Custom fallback content shown instead of the default network error screen.',
    },
    onError: {
      table: {
        disable: true,
      },
    },
  },
} satisfies Meta<typeof NetworkErrorBoundary>;

export default meta;
type Story = StoryObj<typeof meta>;

const NetworkFallbackDemo: React.FC<{
  enableRetry?: boolean;
  maxRetries?: number;
  retryDelay?: number;
  fallback?: React.ReactNode;
}> = ({ enableRetry = true, maxRetries = 5, retryDelay = 1000, fallback }) => {
  const [triggerError, setTriggerError] = useState(false);

  return (
    <div className="space-y-6 p-4 min-h-[420px] w-full max-w-2xl">
      <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-slate-700 shadow-sm">
        <p className="text-sm">
          This example uses `NetworkErrorBoundary` to protect a network-dependent component.
          Use the button below to simulate a connectivity failure.
        </p>
      </div>

      <NetworkErrorBoundary
        enableRetry={enableRetry}
        maxRetries={maxRetries}
        retryDelay={retryDelay}
        fallback={fallback}
      >
        <div className="rounded-xl border border-slate-200 bg-white p-6 text-slate-900 shadow-sm">
          {triggerError ? <ThrowNetworkError /> : <p>Network content is available and healthy.</p>}
        </div>
        <button
          type="button"
          onClick={() => setTriggerError(true)}
          className="rounded-full bg-emerald-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700"
        >
          Trigger Network Error
        </button>
      </NetworkErrorBoundary>
    </div>
  );
};

const ThrowNetworkError: React.FC = () => {
  throw new Error('Failed to connect to network endpoint');
};

export const Default: Story = {
  render: (args) => <NetworkFallbackDemo {...args} />,
  args: {
    enableRetry: true,
    maxRetries: 5,
    retryDelay: 1000,
  },
};

export const CustomFallback: Story = {
  render: (args) => (
    <NetworkFallbackDemo
      {...args}
      fallback={
        <div className="rounded-xl border border-slate-300 bg-slate-100 p-6 text-slate-900 shadow-sm">
          <h2 className="text-lg font-semibold">Custom Offline Fallback</h2>
          <p className="mt-2 text-sm">
            Replace the default network error experience with your own application-specific UI.
          </p>
        </div>
      }
    />
  ),
  args: {
    enableRetry: false,
  },
};

export const InteractiveRecover: Story = {
  render: (args) => <NetworkFallbackDemo {...args} />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const triggerButton = await canvas.getByRole('button', { name: /Trigger Network Error/i });
    await userEvent.click(triggerButton);
    await expect(canvas.getByText(/Network Error/i)).toBeInTheDocument();
    await expect(canvas.getByRole('button', { name: /Reload Page/i })).toBeInTheDocument();
  },
};
