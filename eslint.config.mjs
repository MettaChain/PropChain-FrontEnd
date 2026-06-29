// For more info, see https://github.com/storybookjs/eslint-plugin-storybook#configuration-flat-config-format
import storybook from "eslint-plugin-storybook";

import tseslint from "@typescript-eslint/eslint-plugin";
import tsParser from "@typescript-eslint/parser";

/*
 * ESLint Allow-List (Issue #482)
 *
 * The following files contain intentional eslint-disable directives that
 * cannot be expressed via flat-config rule overrides because the relevant
 * plugins (react, @next/next, jsx-a11y) are loaded by Next.js's built-in
 * ESLint integration, not by this configuration file.
 *
 * Known exceptions:
 *
 * react/no-danger
 *   - src/app/layout.tsx: Inline theme-bootstrap script (static string, no XSS risk).
 *   - src/components/ui/chart.tsx: ChartStyle DOMPurify-sanitised CSS (no XSS risk).
 *
 * @next/next/no-img-element
 *   - src/app/accessibility/page.tsx: Accessibility demo page using <img> with alt text.
 *   - src/components/security/TransactionSecuritySettings.tsx: Dynamically generated QR
 *     code data URL — Next.js <Image> does not support data: URLs.
 *   - src/components/__tests__/MobilePropertyViewer.test.tsx: next/image mock in test.
 *   - src/components/__tests__/MobilePropertyCard.test.tsx: next/image mock in test.
 *
 * jsx-a11y/alt-text
 *   - src/components/__tests__/MobilePropertyViewer.test.tsx: next/image mock in test.
 *   - src/components/__tests__/MobilePropertyCard.test.tsx: next/image mock in test.
 *
 * react/display-name
 *   - src/components/__tests__/RecentlyViewed.test.tsx: next/link mock in test.
 *   - src/components/__tests__/ComparisonBar.test.tsx: next/link mock in test.
 *
 * no-var
 *   - src/utils/security/__tests__/totp.test.ts: declare global { var crypto } pattern
 *     for Web Crypto API polyfill (required by the language).
 *
 * react-hooks/exhaustive-deps
 *   - src/app/properties/page.tsx: Intentional sync-on-URL-change effects that must
 *     not re-run when the store setter references change.
 */

export default [{
  ignores: ["node_modules/**", ".next/**", "out/**", "dist/**", "coverage/**"],
}, {
  files: ["src/**/*.{ts,tsx}"],
  languageOptions: {
    parser: tsParser,
    parserOptions: {
      project: ["./tsconfig.json"],
      tsconfigRootDir: import.meta.dirname,
      ecmaVersion: "latest",
      sourceType: "module",
    },
  },
  plugins: {
    "@typescript-eslint": tseslint,
  },
  rules: {
    // Warn on `as any` / `: any` in new code; existing justified survivors are
    // documented in docs/as-any-survivors.md.  Set to "warn" so CI surfaces
    // regressions without hard-failing on the one remaining legacy site.
    "@typescript-eslint/no-explicit-any": "warn",
    "@typescript-eslint/consistent-type-imports": "off",
    "@typescript-eslint/no-unnecessary-type-assertion": "off",
    // Escalated to `error` to enforce routing through the structured logger.
    // The override below re-enables console.* in `src/utils/logger.ts` only —
    // that file is the canonical, mandatory sink for the logger pipeline.
    "no-console": "error",
  },
}, {
  // The structured logger sink is the only file allowed to call console.*
  // directly. Any other module must go through `logger.{debug,info,warn,error}`.
  files: ["src/utils/logger.ts"],
  rules: {
    "no-console": "off",
  },
}, {
  // Apply `no-console` to everything else so future direct console.* calls
  // are caught at lint time.
  files: ["src/**/*.{ts,tsx}"],
  ignores: [
    // earlyErrorSuppression.ts intentionally uses raw console; logger.ts
    // and the deprecated structuredLogger.ts wrap it.
    "src/utils/earlyErrorSuppression.ts",
    "src/utils/logger.ts",
    "src/utils/structuredLogger.ts",
    // extensionDetection.ts intentionally overrides console.error to filter
    // noisy browser-extension errors that are not actionable.
    "src/utils/extensionDetection.ts",
    // Test files and stories legitimately use console.* for debug output
    // and assertions.
    "src/**/__tests__/**",
    "src/**/*.test.{ts,tsx}",
    "src/**/*.stories.{ts,tsx}",
  ],
  rules: {
    // disallow all console.* (no `allow` options provided).
    "no-console": "error",
  },
}, ...storybook.configs["flat/recommended"]];
