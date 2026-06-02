import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { fn } from '@storybook/test';
import { TransactionConfirmation } from './TransactionConfirmation';

const meta = {
  title: 'Components/TransactionConfirmation',
  component: TransactionConfirmation,
  parameters: {
    layout: 'fullscreen',
    chromatic: {
      disableSnapshot: false,
      modes: {
        desktop: 'viewport: 1280x720',
        tablet: 'viewport: 768x1024',
        mobile: 'viewport: 375x667',
      },
    },
  },
  tags: ['autodocs', 'visual-regression'],
  args: {
    onConfirm: fn(),
    onCancel: fn(),
  },
} satisfies Meta<typeof TransactionConfirmation>;

export default meta;
type Story = StoryObj<typeof meta>;

const mockTransaction = {
  to: '0xabcdef1234567890abcdef1234567890abcdef12',
  value: '100000000000000000', // 0.1 ETH
  data: '0x',
  gasLimit: '21000',
  gasPrice: '20000000000',
};

// Desktop viewport stories
export const DesktopLowRisk: Story = {
  args: {
    isOpen: true,
    transaction: mockTransaction,
  },
  parameters: {
    viewport: {
      defaultViewport: 'desktop',
    },
  },
};

export const DesktopHighRisk: Story = {
  args: {
    isOpen: true,
    transaction: {
      ...mockTransaction,
      value: '5000000000000000000', // 5 ETH
    },
  },
  parameters: {
    viewport: {
      defaultViewport: 'desktop',
    },
  },
};

export const DesktopContractInteraction: Story = {
  args: {
    isOpen: true,
    transaction: {
      ...mockTransaction,
      value: '1000000000000000000', // 1 ETH
      data: '0xa9059cbb0000000000000000000000001234567890abcdef1234567890abcdef12000000000000000000000000000000000000000000000000000000000de0b6b3a7640000',
      gasLimit: '100000',
    },
  },
  parameters: {
    viewport: {
      defaultViewport: 'desktop',
    },
  },
};

export const DesktopLoading: Story = {
  args: {
    isOpen: true,
    transaction: mockTransaction,
    loading: true,
  },
  parameters: {
    viewport: {
      defaultViewport: 'desktop',
    },
  },
};

// Mobile viewport stories
export const MobileLowRisk: Story = {
  args: {
    isOpen: true,
    transaction: mockTransaction,
  },
  parameters: {
    viewport: {
      defaultViewport: 'iphone12',
    },
  },
};

export const MobileHighRisk: Story = {
  args: {
    isOpen: true,
    transaction: {
      ...mockTransaction,
      value: '5000000000000000000', // 5 ETH
    },
  },
  parameters: {
    viewport: {
      defaultViewport: 'iphone12',
    },
  },
};

export const MobileContractInteraction: Story = {
  args: {
    isOpen: true,
    transaction: {
      ...mockTransaction,
      value: '1000000000000000000', // 1 ETH
      data: '0xa9059cbb0000000000000000000000001234567890abcdef1234567890abcdef12000000000000000000000000000000000000000000000000000000000de0b6b3a7640000',
      gasLimit: '100000',
    },
  },
  parameters: {
    viewport: {
      defaultViewport: 'iphone12',
    },
  },
};

// Tablet viewport stories
export const TabletLowRisk: Story = {
  args: {
    isOpen: true,
    transaction: mockTransaction,
  },
  parameters: {
    viewport: {
      defaultViewport: 'ipad',
    },
  },
};

export const TabletHighRisk: Story = {
  args: {
    isOpen: true,
    transaction: {
      ...mockTransaction,
      value: '5000000000000000000', // 5 ETH
    },
  },
  parameters: {
    viewport: {
      defaultViewport: 'ipad',
    },
  },
};

// Edge cases
export const ClosedModal: Story = {
  args: {
    isOpen: false,
    transaction: mockTransaction,
  },
  parameters: {
    viewport: {
      defaultViewport: 'desktop',
    },
  },
};

export const LargeTransaction: Story = {
  args: {
    isOpen: true,
    transaction: {
      ...mockTransaction,
      value: '10000000000000000000000', // 10000 ETH
    },
  },
  parameters: {
    viewport: {
      defaultViewport: 'desktop',
    },
  },
};

export const WithGasDetails: Story = {
  args: {
    isOpen: true,
    transaction: {
      ...mockTransaction,
      gasLimit: '21000',
      gasPrice: '50000000000', // Higher gas price
    },
  },
  parameters: {
    viewport: {
      defaultViewport: 'desktop',
    },
  },
};
