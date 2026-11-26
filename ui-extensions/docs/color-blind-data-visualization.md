# Color vision friendly data visualization palette

`components/colorBlindPalette.ts` exports eight colors, a distinct marker pattern for each color, standard constants, high-contrast constants, and a color vision deficiency preview helper. `components/color-blind-palette.css` exposes the colors as CSS custom properties.

Import the CSS file in the consuming app or Storybook entry point when using the custom properties:

```css
.series-blue {
  color: var(--data-viz-blue);
}

.series-blue-high-contrast {
  color: var(--data-viz-high-contrast-blue);
}
```

Use `PortfolioPieChart` as an example of pairing each data color with a marker and a text label in the legend. For line and bar charts, carry the palette entry's `pattern` into point markers, dash styles, or labels. Never use color as the only way to identify a series.

## Review under color vision simulations

Open the `UI Extensions/ColorBlindDataVisualizationPalette` Storybook story and select Normal vision, Simulate protanopia, Simulate deuteranopia, and Simulate tritanopia. Check that:

1. Every series keeps its name and a distinct marker cue in the legend.
2. Color-coded values remain understandable when read with the labels and markers.
3. The chart remains legible in light and dark themes.

The preview uses severity-one matrices from the Machado, Oliveira, and Fernandes color vision simulation model. Its tritan matrix is a severe tritanomaly approximation; it does not model complete S-cone loss. Simulation is a design aid and does not replace review with people who have color vision deficiencies.
