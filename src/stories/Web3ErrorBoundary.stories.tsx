import React, { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/nextjs-vite';

import { Web3ErrorBoundary } from '@/components/error/Web3ErrorBoundary';
import { Button } from '@/components/ui/button';

const meta = {
  title: 'Components/Error Boundaries/Web3ErrorBoundary',
  component: Web3ErrorBoundary,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          '`Web3ErrorBoundary` catches blockchain-related render errors and displays wallet recovery actions, reload controls, and accessible status messaging to help users recover from Web3 failures.',
      },
    },
  },
  args: {
    enableRetry: true,
    maxRetries: 3,
  },
} satisfies Meta<typeof Web3ErrorBoundary>;

export default meta;

type Story = StoryObj<typeof meta>;

function Web3ErrorTrigger() {
  const [shouldThrow, setShouldThrow] = useState(false);

  if (shouldThrow) {
    throw new Error('Simulated Web3 wallet connection failure');
  }

  return (
    <Button onClick={() => setShouldThrow(true)} className="w-full">
      Trigger Web3 Error
    </Button>
  );
}

const Template: Story = {
  render: (args) => (
    <div className="max-w-md">
      <Web3ErrorBoundary {...args}>
        <Web3ErrorTrigger />
      </Web3ErrorBoundary>
    </div>
  ),
};

export const Default: Story = {
  ...Template,
};

export const WithCustomFallback: Story = {
  ...Template,
  args: {
    fallback: (
      <div className="p-6 bg-slate-50 rounded-lg border border-slate-200 shadow-sm">
        <h3 className="text-lg font-semibold text-slate-900">Wallet Error</h3>
        <p className="mt-2 text-sm text-slate-600">
          A Web3 error occurred while connecting to the wallet. Please refresh or try again.
        </p>
      </div>
    ),
  },
};
