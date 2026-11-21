import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { userEvent, within } from 'storybook/test';
import ReferralLinkGenerator from '../components/ReferralLinkGenerator';

const meta = {
  title: 'UI Extensions/ReferralLinkGenerator',
  component: ReferralLinkGenerator,
  parameters: { layout: 'centered' },
  argTypes: {
    baseUrl: { control: 'text' },
    initialShares: { control: { type: 'number', min: 0 } },
    initialClicks: { control: { type: 'number', min: 0 } },
    storageKey: { control: 'text' },
  },
  args: {
    baseUrl: 'https://propchain.io/properties',
    initialShares: 0,
    initialClicks: 0,
    storageKey: 'storybook-referral-copy-history',
  },
  decorators: [
    (Story) => (
      <div className="w-full max-w-3xl p-4">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof ReferralLinkGenerator>;

export default meta;
type Story = StoryObj<typeof meta>;

export const DefaultEmptyCustomCode: Story = {};

export const PrefilledCustomCode: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.type(canvas.getByLabelText(/custom tracking code/i), 'spring-launch');
  },
};

export const GeneratedReferralLink: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.type(canvas.getByLabelText(/custom tracking code/i), 'summer-2026');
    await userEvent.click(canvas.getByRole('button', { name: 'Generate' }));
  },
};

export const CopySuccessState: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('button', { name: 'Copy referral link' }));
  },
};

export const AnalyticsData: Story = {
  args: { initialShares: 248, initialClicks: 1836 },
};

export const DarkTheme: Story = {
  decorators: [
    (Story) => (
      <div className="dark rounded-xl bg-slate-950 p-5">
        <Story />
      </div>
    ),
  ],
};
