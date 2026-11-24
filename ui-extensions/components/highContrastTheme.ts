/**
 * High contrast palette for extension components (#1365).
 *
 * Every foreground/background pair exposed through `highContrastPairs` is
 * asserted at 7:1 or better in `tests/highContrastTheme.test.ts` using the
 * existing WCAG `checkContrast` helper, so the palette cannot regress below
 * AAA for normal text without failing a test.
 */

export type HighContrastBaseTheme = 'light' | 'dark';

export interface HighContrastPalette {
  /** Page/card surface. */
  background: string;
  /** Primary text. */
  foreground: string;
  /** Secondary text (timestamps, helper copy). */
  mutedForeground: string;
  /** Borders, dividers and control outlines. */
  border: string;
  /** Visible focus outline. */
  focusRing: string;
  /** Solid fill for primary buttons. */
  accent: string;
  /** Text drawn on `accent`. */
  accentForeground: string;
  /** Destructive/error text. */
  danger: string;
  /** Confirmation/success text. */
  success: string;
  /** Input, select and textarea fill. */
  inputBackground: string;
}

export const HIGH_CONTRAST_LIGHT: HighContrastPalette = {
  background: '#ffffff',
  foreground: '#000000',
  mutedForeground: '#333333',
  border: '#000000',
  focusRing: '#0000cc',
  accent: '#0000cc',
  accentForeground: '#ffffff',
  danger: '#b00020',
  success: '#005a2b',
  inputBackground: '#ffffff',
};

export const HIGH_CONTRAST_DARK: HighContrastPalette = {
  background: '#000000',
  foreground: '#ffffff',
  mutedForeground: '#cccccc',
  border: '#ffffff',
  focusRing: '#ffd700',
  accent: '#ffd700',
  accentForeground: '#000000',
  danger: '#ff8080',
  success: '#99ffbb',
  inputBackground: '#000000',
};

export const HIGH_CONTRAST_BY_BASE: Record<HighContrastBaseTheme, HighContrastPalette> = {
  light: HIGH_CONTRAST_LIGHT,
  dark: HIGH_CONTRAST_DARK,
};

/** Minimum contrast ratio required for normal text (WCAG 2.1 AAA). */
export const HIGH_CONTRAST_MIN_RATIO = 7;

export interface ContrastPair {
  /** Which palette role is used for the foreground. */
  role: keyof HighContrastPalette;
  /** Which palette role sits behind it. */
  against: keyof HighContrastPalette;
  label: string;
}

/** Foreground/background combinations the theme guarantees. */
export const HIGH_CONTRAST_PAIRS: readonly ContrastPair[] = [
  { role: 'foreground', against: 'background', label: 'body text on surface' },
  { role: 'mutedForeground', against: 'background', label: 'secondary text on surface' },
  { role: 'border', against: 'background', label: 'borders on surface' },
  { role: 'focusRing', against: 'background', label: 'focus ring on surface' },
  { role: 'accent', against: 'background', label: 'link/accent text on surface' },
  { role: 'accentForeground', against: 'accent', label: 'button label on accent fill' },
  { role: 'danger', against: 'background', label: 'error text on surface' },
  { role: 'success', against: 'background', label: 'success text on surface' },
  { role: 'foreground', against: 'inputBackground', label: 'input text on input fill' },
];

/** Resolves a palette's contrast pairs as ready-to-check `{label, fg, bg}` tuples. */
export function highContrastPairs(theme: HighContrastBaseTheme) {
  const palette = HIGH_CONTRAST_BY_BASE[theme];
  return HIGH_CONTRAST_PAIRS.map((pair) => ({
    label: pair.label,
    fg: palette[pair.role],
    bg: palette[pair.against],
  }));
}

/**
 * Inline custom properties for a palette. Used for scoped overrides (for
 * example a single high-contrast card) without importing the stylesheet.
 */
export function highContrastStyle(theme: HighContrastBaseTheme): Record<string, string> {
  const palette = HIGH_CONTRAST_BY_BASE[theme];
  return {
    '--hc-background': palette.background,
    '--hc-foreground': palette.foreground,
    '--hc-muted-foreground': palette.mutedForeground,
    '--hc-border': palette.border,
    '--hc-focus-ring': palette.focusRing,
    '--hc-accent': palette.accent,
    '--hc-accent-foreground': palette.accentForeground,
    '--hc-danger': palette.danger,
    '--hc-success': palette.success,
    '--hc-input-background': palette.inputBackground,
  };
}
