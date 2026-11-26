import {
  COLOR_BLIND_SAFE_PALETTE,
  DATA_VISUALIZATION_COLORS,
  DATA_VISUALIZATION_HIGH_CONTRAST_COLORS,
  simulateColorVisionDeficiency,
  type ColorVisionSimulation,
} from "../components/colorBlindPalette";

describe("color vision friendly visualization palette", () => {
  it("provides eight unique colors and eight unique non-color cues", () => {
    expect(COLOR_BLIND_SAFE_PALETTE).toHaveLength(8);
    expect(new Set(COLOR_BLIND_SAFE_PALETTE.map(({ color }) => color)).size).toBe(8);
    expect(new Set(COLOR_BLIND_SAFE_PALETTE.map(({ pattern }) => pattern)).size).toBe(8);
  });

  it.each(["Blue", "Orange", "Bluish green", "Yellow", "Sky blue", "Vermillion", "Reddish purple", "Black"])(
    "exports standard and high-contrast values for %s",
    (name) => {
      const key = name.toUpperCase().replaceAll(" ", "_");
      expect(DATA_VISUALIZATION_COLORS[key]).toMatch(/^#[0-9A-F]{6}$/i);
      expect(DATA_VISUALIZATION_HIGH_CONTRAST_COLORS[key]).toMatch(/^#[0-9A-F]{6}$/i);
      expect(DATA_VISUALIZATION_COLORS[key]).not.toBe(DATA_VISUALIZATION_HIGH_CONTRAST_COLORS[key]);
    },
  );

  it.each(["protanopia", "deuteranopia", "tritanopia"] as const)(
    "simulates %s colors while keeping all pattern cues available",
    (vision: ColorVisionSimulation) => {
      const simulatedColors = COLOR_BLIND_SAFE_PALETTE.map(({ color }) => simulateColorVisionDeficiency(color, vision));
      expect(simulatedColors).toHaveLength(8);
      expect(simulatedColors.every((color) => /^#[0-9A-F]{6}$/.test(color))).toBe(true);
      expect(new Set(COLOR_BLIND_SAFE_PALETTE.map(({ pattern }) => pattern)).size).toBe(8);
    },
  );

  it("rejects malformed color values for simulation", () => {
    expect(() => simulateColorVisionDeficiency("blue", "protanopia")).toThrow("Invalid hex color");
  });
});
