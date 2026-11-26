import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useState } from "react";
import {
  COLOR_BLIND_SAFE_PALETTE,
  simulateColorVisionDeficiency,
  DATA_VISUALIZATION_COLORS,
  DATA_VISUALIZATION_HIGH_CONTRAST_COLORS,
  type ColorVisionSimulation,
} from "../components/colorBlindPalette";
import { PatternMarker, PortfolioPieChart } from "../components/PortfolioPieChart";
import "../components/color-blind-palette.css";

function PalettePreview() {
  const [vision, setVision] = useState<ColorVisionSimulation | null>(null);
  const simulatedColors = COLOR_BLIND_SAFE_PALETTE.map((entry) => vision
    ? simulateColorVisionDeficiency(entry.color, vision)
    : entry.color);

  return (
    <section aria-label="Color vision friendly data visualization palette" className="max-w-4xl space-y-6">
      <div>
        <h2 className="mb-4 text-lg font-semibold">Eight colors paired with distinct markers</h2>
        <div className="mb-4 flex flex-wrap gap-2" aria-label="Color vision simulation">
          {([null, "protanopia", "deuteranopia", "tritanopia"] as const).map((mode) => (
            <button key={mode ?? "normal"} type="button" aria-pressed={vision === mode} onClick={() => setVision(mode)} className="min-h-11 rounded-md border px-3 text-sm">
              {mode ? `Simulate ${mode}` : "Normal vision"}
            </button>
          ))}
        </div>
        <p className="mb-3 text-sm text-slate-600">Preview mode: {vision ?? "normal vision"}. Marker shapes remain paired with each color.</p>
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {COLOR_BLIND_SAFE_PALETTE.map((entry, index) => (
            <li key={entry.name} className="rounded-lg border p-3">
              <div className="flex items-center gap-2">
                <span className="h-8 flex-1 rounded" style={{ backgroundColor: simulatedColors[index] }} aria-label={`${entry.name} color swatch`} />
                <svg aria-hidden="true" className="h-6 w-6" viewBox="0 0 16 16"><PatternMarker pattern={entry.pattern} color={simulatedColors[index]} /></svg>
              </div>
              <p className="mt-2 font-medium">{entry.name}</p>
              <p className="text-xs">{simulatedColors[index]} / {entry.pattern}</p>
              <p className="text-xs">High contrast: {entry.highContrast}</p>
            </li>
          ))}
        </ul>
      </div>
      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded-lg border p-3">
          <h3 className="font-medium">Chart example</h3>
          <PortfolioPieChart data={[
            { name: "Residential", value: 45 },
            { name: "Commercial", value: 30 },
            { name: "Industrial", value: 15 },
            { name: "Mixed use", value: 10 },
          ]} colors={simulatedColors} />
        </div>
        <div className="rounded-lg border p-3">
          <h3 className="font-medium">Exported constants</h3>
          <pre className="mt-2 overflow-auto text-xs" aria-label="Exported palette constants">
            {JSON.stringify({ DATA_VISUALIZATION_COLORS, DATA_VISUALIZATION_HIGH_CONTRAST_COLORS }, null, 2)}
          </pre>
        </div>
      </div>
    </section>
  );
}

const meta = {
  title: "UI Extensions/ColorBlindDataVisualizationPalette",
  component: PalettePreview,
  parameters: { layout: "centered" },
  decorators: [(Story) => <div className="w-full p-4"><Story /></div>],
} satisfies Meta<typeof PalettePreview>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Palette: Story = {};
