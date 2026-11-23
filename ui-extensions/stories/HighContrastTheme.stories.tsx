import type { Meta, StoryObj } from '@storybook/nextjs-vite';

import { HighContrastTheme } from '../components/HighContrastTheme';
import { highContrastPairs } from '../components/highContrastTheme';
import '../styles/high-contrast.css';

/**
 * Storybook coverage for the high contrast theme (#1365).
 *
 * The `aria-label` on the inner markup is the point of the story: the axe
 * addon runs against every render, so the palette and focus outline are
 * verified against real controls, not just swatches.
 */

function ThemeShowcase({ baseTheme }: { baseTheme: 'light' | 'dark' }) {
  return (
    <div className="space-y-6 p-6">
      <div>
        <h2 className="hc-text text-lg font-semibold">Property escrow</h2>
        <p className="hc-text-muted text-sm">
          Closing on 12 Harbour Lofts. Base theme: {baseTheme}.
        </p>
      </div>

      <div className="hc-card p-4">
        <h3 className="hc-text font-semibold">Deposit</h3>
        <p className="hc-text-muted text-sm">Funds are released on confirmation.</p>
        <div className="mt-3 flex gap-3">
          <button type="button" className="hc-button">
            Confirm
          </button>
          <button type="button" className="hc-button-secondary">
            Cancel
          </button>
        </div>
      </div>

      <div className="space-y-2">
        <label className="hc-text block text-sm" htmlFor="hc-amount">
          Amount
        </label>
        <input id="hc-amount" className="hc-input w-full" defaultValue="25,000" />
        <p className="hc-text-danger text-sm" role="alert">
          Amount exceeds your verified limit.
        </p>
        <p className="hc-text-success text-sm">Identity verification complete.</p>
      </div>

      <button type="button" className="hc-button" disabled>
        Disabled action
      </button>

      <table className="w-full text-start text-sm">
        <caption className="hc-text p-2 text-start font-semibold">Contrast pairs (min 7:1)</caption>
        <thead>
          <tr>
            <th className="hc-text p-2 text-start">Pair</th>
            <th className="hc-text p-2 text-start">Foreground</th>
            <th className="hc-text p-2 text-start">Background</th>
          </tr>
        </thead>
        <tbody>
          {highContrastPairs(baseTheme).map((pair) => (
            <tr key={pair.label}>
              <td className="hc-text p-2">{pair.label}</td>
              <td className="hc-text-muted p-2 font-mono">{pair.fg}</td>
              <td className="hc-text-muted p-2 font-mono">{pair.bg}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const meta = {
  title: 'UI Extensions/HighContrastTheme',
  component: HighContrastTheme,
  parameters: { layout: 'fullscreen' },
  argTypes: {
    baseTheme: { control: 'radio', options: ['light', 'dark'], description: 'Base theme the palette is tuned for' },
    enabled: { control: 'boolean', description: 'Apply the high contrast palette' },
    inlineStyles: { control: 'boolean', description: 'Inline the custom properties as well as the stylesheet' },
  },
  // `children` is part of the meta args so each story can supply its own
  // markup through `render` without repeating the required prop.
  args: { enabled: true, baseTheme: 'light', inlineStyles: false, children: null },
} satisfies Meta<typeof HighContrastTheme>;

export default meta;
type Story = StoryObj<typeof meta>;

export const LightBase: Story = {
  render: (args) => (
    <HighContrastTheme {...args}>
      <ThemeShowcase baseTheme="light" />
    </HighContrastTheme>
  ),
};

export const DarkBase: Story = {
  args: { baseTheme: 'dark', children: null },
  render: (args) => (
    <HighContrastTheme {...args}>
      <ThemeShowcase baseTheme="dark" />
    </HighContrastTheme>
  ),
};

export const InlineCustomProperties: Story = {
  args: { inlineStyles: true, children: null },
  render: (args) => (
    <HighContrastTheme {...args}>
      <ThemeShowcase baseTheme="light" />
    </HighContrastTheme>
  ),
};

export const Disabled: Story = {
  args: { enabled: false, children: null },
  render: (args) => (
    <HighContrastTheme {...args}>
      <ThemeShowcase baseTheme="light" />
    </HighContrastTheme>
  ),
};
