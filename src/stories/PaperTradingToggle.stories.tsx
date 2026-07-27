import type { Meta, StoryObj } from '@storybook/react';
import { PaperTradingToggle } from '@/components/PaperTradingToggle';
import { usePaperTradingStore } from '@/store/paperTradingStore';
import React from 'react';

/**
 * PaperTradingToggle — A global switch to toggle between Live Trading and Paper Trading (Simulation) mode.
 *
 * ## Usage
 * This component is connected to the `usePaperTradingStore`. It can be placed in headers, 
 * sidebars, or settings panels to allow users to switch modes instantly.
 *
 * ```tsx
 * import { PaperTradingToggle } from '@/components/PaperTradingToggle';
 * 
 * function Header() {
 *   return (
 *     <header>
 *       <PaperTradingToggle />
 *     </header>
 *   );
 * }
 * ```
 *
 * ## Props
 * `PaperTradingToggle` currently accepts no props as it manages its own state via the global store.
 *
 * ## Accessibility
 * - Uses a Radix UI based Switch component which handles keyboard interactions (Space/Enter).
 * - The switch is associated with a label via `id` and `htmlFor`.
 * - Includes an `aria-label` for screen readers: "Toggle paper trading mode".
 * - The "Simulation" badge is decorative but provides visual feedback for the current state.
 */
const meta = {
  title: 'Components/PaperTradingToggle',
  component: PaperTradingToggle,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'A toggle switch that allows users to switch between live trading and simulation mode.',
      },
    },
  },
  tags: ['autodocs'],
} satisfies Meta<typeof PaperTradingToggle>;

export default meta;
type Story = StoryObj<typeof meta>;

// ---------------------------------------------------------------------------
// Decorator: seed the Zustand store before each story renders
// ---------------------------------------------------------------------------
const withPaperMode = (isPaperMode: boolean) => (Story: React.ComponentType) => {
  usePaperTradingStore.setState({ isPaperMode });
  return <Story />;
};

/**
 * Default state: Live Trading mode (Paper mode is OFF).
 */
export const LiveMode: Story = {
  decorators: [withPaperMode(false)],
};

/**
 * Paper Trading mode is ON.
 * Displays a "Simulation" badge next to the toggle.
 */
export const PaperMode: Story = {
  decorators: [withPaperMode(true)],
};
