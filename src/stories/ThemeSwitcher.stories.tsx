import type { Meta, StoryObj } from '@storybook/nextjs-vite';

import { ThemeSwitcher } from '@/components/ThemeSwitcher';

/**
 * ThemeSwitcher allows users to toggle between light and dark mode.
 *
 * It persists the user's preference in localStorage and respects the
 * system's `prefers-color-scheme` media query as the default.
 *
 * ## Usage
 * ```tsx
 * // Default (sm) — shows icon + label
 * <ThemeSwitcher />
 *
 * // Icon-only — useful in compact navbars
 * <ThemeSwitcher size="icon" />
 *
 * // Custom className
 * <ThemeSwitcher className="ml-auto" />
 * ```
 *
 * ## Props
 * | Prop        | Type                        | Default   | Description                          |
 * |-------------|-----------------------------|-----------|--------------------------------------|
 * | `size`      | `"sm" \| "default" \| "icon"` | `"sm"`  | Controls button size and label visibility |
 * | `className` | `string`                    | —         | Extra Tailwind classes on the button |
 *
 * ## Accessibility
 * - Uses a `<button>` with a descriptive `aria-label` that updates with the current theme
 *   (e.g. "Switch to light mode" / "Switch to dark mode").
 * - The toggled icon (Sun / Moon) provides a clear visual indicator of the current theme.
 * - Respects the user's system color scheme preference on first visit via `prefers-color-scheme`.
 * - Keyboard-accessible: activatable with Enter or Space.
 */
const meta = {
  title: 'Components/ThemeSwitcher',
  component: ThemeSwitcher,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    size: {
      control: 'select',
      options: ['sm', 'default', 'icon'],
      description: 'Controls button size and whether the text label is shown.',
    },
    className: {
      control: 'text',
      description: 'Additional Tailwind CSS classes applied to the button.',
    },
  },
} satisfies Meta<typeof ThemeSwitcher>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Default state — renders the toggle button (sm size) with a Moon icon and "Dark" label in light mode. */
export const Default: Story = {};

/** `size="default"` — slightly larger button, still shows icon + label. */
export const SizeDefault: Story = {
  args: { size: 'default' },
};

/**
 * `size="icon"` — icon-only variant, no text label.
 * Ideal for compact navbars where space is limited.
 */
export const SizeIcon: Story = {
  args: { size: 'icon' },
};

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

/** Icon-only in dark mode. */
export const DarkModeIcon: Story = {
  args: { size: 'icon' },
  decorators: [
    (StoryComponent) => (
      <div className="dark" style={{ padding: '1rem', background: '#1a1a2e', borderRadius: '0.5rem' }}>
        <StoryComponent />
      </div>
    ),
  ],
};
