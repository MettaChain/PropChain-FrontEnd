export type DataVisualizationPattern =
  | "circle"
  | "square"
  | "triangle"
  | "diamond"
  | "cross"
  | "stripe"
  | "dash"
  | "ring";

export interface ColorBlindPaletteEntry {
  name: string;
  color: string;
  highContrast: string;
  pattern: DataVisualizationPattern;
}

export type ColorVisionSimulation = "protanopia" | "deuteranopia" | "tritanopia";

const SIMULATION_MATRICES: Record<ColorVisionSimulation, readonly number[]> = {
  protanopia: [0.152286, 1.052583, -0.204868, 0.114503, 0.786281, 0.099216, -0.003882, -0.048116, 1.051998],
  deuteranopia: [0.367322, 0.860646, -0.227968, 0.280085, 0.672501, 0.047413, -0.011820, 0.042940, 0.968881],
  // The cited model's strongest tritan matrix approximates tritanomaly.
  tritanopia: [1.255528, -0.076749, -0.178779, -0.078411, 0.930809, 0.147602, 0.004733, 0.691367, 0.303900],
};

function decodeSrgb(channel: number): number {
  return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
}

function encodeSrgb(channel: number): number {
  const clipped = Math.min(1, Math.max(0, channel));
  return clipped <= 0.0031308 ? clipped * 12.92 : 1.055 * clipped ** (1 / 2.4) - 0.055;
}

/** Simulate a severe CVD view using the Machado et al. severity-1 matrices. */
export function simulateColorVisionDeficiency(hex: string, vision: ColorVisionSimulation): string {
  if (!/^#?[0-9a-f]{6}$/i.test(hex)) throw new Error(`Invalid hex color: ${hex}`);
  const value = hex.startsWith("#") ? hex.slice(1) : hex;
  const rgb = value.match(/[0-9a-f]{2}/gi)!.map((part) => Number.parseInt(part, 16) / 255);
  const [red, green, blue] = rgb.map(decodeSrgb);
  const matrix = SIMULATION_MATRICES[vision];
  const simulated = [
    matrix[0] * red + matrix[1] * green + matrix[2] * blue,
    matrix[3] * red + matrix[4] * green + matrix[5] * blue,
    matrix[6] * red + matrix[7] * green + matrix[8] * blue,
  ];
  return `#${simulated.map((channel) => Math.round(encodeSrgb(channel) * 255).toString(16).padStart(2, "0")).join("").toUpperCase()}`;
}

/** Eight hues from a CVD-aware qualitative palette, each paired with a marker. */
export const COLOR_BLIND_SAFE_PALETTE: readonly ColorBlindPaletteEntry[] = [
  { name: "Blue", color: "#0072B2", highContrast: "#005A92", pattern: "circle" },
  { name: "Orange", color: "#E69F00", highContrast: "#B77900", pattern: "square" },
  { name: "Bluish green", color: "#009E73", highContrast: "#007A59", pattern: "triangle" },
  { name: "Yellow", color: "#F0E442", highContrast: "#817700", pattern: "diamond" },
  { name: "Sky blue", color: "#56B4E9", highContrast: "#1682B8", pattern: "cross" },
  { name: "Vermillion", color: "#D55E00", highContrast: "#A94A00", pattern: "stripe" },
  { name: "Reddish purple", color: "#CC79A7", highContrast: "#A94F80", pattern: "dash" },
  { name: "Black", color: "#000000", highContrast: "#111111", pattern: "ring" },
] as const;

function toConstantKey(name: string): string {
  return name.toUpperCase().replaceAll(" ", "_");
}

export const DATA_VISUALIZATION_COLORS = Object.freeze(
  Object.fromEntries(COLOR_BLIND_SAFE_PALETTE.map(({ name, color }) => [toConstantKey(name), color])),
) as Readonly<Record<string, string>>;

export const DATA_VISUALIZATION_HIGH_CONTRAST_COLORS = Object.freeze(
  Object.fromEntries(COLOR_BLIND_SAFE_PALETTE.map(({ name, highContrast }) => [toConstantKey(name), highContrast])),
) as Readonly<Record<string, string>>;
