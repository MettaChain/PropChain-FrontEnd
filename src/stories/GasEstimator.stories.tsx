import type { Meta, StoryObj } from '@storybook/react';
import { GasEstimator } from '../components/GasEstimator';

const meta: Meta<typeof GasEstimator> = {
  title: 'Components/GasEstimator',
  component: GasEstimator,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Gas fee estimator for Ethereum transactions. Displays estimated gas cost in ETH and USD with selectable speed tiers (slow, standard, fast). Automatically detects high gas conditions and warns the user.',
      },
    },
  },
  argTypes: {
    to: { control: 'text', description: 'Recipient address' },
    value: { control: 'text', description: 'Transaction value in wei' },
    data: { control: 'text', description: 'Transaction calldata' },
    enabled: { control: 'boolean', description: 'Enable/disable the estimator' },
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof GasEstimator>;

export const Default: Story = {
  args: {
    to: '0x1234567890abcdef1234567890abcdef12345678',
    value: '1000000000000000000',
    enabled: true,
  },
};

export const Disabled: Story = {
  args: {
    to: '0x1234567890abcdef1234567890abcdef12345678',
    enabled: false,
  },
};

export const WithCalldata: Story = {
  args: {
    to: '0x1234567890abcdef1234567890abcdef12345678',
    data: '0xa9059cbb0000000000000000000000001234567890abcdef1234567890abcdef123456780000000000000000000000000000000000000000000000000de0b6b3a7640000',
    enabled: true,
  },
};

export const NoTarget: Story = {
  args: {
    to: undefined,
    enabled: true,
  },
};
