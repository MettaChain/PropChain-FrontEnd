import type { Meta, StoryObj } from '@storybook/nextjs-vite';

import { ThemeSwitcher } from '@/components/ThemeSwitcher';

/**
 * ThemeSwitcher allows users to toggle between light and dark mode.
 *
 * It persists the user's preference in localStorage and respects the
 * system's `prefers-color-scheme` media query as the default.
 *
 * ## Accessibility
 * - Uses a `<button>` with a descriptive label via `aria-label`.
 * - The toggled icon (Sun / Moon) provides a clear visual indicator
 *   of the current theme.
 * - Respects the user's system color scheme preference on first visit.
 */
const meta = {
  title: 'Components/ThemeSwitcher',
  component: ThemeSwitcher,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof ThemeSwitcher>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Default state — renders the toggle button with a Moon icon (light mode). */
export const Default: Story = {};

/**
 * Dark mode — simulated via a `dark` class on a wrapper.
 *
 * In a real app the `dark` class is added to `<html>`; here we wrap
 * the component in a `<div>` with the `dark` class for preview purposes.
 */
export const DarkMode: Story = {
  decorators: [
    (StoryComponent) => (
      <div className="dark" style={{ padding: '1rem', background: '#1a1a2e', borderRadius: '0.5rem' }}>
        <StoryComponent />
      </div>
    ),
  ],
};
