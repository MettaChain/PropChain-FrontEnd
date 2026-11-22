import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import DarkModeToggle from '../components/DarkModeToggle';

const meta = {
  title: 'UI Extensions/DarkModeToggle',
  component: DarkModeToggle,
  parameters: { layout: 'centered' },
  argTypes: {
    initialMode: {
      control: 'inline-radio',
      options: ['light', 'dark', 'system'],
    },
    transitionDurationMs: {
      control: { type: 'number', min: 0, max: 1500, step: 50 },
    },
  },
  args: { initialMode: 'light', transitionDurationMs: 200 },
} satisfies Meta<typeof DarkModeToggle>;

export default meta;
type Story = StoryObj<typeof meta>;

export const LightMode: Story = { args: { initialMode: 'light' } };

export const DarkMode: Story = { args: { initialMode: 'dark' } };

export const SystemMode: Story = { args: { initialMode: 'system' } };

export const SmoothTransition: Story = {
  args: { initialMode: 'light', transitionDurationMs: 700 },
};

export const KeyboardAccessible: Story = {
  args: { initialMode: 'light' },
  parameters: {
    docs: {
      description: {
        story: 'The native button supports Tab focus, Enter, and Space. Activate it to cycle through light, dark, and system modes.',
      },
    },
  },
};

export const DarkTheme: Story = {
  args: { initialMode: 'dark' },
  decorators: [
    (Story) => (
      <div className="dark rounded-xl bg-slate-950 p-6">
        <Story />
      </div>
    ),
  ],
};
